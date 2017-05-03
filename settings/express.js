'use strict';
var express = require('express');
var path = require('path');

var logger = require("../helpers/logger")('config.express');
var bodyParser = require('body-parser');

module.exports.configure = function(app) {
    var log = logger.start('config');
    app.use(function(err, req, res, next) {
        if (err) {
            (res.log || log).error(err.stack);
            if (req.xhr) {
                res.send(500, { error: 'Something blew up!' });
            } else {
                next(err);
            }

            return;
        }
        next();
    });

    app.use(require('morgan')({ "stream": logger.stream }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    var root = path.normalize(__dirname + './../');
    app.set('views', path.join(root, 'views'));
    app.set('view engine', 'jade');
    app.use(express.static(path.join(root, 'public')));
    //app.use(bodyParser({ limit: '50mb', keepExtensions: true, uploadDir: __dirname + '/public/uploads' }));
};