'use strict';
var db = require('../models');
var async = require('async');

exports.canCreate = function(req, callback) {
    var model = req.body;

    if (!model.code) {
        return callback('code is required');
    }

    if (model.type === 'doc' && !model.data.source) {
        return callback('data source is required for type doc');
    }

    db.job.findOne({
        code: model.code,
        "client.id": req.client.id
    }).exec(function(err, job) {
        if (err) {
            return callback(err);
        }
        if (job) {
            return callback('code already exists');
        }
        callback(null, job);
    });
};

exports.canRun = function(req, callback) {
    var model = req.body;

    if (!req.params.code) {
        return callback('code is required');
    }

    callback();
};