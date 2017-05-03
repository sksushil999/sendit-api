'use strict';

var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

module.exports = function(option) {
    var transport = nodemailer.createTransport(mandrillTransport(option));
    return transport;
};