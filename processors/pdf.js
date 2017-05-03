'use strict';
var pdf = require('html-pdf');
var logger = require("../helpers/logger")('processors.pdf');
var async = require('async');
var formatter = require('../helpers/template').formatter;
var dataProcessor = require('./data');
var _ = require('underscore');

exports.toStream = function(data, template, callback) {
    toPdf(data, template).toStream(callback);
};

exports.toBuffer = function(data, template, callback) {
    toPdf(data, template).toBuffer(callback);
};

exports.toPath = function(data, template, path, callback) {
    toPdf(data, template).toFile(path, callback);
};

var toPdf = function(data, template) {
    var bodyFormatter = formatter(template.body);
    return pdf.create(bodyFormatter.inject(data), template.config);
};