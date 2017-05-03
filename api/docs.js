'use strict';
var async = require('async');
var db = require('../models');

var formatter = require('../helpers/template').formatter;
var _ = require('underscore');

var dataProcessor = require('../processors/data');
var pdfProcessor = require('../processors/pdf');

exports.getPdf = function(req, res) {
    var model = req.body;

    async.waterfall([
        function(cb) {
            db.job.findOne(req.filters.add('code', req.params.jobCode).where)
                .populate('template')
                .exec(function(err, job) {
                    if (err) {
                        return cb(err);
                    }
                    if (!job) {
                        return cb("job with code '" + req.params.jobCode + "'not found ");
                    }
                    cb(null, job);
                });
        },
        function(job, cb) {
            var dataSource = job.data.source;
            dataSource.inject = dataSource.inject || {};
            dataSource.inject.dataId = req.params.dataId;

            dataProcessor.fetch(job.data, function(err, items) {
                res.log.debug(items);
                cb(err, items, job.template);
            });
        },
        function(items, template, cb) {
            pdfProcessor.toBuffer(items[0], template, cb);
        }
    ], function(err, buffer) {
        if (err) {
            return res.failure(err);
        }

        res.contentType("application/pdf");
        res.header('Content-disposition', 'inline; filename=' +
            req.params.jobCode + '-' + req.params.dataId + '.pdf');
        res.send(buffer);

    });
};

exports.convertToPdf = function(req, res) {
    var model = req.body;

    async.waterfall([
        function(cb) {
            db.job.findOne(req.filters.add('code', req.params.jobCode).where)
                .populate('template')
                .exec(function(err, job) {
                    if (err) {
                        return cb(err);
                    }

                    if (!job) {
                        return cb("job with code '" + req.params.jobCode + "'not found ");
                    }
                    cb(null, job.template);
                });
        },
        function(template, cb) {
            pdfProcessor.toBuffer(model, template, cb);
        }
    ], function(err, buffer) {
        if (err) {
            return res.failure(err);
        }

        res.contentType("application/pdf");
        res.header('Content-disposition', 'inline; filename=' +
            req.params.jobCode + '-' + req.params.dataId + '.pdf');
        res.send(buffer);

    });
};