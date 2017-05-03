'use strict';
var _ = require('underscore');

exports.toModel = function(entity) {

    var model = {
        id: entity.id,
        code: entity.code,
        subject: entity.subject,
        body: entity.body,
        config: entity.config,

        status: entity.status,
        timeStamp: entity.timeStamp
    };

    if (entity.attachment) {
        model.attachment = {
            id: entity.attachment.id,
            code: entity.attachment.code
        };
    }

    return model;
};