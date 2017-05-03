'use strict';
var _ = require('underscore');

exports.toModel = function(entity) {

    var model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        config: entity.config,
        status: entity.status,
        timeStamp: entity.timeStamp
    };

    if (entity.owner) {
        model.owner = {
            id: entity.owner.id,
            name: entity.owner.name,
            email: entity.owner.email
        };
    }

    return model;
};