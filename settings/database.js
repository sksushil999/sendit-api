'use strict';
var fs = require('fs');
var join = require('path').join;
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var dbConfig = require('config').get('dbServer');
var logger = require("../helpers/logger")('settings.database');

module.exports.configure = function() {
    logger.debug('host - ' + dbConfig.host);
    var connect = function() {
        mongoose.connect(uriUtil.formatMongoose(dbConfig.host));
    };
    connect();

    var db = mongoose.connection;
    db.on('error', console.log);
    db.on('disconnected', connect);
    require('../models');
};