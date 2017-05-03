'use strict';
var smsConfig = require('config').get('routesms');
var Client = require('node-rest-client').Client;
var logger = require('../helpers/logger')('routesms');

exports.sms = function(mobile, message, callback) {
    send(smsConfig, mobile, message, callback);
};
var send = function(config, mobile, message, callback) {
    var log = logger.start('send');
    log.info({
        message: message,
        mobile: mobile
    });
    var client = new Client();
    client.get(config.url +
        "?username=" + config.userName +
        "&password=" + config.password +
        "&type=" + config.type +
        "&dlr=" + config.dlr +
        "&destination=" + mobile +
        "&source=" + config.source +
        "&message=" + message,
        function(data) {
            log.debug(data);
            if (callback) {
                callback(null);
            }
        });
};
exports.send = send;