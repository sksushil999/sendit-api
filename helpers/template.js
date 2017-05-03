'use strict';
var handlebars = require('handlebars');
var moment = require('moment');
var qrCode = require('qr-image');
var Barc = require('barc');
var Datauri = require('datauri');

handlebars.registerHelper('date', function(date) {
    if (!date) {
        return '';
    }
    return moment(date).format('DD-MM-YYYY');
});

handlebars.registerHelper('time', function(date) {
    if (!date) {
        return '';
    }
    return moment(date).format('hh:mm:ss');
});

handlebars.registerHelper('eq', function(a, b, opts) {
    if(a == b) // Or === depending on your needs
        return opts.fn(this);
    else
        return opts.inverse(this);
});

handlebars.registerHelper('qrcode', function(code) {
    if (!code) {
        return '';
    }
    var buffer = qrCode.imageSync(code);

    var datauri = new Datauri();
    var uri = datauri.format('.png', buffer);
    return uri.content;
});





handlebars.registerHelper('barcode', function(code, options) {
    if (!code) {
        return '';
    }

    var barc = new Barc();
    var type = options.hash.type || 'code128';
    var buffer = barc[type]('' + code,
        options.hash.width || 300,
        options.hash.height || 100,
        options.hash.angle || 0);

    var datauri = new Datauri();
    var uri = datauri.format('.png', buffer);
    return uri.content;
});

exports.formatter = function(format) {
    var template = handlebars.compile(format);
    return {
        inject: function(data) {
            return template(data);
        }
    };
};