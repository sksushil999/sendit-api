'use strict';
var async = require('async');
var db = require('../models');
var mappers = require('../mappers');
var _ = require('underscore');

exports.create = function(req, res) {
    var model = req.body;

    async.waterfall([
        function(cb) {
            if (!model.attachment) {
                return cb(null, null);
            }

            if (model.attachment.id) {
                req.filters.add('id', model.attachment.id);
            } else if (model.attachment.code) {
                req.filters.add('code', model.attachment.code);
            }

            db.template.findOne(req.filters.where).exec(cb);

        },
        function(attachment, cb) {
            var template = new db.template({
                code: model.code,
                subject: model.subject,
                body: model.body,
                config: model.config,
                status: 'active',
            });

            if (attachment) {
                template.attachment = attachment;
            }

            template.client = req.client;

            template.save(function(err) {
                if (err) {
                    return cb(err);
                }
                cb(null, template);
            });
        },

    ], function(err, template) {
        if (err) {
            return res.failure(err);
        }
        res.data(mappers.template.toModel(template));
    });
};

exports.get = function(req, res) {
    db.template.findOne(req.filters.add('_id', req.params.id).where)
        .populate('attachment')
        .exec(function(err, template) {
            if (err) {
                return res.failure(err);
            }
            res.data(mappers.template.toModel(template));
        });
};

exports.update = function(req, res) {
    var model = req.body;

    async.waterfall([
            function(cb) {
                db.template.findOne(req.filters.add('_id', req.params.id).where)
                    .populate('attachment')
                    .exec(cb);
            },
            function(template, cb) {
                if (model.subject) {
                    template.subject = model.subject;
                }
                if (model.body) {
                    template.body = model.body;
                }
                if (model.config) {
                    template.config = model.config;
                }
                if (model.status) {
                    template.status = model.status;
                }
                template.save(cb);
            }
        ],

        function(err, template) {
            if (err) {
                return res.failure(err);
            }
            res.data(mappers.template.toModel(template));
        });
};

exports.search = function(req, res) {
    db.template.find(req.filters.where)
        .populate('attachment')
        .exec(function(err, templates) {
            if (err) {
                return res.failure(err);
            }
            res.page(mappers.template.toModels(templates));
        });
};