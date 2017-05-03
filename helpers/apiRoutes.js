'use strict';
var _ = require('underscore');
var path = require('path');
var pathExists = require('path-exists');
var responseHelper = require('./response');

var logger = require('../helpers/logger')();

var validatorFn = function(apiName, action) {
    var actionValidator = 'can' + action.charAt(0).toUpperCase() + action.slice(1);
    // if file does not exist 
    var exists = true;
    if (!pathExists.sync(path.join(__dirname, '../validators/' + apiName + '.js'))) {
        return null;
    }
    var fn = require('../validators/' + apiName)[actionValidator];
    if (!fn) {
        return null;
    }

    return function(req, res, next) {
        fn(req, function(err) {
            if (err) {
                res.failure(err);
                return;
            }
            next();
        });
    };
};

var responseDecoratorFn = function(req, res, next) {
    res.log = logger.start(req.method + ' ' + req.url);
    if (req.body) {
        res.log.debug(req.body);
    }

    var wrapper = responseHelper(res);
    res.accessDenied = wrapper.accessDenied;
    res.failure = wrapper.failure;
    res.success = wrapper.success;
    res.page = wrapper.page;
    res.data = wrapper.data;
    next();
};

var requestDecoratorFn = function(req, res, next) {
    var where = {};
    req.filters = {
        add: function(field, value) {
            where[field] = value;
            return req.filters;
        }
    };
    req.filters.where = where;
    return next();
};

module.exports = function(app, apiOptions) {

    var self = {};
    self.model = function(params) {
        if (!params.root) {
            params = {
                root: params,
                controller: params,
                model: params
            };
        } else {
            if (!params.model) {
                params.model = params.controller;
            }
        }
        //var controller = require((apiOptions && apiOptions.controllers ? apiOptions.controllers + '/' : 'api/') + modelName);
        var routeBase = (apiOptions && apiOptions.rootUrl ? apiOptions.rootUrl + '/' : '/api/') + params.root;

        var routes = {};
        routes.register = function(options, param1, param2, param3) {
            var getHandlerOptions = function(handlerOption) {
                var method = null;
                if (handlerOption.method instanceof String || typeof handlerOption.method === 'string') {
                    var module = (apiOptions && apiOptions.controllers ? apiOptions.controllers + '/' : '../api/') + params.controller;
                    method = require(module)[handlerOption.method];
                } else {
                    method = handlerOption.method;
                }

                var val = {
                    action: handlerOption.action.toUpperCase(),
                    url: routeBase + (handlerOption.url || ''),
                    validator: validatorFn(params.model, handlerOption.method),
                    filter: handlerOption.filter,
                    method: method
                };

                return val;
            };

            var handlerParams = {};

            if (options.action) {
                handlerParams = getHandlerOptions(options);
                handlerParams.filter = handlerParams.filter || param1;
                withApp(app).register(handlerParams);
            } else if (options instanceof Array) {
                _(options).each(function(option) {
                    handlerParams = getHandlerOptions(option);
                    handlerParams.filter = handlerParams.filter || param1;
                    withApp(app).register(handlerParams);
                });
            } else if (options instanceof String || typeof options === 'string') {
                if (options.toUpperCase() === 'REST' || options.toUpperCase() === 'CRUD') {
                    _(crudOptions(param1)).each(function(option) {
                        withApp(app).register(getHandlerOptions(option));
                    });

                } else {
                    handlerParams.action = options.toUpperCase();
                    if (param1 instanceof String || typeof param1 === 'string') {
                        handlerParams.url = routeBase + param1;
                        handlerParams.method = param2;
                        handlerParams.filter = param3;
                    } else {
                        handlerParams.url = routeBase;
                        handlerParams.method = param1;
                        handlerParams.filter = param2;
                    }
                    withApp(app).register(handlerParams);
                }
            }

            return routes;
        };
        return routes;
    };
    return self;
};

var withApp = function(app) {
    return {
        register: function(handlerOptions) {
            if (!handlerOptions.method) {
                return; // the method may not exist at this time;
            }
            var fnArray = [];
            fnArray.push(responseDecoratorFn);
            fnArray.push(requestDecoratorFn);

            if (handlerOptions.filter) {
                if (_.isArray(handlerOptions.filter)) {
                    _.each(handlerOptions.filter, function(filter) {
                        fnArray.push(filter);
                    });
                } else {
                    fnArray.push(handlerOptions.filter);

                }
            }
            if (handlerOptions.validator) {
                fnArray.push(handlerOptions.validator);
            }

            fnArray.push(handlerOptions.method);


            switch (handlerOptions.action.toUpperCase()) {
                case "GET":
                    app.get(handlerOptions.url, fnArray);
                    break;

                case "POST":
                    app.post(handlerOptions.url, fnArray);
                    break;

                case "PUT":
                    app.put(handlerOptions.url, fnArray);
                    break;

                case "DELETE":
                    app.delete(handlerOptions.url, fnArray);
                    break;

                default:
                    break;
            }
        }
    };
};

var crudOptions = function(filterFn) {
    return [{
        action: 'GET',
        method: 'search',
        filter: filterFn
    }, {
        action: 'GET',
        url: '/:id',
        method: 'get',
        filter: filterFn
    }, {
        action: 'POST',
        method: 'create',
        filter: filterFn
    }, {
        action: 'PUT',
        url: '/:id',
        method: 'update',
        filter: filterFn
    }, {
        action: 'DELETE',
        url: '/:id',
        method: 'delete',
        filter: filterFn
    }];
};