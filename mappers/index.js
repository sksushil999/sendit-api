'use strict';
var fs = require('fs');
var join = require('path').join;

var _ = require('underscore');


var mappers = {};

var init = function() {
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            var mapper = require('./' + file);

            var name = file.substring(0, file.indexOf(".js"));

            // use toModel as toSummary if one is not defined
            if (!mapper.toSummary) {
                mapper.toSummary = mapper.toModel;
            }

            if (!mapper.toModels) {
                mapper.toModels = function(entities) {
                    var models = [];

                    _(entities).each(function(entity) {
                        models.push(mapper.toSummary(entity));
                    });

                    return models;
                };
            }

            mappers[name] = mapper;
        }
    });
};

init();

module.exports = mappers;