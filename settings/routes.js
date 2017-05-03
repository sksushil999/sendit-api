'use strict';
var requiresUser = require('../helpers/auth').requiresUser;
var requiresClient = require('../helpers/auth').requiresClient;
var apiRoutes = require('../helpers/apiRoutes');
var fs = require('fs');
var loggerConfig = require('config').get('logger');
var appRoot = require('app-root-path');

module.exports.configure = function(app) {
    app.get('/', function(req, res) {
        res.render('index', { title: 'ATOMS API' });
    });

    app.get('/logs', function(req, res) {
        var filePath = appRoot + '/' + loggerConfig.file.filename;

        fs.readFile(filePath, function(err, data) {
            res.contentType("application/json");
            res.send(data);
        });
    });

    app.get('/swagger', function(req, res) {
        fs.readFile('./public/swagger.html', function(err, data) {
            res.contentType("text/html");
            res.send(data);
        });
    });
    var api = apiRoutes(app);

    api.model('users').register([{
        action: 'GET',
        method: 'get',
        url: '/:id',
        filter: requiresClient
    }, {
        action: 'POST',
        method: 'create',
        filter: requiresClient
    }, {
        action: 'POST',
        method: 'subscribe',
        url: '/:code/subscribe',
        filter: requiresClient
    }, {
        action: 'GET',
        method: 'unsubscribe',
        url: '/unsubscribe/:token'
    }, {
        action: 'POST',
        method: 'unsubscribe',
        url: '/:code/unsubscribe',
        filter: requiresClient
    }]);

    api.model('diagnostics').register('REST');
    api.model('messages')
        .register('REST', requiresUser)
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            filter: requiresClient // TODO only admin should be able to do this
        }]);

    api.model({
            root: 'emails',
            controller: 'messages'
        })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            filter: [requiresClient, function(req, res, next) {
                    req.body.type = 'email';
                    next();
                }] // TODO only admin should be able to do this
        }]);

    api.model({
            root: 'sms',
            controller: 'messages'
        })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            filter: [requiresClient, function(req, res, next) {
                    req.body.type = 'sms';
                    next();
                }] // TODO only admin should be able to do this
        }]);

    api.model({
            root: 'push',
            controller: 'messages'
        })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            filter: [requiresClient, function(req, res, next) {
                    req.body.type = 'push';
                    next();
                }] // TODO only admin should be able to do this
        }]);

    api.model('jobs')
        .register('REST', requiresUser)
        .register([{
            action: 'POST',
            method: 'run',
            url: '/:code/run',
            filter: requiresUser
        }]);

    api.model('docs').register([{
        action: 'GET',
        method: 'getPdf',
        url: '/:jobCode/:dataId.pdf',
        filter: requiresClient
    }, {
        action: 'POST',
        method: 'convertToPdf',
        url: '/:jobCode.pdf',
        filter: requiresClient
    }]);

    api.model('templates').register('REST', requiresUser);
    api.model('clients')
        .register([{
            action: 'POST',
            method: 'create',
        }, {
            action: 'GET',
            method: 'get',
            url: '/my',
            filter: requiresUser
        }, {
            action: 'PUT',
            method: 'update',
            url: '/my',
            filter: requiresUser
        }]);

};