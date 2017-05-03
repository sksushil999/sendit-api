'use strict';
var mongoose = require('mongoose');
mongoose.model('job', mongoose.Schema({
    code: String,
    name: String,
    processor: String,
    schedule: {
        hour: Number,
        minute: Number
    },

    lastRun: {
        status: String,
        error: String,
        date: Date,
        lastSuccess: Date,
    },

    data: Object,
    config: Object,

    template: { type: mongoose.Schema.Types.ObjectId, ref: 'template' },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'client' },
    status: String,
    timeStamp: { type: Date, default: Date.now }
}));