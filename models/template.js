'use strict';
var mongoose = require('mongoose');
mongoose.model('template', mongoose.Schema({

    code: String,
    subject: String,
    body: String,
    config: Object,

    attachment: { type: mongoose.Schema.Types.ObjectId, ref: 'template' },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'client' },
    status: String,
    timeStamp: { type: Date, default: Date.now }

}));