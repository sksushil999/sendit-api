'use strict';
var jwt = require('jsonwebtoken');
var db = require('../models');
var auth = require('config').get('auth');
var responseHelper = require('../helpers/response');
var async = require('async');

exports.requiresUser = function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) {
        return res.accessDenied('token is required.');
    }
    extractToken(token, req, res, next);
};

var extractToken = function(token, req, res, next) {
    jwt.verify(token, auth.secret, {
        ignoreExpiration: true
    }, function(err, claims) {
        if (err) {
            return res.accessDenied('invalid token', 403, err);
        }
        async.parallel({
            user: function(cb) {
                db.user.findOne({
                    _id: claims.userId
                }).exec(function(err, user) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, user);
                });
            },
            client: function(cb) {
                db.client.findOne({
                    _id: claims.clientId
                }).populate('owner').exec(function(err, client) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, client);
                });
            }
        }, function(err, result) {
            if (result.client.owner.id === result.user.id) {
                result.user.isOwner = true;
            }

            req.client = result.client;
            req.user = result.user;
            req.filters.add('client', result.client.id.toObjectId());

            next();
        });
    });
};

exports.requiresClient = function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        return extractToken(token, req, res, next);
    }

    var clientCode = req.body.clientCode || req.query.clientCode || req.headers['client-code'];

    if (!clientCode) {
        return res.accessDenied('client-code is required.');
    }

    db.client.findOne({
        code: clientCode
    }).populate('owner').exec(function(err, client) {
        if (err) {
            res.log.error(err);
            return res.accessDenied('error occured while getting client');
        }

        if (!client) {
            return res.accessDenied('client does not exist.');
        }

        if (client.status !== 'active') {
            return res.accessDenied('client is not active.');
        }

        req.client = client;
        req.filters.add('client', client.id.toObjectId());
        next();
    });
};

exports.getToken = function(user) {
    var claims = {
        clientId: user.client.id,
        userId: user.id
    };
    return jwt.sign(claims, auth.secret, {
        expiresIn: auth.tokenPeriod || 1440
    });
};