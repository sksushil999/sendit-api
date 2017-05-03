'use strict';
var mongoose = require('mongoose');
mongoose.model('client', mongoose.Schema({
    code: String,
    name: String,
    config: Object,

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

    status: String,
    timeStamp: { type: Date, default: Date.now }

}));