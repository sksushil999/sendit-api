'use strict';
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var emailConfig = require('config').get('email');

var send = function(to, email, transporter, config, cb) {
    var payload = {
        from: email.from || config.from,
        to: to,
        subject: email.subject,
        html: email.body
    };
    transporter.sendMail(payload, function(err) {
        cb(err, email);
    });
};

var getTransport = function(config) {

    return nodemailer.createTransport(smtpTransport({
        host: 'smtp.gmail.com',
        port: 465,
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