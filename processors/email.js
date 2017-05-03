'use strict';
var logger = require("../helpers/logger")('processors.email');
var async = require('async');
var Client = require('node-rest-client').Client;
var formatter = require('../helpers/template').formatter;
var dataProcessor = require('./data');
var _ = require('underscore');

var pdfProcessor = require('./pdf');

var validateEmail = function validateEmail(emailId) {
    var pattern = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    var junks = ["noreply", "no-reply", "no_reply", "not_set", "notset", "not-set"];
    var emailValid = pattern.test(emailId);
    if (emailValid) {
        var junkFound = _.find(junks, function(junk) {
            return emailId.startsWith(junk);
        });
        if (junkFound) {
            return false;
        }
        return true;
    }
    return false;
};

module.exports.process = function(items, config, template, client, callback) {
    var log = logger.start('process');
    var count = 0;

    var emailClient = getEmailClient(client.config);

    var subjectFormatter = formatter(template.subject);
    var bodyFormatter = formatter(template.body);

    var attachedFileNameFormatter;
    if (template.attachment) {
        attachedFileNameFormatter = formatter(template.attachment.subject);
    }

    async.each(items, function(item, cb) {
        var email = {
            subject: subjectFormatter.inject(item),
            body: bodyFormatter.inject(item)
        };

        if (config.to.field) {
            email.to = item;
            var toParts = config.to.field.split('.');
            _(toParts).each(function(part) {
                email.to = email.to[part];
            });
        } else {
            email.to = config.to;
        }

        //todo - check if the user exist with this email and what is the status of user.notification

        if (config.from.field) {
            email.from = item;
            var fromParts = config.from.field.split('.');
            _(fromParts).each(function(part) {
                email.from = email.from[part];
            });
        } else {
            email.from = config.from;
        }
        var emailValid = validateEmail(email.to);
        if (!emailValid) {
            return cb();
        }

        count++;

        if (!template.attachment) {
            return emailClient.send(email.to, email, cb);
        }

        pdfProcessor.toBuffer(item, template.attachment, function(err, buffer) {
            if (err) {
                return cb(err);
            }
            email.attachments = [{
                filename: attachedFileNameFormatter.inject(item),
                content: buffer
            }];

            emailClient.send(email.to, email, cb);
        });
    }, function(err) {
        callback(err, count);
    });

};

var getEmailClient = function(clientConfig) {
    var emailProvider = clientConfig.email.provider;
    var emailConfig = clientConfig[emailProvider];
    return require('../providers/' + emailProvider).config(emailConfig);
};