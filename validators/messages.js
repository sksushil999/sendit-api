'use strict';
var db = require('../models');
var async = require('async');

exports.canSend = function(req, callback) {
    var model = req.body;

    if (!model.template) {
        return callback('template is required');
    }

    if (!model.to) {
        return callback('to is required');
    }

    callback(null);
};