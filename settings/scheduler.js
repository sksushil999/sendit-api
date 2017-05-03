'use strict';
var logger = require("../helpers/logger")('settings.scheduler');
var schedule = require('node-schedule');
var db = require('../models');
var async = require('async');
var systemConfig = require('config').get('system');
var _ = require('underscore');

var jobProcessor = require('../processors/job').run;

var runJob = function(jobToRun) {
    async.waterfall([
        function(cb) {
            db.job.findOne({ _id: jobToRun._id })
                .populate('template client')
                .exec(function(err, job) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, job);
                });
        },
        function(job, cb) {
            jobProcessor(job, function(err, count) {
                cb(err, job, count);
            });
        }
    ], function(err, job, count) {

        var emailConfig = job.client.config.email;
        var emailClient = require('../providers/' + emailConfig.provider).config(emailConfig);
        var message = {
            from: systemConfig.emailId
        };

        if (err) {
            message.subject = 'Failed - ' + job.name;
            message.body = err;
        } else {
            message.subject = 'Completed - ' + job.name;
            message.body = "Processed " + count + " records.";
        }

        _(jobToRun.config.notify).each(function(to) {
            emailClient.send(to, message);
        });
    });
};

module.exports.configure = function(app) {
    var log = logger.start('configure');

    var scheduleJob = function(job, rule) {
        schedule.scheduleJob(rule, function() {
            runJob(job);
        });
    };
    db.job.find({
        status: 'active',
        'schedule.hour': {
            $gt: 0
        }
    }).populate('client template').exec(function(err, jobs) {
        if (err) {
            log.error(err);
            return;
        }

        log.debug('jobs count ' + jobs.length);

        _(jobs).each(function(job) {
            if (!job.schedule.hour) {
                return;
            }
            var rule = new schedule.RecurrenceRule();
            rule.hour = job.schedule.hour;
            rule.minute = job.schedule.minute;

            log.info('scheduling', {
                job: {
                    id: job.id,
                    code: job.code
                },
                client: {
                    id: job.client.id,
                    code: job.client.code
                },
                schedule: {
                    hour: job.schedule.hour,
                    minute: job.schedule.minute
                }
            });

            scheduleJob(job, rule);
        });
    });
};