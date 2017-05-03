'use strict';
var _ = require('underscore');

exports.toModel = function(entity) {

    var model = {
        id: entity.id,
        name: entity.name,
        email: entity.email,

        status: entity.status,
        timeStamp: entity.timeStamp
    };

    if (entity.token) {
        model.token = entity.token;
    }

    return model;
};