'use strict';
var async = require('async');
var db = require('../models');
var mappers = require('../mappers');
var _ = require('underscore');
var auth = require('../helpers/auth');

exports.create = function(req, res) {
    var model = req.body;

    async.waterfall([
        function(cb) {
            var owner = new db.user({
                name: model.owner.name,
                email: model.owner.email
            });
            owner.save(function(err, user) {
                cb(err, user);
            });
        },
        function(owner, cb) {
            var client = new db.client({
                code: model.code,
                name: model.name,
                config: model.config,
                status: 'active',
            });

            client.owner = owner;

            client.save(function(err) {
                if (err) {
                    return cb(err);
                }

                owner.client = client;
                owner.save(function(err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, client, owner);
                });
            });
        },
        function(client, owner, cb) {
            var token = auth.getToken({
                id: owner.id,
                client: {
                    id: client.id
                }
            });

            // to do send confirmation link in token
            cb(null, client, token);
        }
    ], function(err, client, token) {
        if (err) {
            return res.failure(err);
        }

        var model = mappers.client.toModel(client);
        model.owner.token = token;

        res.data(model);
    });
};

exports.get = function(req, res) {
    db.client.findOne({
            _id: req.client.id
        })
        .populate('owner')
        .exec(function(err, client) {
            if (err) {
                return res.failure(err);
            }
            res.data(mappers.client.toModel(client));
        });
};

exports.update = function(req, res) {
    var model = req.body;

    async.waterfall([
        function(cb) {
            db.client.findOne({
                    _id: req.client.id
                })
                .populate('owner')
                .exec(cb);
        },
        function(client, cb) {
            if (model.name) {
                client.name = model.name;
            }
            if (model.config) {
                client.config = model.config;
            }
            if (model.status) {
                client.status = model.status;
            }

            client.save(cb);
        }
    ], function(err, client) {
        if (err) {
            return res.failure(err);
        }
        res.data(mappers.client.toModel(client));
    });
};