'use strict';
var Client = require('node-rest-client').Client;
var client = new Client();

var _ = require('underscore');
var defaultConfig = require('config').get('oneSignal');

var notifier = module.exports;

var argsBuilder = function(config) {
    var args = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": config.Authorization
        },
        data: {
            "app_id": config.app_id,
            "data": {},
            "headings": {},
            "contents": {},
            "include_player_ids": [],
            "android_group": config.android_group || ''
        }
    };
    return args;
};


notifier.config = function(config) {

    return {
        push: function(deviceIds, subject, body, data, callback) {
            send(config, deviceIds, subject, body, data, callback);
        }
    };
};

// model = {subject, message, data}
exports.push = function(deviceIds, subject, body, data, callback) {
    send(defaultConfig, deviceIds, subject, body, data, callback);
};

var send = function(config, deviceIds, subject, body, data, callback) {

    var args = argsBuilder(config);

    if (data) {
        args.data.data = data;
    }

    args.data.headings.en = subject;
    args.data.contents.en = body;

    if (typeof deviceIds === Array) {
        _(deviceIds).each(function(id) {
            args.data.include_player_ids.push(id);
        });
    } else {
        args.data.include_player_ids.push(deviceIds);
    }

    if (config.testDeviceId) {
        args.data.include_player_ids.push(defaultConfig.testDeviceId);
    }

    client.post(config.url, args, function(data, response) {
        if (callback) {
            callback();
        }
    });
};

exports.send = send;