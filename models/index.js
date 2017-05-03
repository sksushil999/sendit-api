'use strict';
var fs = require('fs');
var join = require('path').join;
var mongoose = require('mongoose');

var init = function() {
    // set all the models on db
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            require('./' + file);
        }
    });
};

init();

module.exports = mongoose.models;