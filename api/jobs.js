'use strict';
var async = require('async');
var db = require('../models');
var mappers = require('../mappers');
var _ = require('underscore');
var jobProcessor = require('../processors/job');

exports.create = function(req, res) {
    var model = req.body;

    async.waterfall([
        function(cb) {
            if (!model.template) {
                return cb(null, null);
            }

            if (model.template.id) {
                req.filters.add('_id', model.template.id);
            } else if (model.template.code) {
                req.filters.add('code', model.template.code);
            }

            db.template.findOne(req.filters.where).exec(cb);
        },
        function(template, cb) {
            var job = new db.job({
                code: model.code,
                name: model.name,
                processor: model.processor,
                status: 'active',
                data: model.data,
                config: model.config,

                schedule: {},
                lastRun: {}
            });

            if (model.schedule) {
                job.schedule.hour = model.schedule.hour;
                job.schedule.minute = model.schedule.minute;
            }

            if (template) {
                job.template = template;
            }

            job.client = req.client;

            job.save(function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null, job);
            });
        },

    ], function(err, job) {
        if (err) {
            return res.failure(err);
        }
        res.data(mappers.job.toModel(job));
    });
};

exports.get = function(req, res) {
    db.job.findOne(req.filters.add('_id', req.params.id).where)
        .populate('template')
        .exec(function(err, job) {
            if (err) {
                return res.failure(err);
            }
            res.data(mappers.job.toModel(job));
        });
};

exports.search = function(req, res) {
    db.job.find(req.filters.where)
        .populate('template')
        .exec(function(err, jobs) {
            if (err) {
                return res.failure(err);
            }
            res.page(mappers.job.toModels(jobs));
        });
};

exports.run = function(req, res) {
    db.job.findOne({
            client: req.client.id,
            code: req.params.code

        })
        .populate('template client')
        .exec(function(err, job) {
            if (err) {
                return res.failure(err);
            }

            jobProcessor.run(job, function(err) {
                if (err) {
                    return res.failure(err);
                }
                res.success('job ran successfully');
            });
        });
};