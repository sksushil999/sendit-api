'use strict';
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var emailConfig = require('config').get('email');
var logger = require('../helpers/logger')('smtp');
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
        setTimeout(function() {
            callback();
        }, 1000);
    });
}, 1);

queue.drain = function() {
    console.log('all items have been processed');
};

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

    return nodemailer.createTransport(smtpTransport({
        host: config.host,
        port: config.port,
        auth: {
            user: config.auth.user,
            pass: config.auth.password
        }
    }));
};

var configuredTrasport = getTransport(emailConfig);


var mailer = module.exports;

mailer.config = function(config) {
    var transport = getTransport(config || emailConfig);

    return {
        send: function(to, email, cb) {
            send(to, email, transport, config || emailConfig, cb);
        }
    };
};

mailer.send = function(to, email, cb) {
    send(to, email, configuredTrasport, emailConfig, cb);
};