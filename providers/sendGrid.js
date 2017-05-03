'use strict';
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');


module.exports = function(options) {
    var mailer = nodemailer.createTransport(sgTransport(options));
    return mailer;
};