'use strict';
var mongoose = require('mongoose');
mongoose.model('user', mongoose.Schema({
    pic: {
        url: String,
        data: String,
    },

    name: String,
    email: String,
    phone: String,
    trackingId: String,

    token: String,
    pin: String,
    chat: {
        id: Number,
        password: String
    },
    devices: [{
        id: String,
        name: String,
    }],
    notifications: {
        enabled: Boolean,
        subscriptions: [{
            key: String,
            value: Boolean,
        }]
    },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'client' },
    status: String,
    timeStamp: { type: Date, default: Date.now }
}));