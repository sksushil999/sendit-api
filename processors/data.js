'use strict';

var logger = require("../helpers/logger")('processors.data');
var async = require('async');
var HttpClient = require('node-rest-client').Client;
var formatter = require('../helpers/template').formatter;
var _ = require('underscore');


// get data as array
module.exports.fetch = function(data, callback) {
    var log = logger.start('fetch');
    if (!data.source) {
        log.debug('using data', { data: data });
        return callback(null, convertToArray(data));
    }

    if (data.source.url) {
        if (data.source.inject) {
            data.source.url = formatter(data.source.url).inject(data.source.inject);
        }

        getData(data.source, 10, function(err, serverData) {
            if (err || serverData.error) {
                return callback(err || serverData.error);
            } else {
                if (serverData.items) {
                    return callback(null, convertToArray(serverData[data.source.field]));
                }
                return callback(null, convertToArray(serverData.data));
            }

        });
    } else if (data.source.file) {
        if (data.source.inject) {
            data.source.file = formatter(data.source.file).inject(data.source.inject);
        }

        log.info('getting data from file', { file: data.source.file });
        require('jsonfile').readFile(data.source.file, function(err, fileData) {
            return callback(null, convertToArray(fileData[data.source.field]));
        });
    } else {
        log.error("data source not supported", data.source);
        callback("data source not supported");
    }
};


var getData = function(source, attempts, callback) {

    var log = logger.start('getData attempt:' + attempts);
    var httpClient = new HttpClient();
    log.debug('fetching now', { url: source.url });

    httpClient.get(source.url, {
        headers: source.headers
    }, function(serverData) {
        if (serverData.IsSuccess || serverData.isSuccess) {
            callback(null, serverData);
        } else {
            callback(serverData.error || 'server did not return isSuccess');
        }
    }).on('error', function(err) {
        log.error(err);
        if (attempts === 0) {
            return callback('could not get data from -' + source.url, null);
        }
        getData(source, --attempts, callback);
    });
};

var convertToArray = function(data) {
    var items = [];
    if (Array.isArray(data)) {
        items = data;
    } else {
        items.push(data);
    }

    return items;
};