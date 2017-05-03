'use strict';
var async = require('async');
var db = require('../models');
var dataProcessor = require('../processors/data');
var logger = require("../helpers/logger")('processors.job');

exports.run = function(job, callback) {
    var log = logger.start(job.client.code + ':' + job.code);
    var lastRun = new Date();

    async.waterfall([
        function(cb) {
            log.debug('fetching data');
            dataProcessor.fetch(job.data, function(err, items) {
                cb(err, items, job);
            });
        },
        function(items, job, cb) {
            var jobProcessor = require('../processors/' + job.processor);
            log.debug('processing ' + job.processor);
            jobProcessor.process(items, {
                to: job.config.to,
                from: job.config.from
            }, job.template, job.client, function(err, count) {
                if (err) {
                    return cb(err);
                }
                cb(null, job, count);
            });
        }
    ], function(err, job, count) {
        job.lastRun.date = lastRun;

        if (err) {
            job.lastRun.status = 'failed';
            job.lastRun.error = JSON.stringify(err);
            log.error(err);

        } else {
            job.lastRun.status = 'success';
            job.lastRun.error = null;
            job.lastRun.lastSuccess = lastRun;
            log.info('complete');
        }

        job.save(function(saveErr) {
            callback(err, count);
        });
    });
};