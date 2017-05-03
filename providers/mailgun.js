'use strict';
var nodemailer = require('nodemailer');
var mailgunTransport = require('nodemailer-mailgun-transport');
var emailConfig = require('config').get('mailgun');
var logger = require('../helpers/logger')('mailgun');
var async = require('async');
var validator = require('validator');
var uuid = require('uuid');

var queue = async.queue(function(params, callback) {
    var log = logger.start('queueTask');
    log.debug('sending', params.id);

    params.transporter.sendMail(params.payload, function(err) {
        if (err) {
            log.error('error while sending email', {
                id: params.id,
                payload: params.payload,
                error: err
            });
        } else {
            log.info('sent email', params.id);
        }
        callback();
    });
}, 1);

var send = function(to, email, transporter, config, cb) {
    var log = logger.start('send');
    if (!to) {
        log.info('no email configured', email);
        return cb(null, email);
    }

    if (!validator.isEmail(to)) {
        log.error('email not sent. Reason - invalid email: ' + to, email);
        return cb(null, email);
    }

    if (emailConfig.disabled) {
        log.info('email disabled', email);
        if (cb) {
            cb(null, email);
        }
        return;
    }
    var payload = {
        from: email.from || config.from,
        to: to,
        subject: email.subject,
        html: email.body
    };

    if (email.attachments) {
        payload.attachments = email.attachments;
    }

    var id = uuid.v4();

    log.debug('queuing', {
        id: id,
        payload: payload
    });

    queue.push({
        transporter: transporter,
        payload: payload,
        id: id
    });
    if (cb) {
        cb(null, email);
    }
};

var getTransport = function(config) {
    return nodemailer.createTransport(mailgunTransport({
        service: 'Mailgun',
        auth: config
    }));
};

var configuredTrasport = getTransport(emailConfig);


var mailer = module.exports;

mailer.config = function(mailgunConfig) {
    var transport = getTransport(mailgunConfig || emailConfig);

    return {
        send: function(to, email, cb) {
            send(to, email, transport, mailgunConfig || emailConfig, cb);
        }
    };
};

mailer.send = function(to, email, cb) {
    send(to, email, configuredTrasport, emailConfig, cb);
};