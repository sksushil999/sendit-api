'use strict';
var logger = require("../helpers/logger")('processors.email');
var async = require('async');
var Client = require('node-rest-client').Client;
var formatter = require('../helpers/template').formatter;
var dataProcessor = require('./data');
var _ = require('underscore');

var validateMobile = function validateMobile(mobile) {
    var pattern = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    var junks = ["1", "2", "3", "4", "5", "6", '7777777777', '8888888888', '9999999999', '9876543210'];
    var junkFound;
    var mobileValid = pattern.test(mobile);
    if (mobileValid) {
        var countryCode = mobile.startsWith('+');
        if (countryCode) {
            junkFound = _.find(junks, function(junk) {
                return mobile.substring(3).startsWith(junk);
            });
            if (junkFound) {
                return false;
            }
            return true;
        } else {
            junkFound = _.find(junks, function(junk) {
                return mobile.startsWith(junk);
            });
            if (junkFound) {
                return false;
            }
            return true;
        }
    }
    return false;
};

module.exports.process = function(items, config, template, client, callback) {
    var log = logger.start('process');
    var count = 0;
    var smsClient = getSmsClient(client.config);

    var bodyFormatter = formatter(template.body);

    async.each(items, function(item, cb) {
        var sms = {
            body: bodyFormatter.inject(item)
        };
        if (config.to.field) {
            sms.to = item;
            var toParts = config.to.field.split('.');
            _(toParts).each(function(part) {
                sms.to = sms.to[part];
            });
        } else {
            sms.to = config.to;
        }

        //todo - check if the user exist with this email and what is the status of user.notification

        if (config.from.field) {
            sms.from = item;
            var fromParts = config.from.field.split('.');
            _(fromParts).each(function(part) {
                sms.from = sms.from[part];
            });
        } else {
            sms.from = config.from;
        }
        var mobileValid = validateMobile(sms.to);
        if (!mobileValid) {
            return cb();
        }

        count++;

        if (client.config.routesms) {
            return smsClient.send(client.config.routesms, sms.to, sms.body, cb);
        } else {
            return smsClient.sms(sms.to, sms.body, cb);
        }

    }, function(err) {
        callback(err, count);
    });

};

var getSmsClient = function(clientConfig) {
    var smsProvider = clientConfig.sms.provider;
    return require('../providers/' + smsProvider);
};