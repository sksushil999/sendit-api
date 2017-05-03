'use strict';
var async = require('async');
var db = require('../models');

var Client = require('node-rest-client').Client;
var formatter = require('../helpers/template').formatter;
var _ = require('underscore');

var dataProcessor = require('../processors/data');
var emailProcessor = require('../processors/email');
var smsProcessor = require('../processors/sms');
var pushProcessor = require('../processors/push');


exports.create = function(req, res) {
    async.waterfall([
        function(cb) {
            if (req.body.job && req.body.job.id) {
                db.job.findOne({ id: req.body.job.id }, cb);
            } else {
                cb(null, req.body);
            }
        },
        function(job, cb) {
            async.parallel({
                data: function(cb) {
                    cb(null, job.data);
                },
                template: function(cb) {
                    if (job.template.body) {
                        return cb(null, job.template);
                    }
                    var query = {};
                    if (job.template.id) {
                        query.id = job.template.id;
                    } else if (job.template.code) {
                        query.code = job.template.code;
                    } else {
                        return cb('template id or code is required');
                    }
                    db.template.findOne(query, cb);
                },
                client: function(cb) {
                    if (job.client.name) {
                        return cb(null, job.client);
                    }
                    var query = {};
                    if (job.client.id) {
                        query.id = job.client.id;
                    } else if (job.client.code) {
                        query.code = job.client.code;
                    } else {
                        return cb('client id or code is required');
                    }
                    db.client.findOne(query, cb);
                }
            }, function(err, results) {
                cb(err, results.data, results.template, results.client);
            });
        },
        function(jobData, jobTemplate, jobClient, cb) {
            var processor = require('../processors/email');
            processor.process(jobData, jobTemplate, jobClient, cb);
        }
    ], function(err) {
        if (err) {
            return res.failure(err);
        }
        res.success();
    });
};

exports.send = function(req, res) {
    var model = req.body;


    // TODO: check if can send message

    if (!model.from) {
        model.from = req.client.owner.email;
    }

    async.waterfall([
        function(cb) {
            var template = model.template;
            if (template.id) {
                db.template
                    .findOne({ _id: template.id })
                    .populate('attachment')
                    .exec(cb);
            } else if (template.code) {
                db.template
                    .findOne(req.filters.add('code', template.code).where)
                    .populate('attachment')
                    .exec(cb);
            } else {
                cb(null, template);
            }
        },
        function(template, cb) {
            dataProcessor.fetch(model.data, function(err, items) {
                cb(err, items, template);
            });
        },
        function(items, template, cb) {
            var config = {
                to: model.to,
                from: model.from
            };

            var processor = require('../processors/' + model.type);
            processor.process(items, config, template, req.client, cb);
        }
    ], function(err, count) {
        if (err) {
            return res.failure(err);
        }
        res.success(count);
    });
};