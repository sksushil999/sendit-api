'use strict';
var db = require('../models');
var async = require('async');

exports.canCreate = function(req, callback) {
    var model = req.body;

    if (!model.code) {
        return callback('code is required');
    }

    if (!model.name) {
        return callback('name is required');
    }

    if (!model.owner) {
        return callback('owner is required');
    }

    if (!model.owner.name) {
        return callback('owner name is required');
    }

    if (!model.owner.email) {
        return callback('owner email is required');
    }

    async.waterfall([
        function(cb) {
            db.client.findOne({
                code: model.code,
            }).exec(function(err, entity) {
                if (err) {
                    return cb(err);
                }
                if (entity) {
                    return cb('code already exists');
                }
                cb(null);
            });

        },
    ], function(err) {
        callback(err);
    });
};