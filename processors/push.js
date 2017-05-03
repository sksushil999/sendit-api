'use strict';
var logger = require("../helpers/logger")('processors.email');
var async = require('async');
var Client = require('node-rest-client').Client;
var formatter = require('../helpers/template').formatter;
var dataProcessor = require('./data');
var _ = require('underscore');

module.exports.process = function(items, config, template, client, callback) {
    var log = logger.start('process');
    var count = 0;
    var pushClient = getPushClient(client.config);
    var subjectFormatter = formatter(template.subject);
    var bodyFormatter = formatter(template.body);

    async.each(items, function(item, cb) {
        var push = {
            subject: subjectFormatter.inject(item),
            body: bodyFormatter.inject(item)
        };
        if (config.to.field) {
            push.to = item;
            var toParts = config.to.field.split('.');
            _(toParts).each(function(part) {
                push.to = push.to.user[part];
            });
        } else {
            push.to = config.to;
        }

        //todo - check if the user exist with this email and what is the status of user.notification

        if (config.from.field) {
            push.from = item;
            var fromParts = config.from.field.split('.');
            _(fromParts).each(function(part) {
                push.from = push.from[part];
            });
        } else {
            push.from = config.from;
        }

        count++;
        if (client.config.oneSignal) {
            return pushClient.send(client.config.oneSignal, push.to, push.subject, push.body, item, cb);
        } else {
            return pushClient.push(push.to, push.subject, push.body, item, cb);

        }

    }, function(err) {
        callback(err, count);
    });

};

var getPushClient = function(clientConfig) {
    var pushProvider = clientConfig.push.provider;
    return require('../providers/' + pushProvider);
};