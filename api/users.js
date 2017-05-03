'use strict';
var async = require('async');
var db = require('../models');
var mappers = require('../mappers');
var _ = require('underscore');
var auth = require('../helpers/auth');

exports.create = function(req, res) {
    var model = req.body;
    var client = req.client;

    var subscriptionsSettings = req.client.config.notifications ? req.client.config.notifications.subscriptions : {};

    async.waterfall([
            function(cb) {
                var newUser = new db.user({
                    name: model.name,
                    email: model.email,
                    phone: model.phone,
                    trackingId: model.userId,
                    status: 'new',
                    devices: [{
                        id: model.deviceId,
                    }],
                    client: client.id,
                    notifications: {
                        enabled: subscriptionsSettings.enabledByDefault,
                        subscriptions: []
                    }
                });
                return cb(null, newUser);
            },
            function(user, cb) {
                user.token = auth.getToken(user);
                user.save()
                    .then(function(user) {
                        return cb(null, user);
                    }).catch(cb);
            }
        ],
        function(err, user) {
            if (err) {
                return res.failure(err);
            }
            return res.data(mappers.user.toModel(user));
        });
};

exports.get = function(req, res) {
    db.user.findOne(req.filters.add('_id', req.params.id).where)
        .populate('client')
        .exec(function(err, user) {
            if (err) {
                return res.failure(err);
            }

            if (!user) {
                return res.failure('no record found');
            }

            user.token = auth.getToken({
                id: user.id,
                client: {
                    id: user.client.id
                }
            });

            res.data(mappers.user.toModel(user));
        });
};

exports.subscribe = function(req, res) {
    var client = req.client;
    var code = req.params.code;
    var model = req.body;
    async.waterfall([
        function(cb) {
            db.user.findOne({
                trackingId: model.userId,
                client: client.id
            }).then(function(user) {
                if (!user) {
                    var newUser = new db.user({
                        email: model.email,
                        phone: model.phone,
                        trackingId: model.userId,
                        devices: [{
                            id: model.deviceId,
                        }],
                        client: client.id,
                        status: 'new'
                    });
                    return cb(null, newUser);
                } else {
                    if (model.email) {
                        user.email = model.email;
                    }
                    if (model.phone) {
                        user.phone = model.phone;
                    }
                    if (model.deviceId) {
                        var registeredDevice = _(user.devices).find(function(device) {
                            return device.id === model.deviceId;
                        });
                        if (!registeredDevice) {
                            var device = {
                                id: model.deviceId
                            };
                            user.devices.push(device);
                        }
                    }
                    return cb(null, user);
                }
            });
        },
        function(user, cb) {
            //var newUser = true;newUser && 
            if (client.config.notifications.subscriptions.enabledByDefault) {
                user.notifications.enabled = true;
            }
            if (code === 'all') {
                user.notifications.enabled = true;
            } else {
                var subscription = _(user.notifications.subscriptions).find(function(subscription) {
                    return subscription.key === code;
                });
                if (!subscription) {
                    subscription = {
                        key: code,
                        value: true
                    };
                    user.notifications.subscriptions.push(subscription);
                } else {
                    var indexOfItem = user.notifications.subscriptions.indexOf(subscription);
                    user.notifications.subscriptions[indexOfItem].value = true;
                }
            }
            return cb(null, user);

        },
        function(user, cb) {
            if (!user.token) {
                user.token = auth.getToken(user);
                user.save()
                    .then(function(user) {
                        return cb(null, user);
                    }).catch(cb);
            } else {
                user.save()
                    .then(function(user) {
                        return cb(null, user);
                    }).catch(cb);
            }
        }
    ], function(err, user) {
        if (err) {
            return res.failure("Unable to Subscribe");
        }
        return res.data(mappers.user.toModel(user));

    });
};

exports.unsubscribe = function(req, res) {
    // var token = req.params.token;
    var client = req.client;
    var code = req.params.code;
    var model = req.body;
    async.waterfall([
        function(cb) {
            db.user.findOne({
                trackingId: model.userId,
                client: client.id
            }).then(function(user) {
                if (!user) {
                    return cb('user not Found');
                } else {
                    if (code === 'all') {
                        user.notifications.enabled = false; // kind of DND
                    } else {
                        var subscription = _(user.notifications.subscriptions).find(function(subscription) {
                            return subscription.key === code;
                        });
                        if (!subscription) {
                            subscription = {
                                key: code,
                                value: false
                            };
                            user.notifications.subscriptions.push(subscription);
                        } else {
                            var indexOfItem = user.notifications.subscriptions.indexOf(subscription);
                            user.notifications.subscriptions[indexOfItem].value = false;
                        }
                    }
                    return cb(null, user);
                }
            });
        },
        function(user, cb) {
            user.save()
                .then(function(user) {
                    return cb(null, user);
                }).catch(cb);
        }
    ], function(err, user) {
        if (err) {
            return res.failure("Unable to UnSubscribe");
        } else {
            return res.data(mappers.user.toModel(user));
        }
    });

};