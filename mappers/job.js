'use strict';
var _ = require('underscore');

var templateMapper = require('./template');

exports.toModel = function(entity) {

    var model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        processor: entity.processor,
        data: entity.data,
        config: entity.config,
        lastRun: {},
        schedule: {},

        status: entity.status,
        timeStamp: entity.timeStamp
    };

    if (entity.lastRun) {
        model.lastRun.status = entity.lastRun.status;
        model.lastRun.error = entity.lastRun.error;
        model.lastRun.date = entity.lastRun.date;
        model.lastRun.lastSuccess = entity.lastRun.lastSuccess;
    }

    if (entity.schedule) {
        model.schedule.hour = entity.schedule.hour;
        model.schedule.minute = entity.schedule.minute;
    }

    if (entity.template) {
        model.template = templateMapper.toModel(entity.template);
    }

    return model;
};