'use strict';
var jsonfile = require('jsonfile');
var appRoot = require('app-root-path');
var fs = require('fs');
var async = require('async');

exports.models = function(model) {
    var root = appRoot + '/data/' + model + '/';

    return {
        findOne: function(query, callback) {

            var file;

            if (query.id) {
                file = root + query.id + '.json';
            } else if (query.code) {
                file = root + query.code + '.json';
            } else {
                return callback('this query is not supported');
            }

            jsonfile.readFile(file, callback);
        },
        find: function(query, callback) {

            var files = fs.readdirSync(root);

            var data = [];

            async.each(files, function(file, cb) {
                if (file === 'placeholder.txt') {
                    return cb(null);
                }

                jsonfile.readFile(root + file, function(err, item) {
                    if (err) {
                        return cb(err);
                    }
                    data.push(item);
                    return cb(err);
                });

            }, function(err) {
                return callback(err, data);
            });

        }
    };
};