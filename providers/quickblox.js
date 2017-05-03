'use strict';

var client = require('node-rest-client').Client;
var crypto = require('crypto');
var async = require('async');
var logger = require('../helpers/logger')('providers.quickblox');

var chatConfig = require('../settings/config').chat;
var session = null;

var getUrl = function(api, id) {
    if (id) {
        return "http://api.quickblox.com/" + api + '/' + id + ".json";
    }

    return "http://api.quickblox.com/" + api + ".json";
};


var needsLogin = function(errors) {
    if (!session) {
        return true;
    }
    var sessionExpired = errors &&
        errors.base &&
        errors.base.length !== 0 &&
        errors.base[0] === 'Required session does not exist';

    if (sessionExpired) {
        session = null;
    }
    return sessionExpired;
};

var getArgs = function(data) {
    var args = {
        headers: {
            "QuickBlox-REST-API-Version": "0.1.0",
            "Content-Type": "application/json"
        }
    };

    if (session) {
        args.headers["QB-Token"] = session.token;
    }

    if (data) {
        args.data = data;
    }

    return args;
};


var login = function(callback) {
    var log = logger.start('login');
    var signMessage = function(message, secret) {
        var sessionMsg = Object.keys(message).map(function(val) {
            if (typeof message[val] === 'object') {
                return Object.keys(message[val]).map(function(val1) {
                    return val + '[' + val1 + ']=' + message[val][val1];
                }).sort().join('&');
            } else {
                return val + '=' + message[val];
            }
        }).sort().join('&');


        return crypto.createHmac('sha1', secret).update(sessionMsg).digest('hex');
    };

    var randomNonce = function() {
        return Math.floor(Math.random() * 10000);
    };
    var unixTime = function() {
        return Math.floor(Date.now() / 1000);
    };
    var time = unixTime();
    var nonce = randomNonce();

    var signature = signMessage({
        "application_id": chatConfig.appID,
        "auth_key": chatConfig.authKey,
        "timestamp": time,
        "nonce": nonce,
        "user": {
            "login": "looped@mindfulsas",
            "password": "fundo@123"
        }
    }, chatConfig.authSecret);

    (new client()).post(getUrl('session'), getArgs({
        "application_id": chatConfig.appID,
        "auth_key": chatConfig.authKey,
        "timestamp": time,
        "nonce": nonce,
        "user": {
            "login": "looped@mindfulsas",
            "password": "fundo@123"
        },
        "signature": signature
    }), function(data, response) {
        if (response.errors) {
            log.error(response.errors);
            return callback(response.errors);
        } else {
            log.info('logged in');
            session = data.session;
            if (callback) {
                callback();
            }
        }
    });
};

var getUser = function(userName, callback) {
    var log = logger.start('getUser');
    log.debug('getting user: %s', userName);
    var args = getArgs();
    args.parameters = {
        login: userName
    };
    (new client()).get(getUrl('users', "by_login"), args, function(response) {
        if (response.errors) {
            log.error(response.errors);
            callback(response.errors);
        } else {
            log.debug('got user: %s', userName, response.user);
            callback(null, response.user);
        }

    });
};

var createUser = function(userName, callback) {
    var log = logger.start('createUser');
    var data = {
        login: userName,
        password: 'fundo@123'
    };
    async.waterfall([
        function(cb) {
            if (needsLogin()) {
                return login(cb);
            }
            cb(null);
        },
        function(cb) {
            log.debug('checking if user exists');
            getUser(userName, cb);
        },
        function(user, cb) {
            if (user) {
                log.info('user already exists. Using that');
                return cb(null, user);
            }
            log.debug('user does not exist');
            (new client()).post(getUrl('users'), getArgs({
                user: data
            }), function(response) {

                cb(response.errors, response.user);
            });
        }
    ], function(errors, user) {
        if (needsLogin(errors)) {
            createUser(data, callback);
        } else if (errors) {
            log.error(errors);
            return callback(errors);
        } else {

            // {
            //     if (errors && errors.login && errors.login[0] === 'has already been taken') {
            //         return getUser(userName, callback);
            //     }
            log.info('done', user);
            user.password = 'fundo@123';
            return callback(null, user);
        }
    });
};

var deleteUser = function(id, callback) {
    var log = logger.start('deleteUser');
    async.waterfall([
        function(cb) {
            if (needsLogin()) {
                return login(cb);
            }
            cb(null);
        },
        function(cb) {
            log.debug('sending request');
            (new client()).delete(getUrl('users', id), getArgs(), function(response) {
                cb(response.errors);
            });
        }
    ], function(errors) {
        if (needsLogin(errors)) {
            deleteUser(id, callback);
        } else {
            if (errors) {
                log.error(errors);
            } else {
                log.info('done');
            }
            return callback(errors);
        }
    });
};

var updateUser = function(id, data, callback) {
    var log = logger.start('updateUser');
    async.waterfall([
        function(cb) {
            if (needsLogin()) {
                return login(cb);
            }
            cb(null);
        },
        function(cb) {
            (new client()).put(getUrl('users', id), getArgs({
                user: data
            }), function(response) {
                if (response.errors) {
                    log.error(response.errors);
                } else {
                    log.info('done');
                }
                cb(response.errors);
            });
        }
    ], function(errors) {
        if (needsLogin(errors)) {
            updateUser(id, data, callback);
        } else {
            return callback(errors);
        }
    });
};

var notifyUser = function(data, callback) {
    var log = logger.method('notifyUser');
    async.waterfall([
        function(cb) {
            if (needsLogin()) {
                return login(cb);
            }
            cb(null);
        },
        function(cb) {
            log.debug('request sent', data);
            (new client()).post(getUrl('events.json'), getArgs({
                event: data
            }), function(response) {
                if (response.errors) {
                    log.error(response.errors);
                    cb(response.errors);
                } else {
                    log.debug(response);
                }
                cb(response.errors);
            });
        }
    ], function(errors) {
        if (needsLogin(errors)) {
            notifyUser(data, callback);
        } else {
            return callback(errors);
        }
    });
};

var messageUser = function(id, message, callback) {
    var log = logger.method('messageUser');
    async.waterfall([
        function(cb) {
            if (needsLogin()) {
                return login(cb);
            }
            cb(null);
        },
        function(cb) {
            var data = {
                "message": message,
                "recipient_id": id
            };
            log.debug('request sent', data);
            (new client()).post(getUrl('message.json'), getArgs(data), function(response) {
                cb(response.errors);
            });
        }
    ], function(errors) {
        if (needsLogin(errors)) {
            messageUser(id, message, callback);
        } else {
            return callback(errors);
        }
    });
};


exports.createUser = function(data, callback) {
    if (chatConfig.disabled) {
        logger.error('disabled');
        return callback(null, {});
    }
    return createUser(data, callback);
};

exports.updateUser = function(id, data, callback) {
    if (chatConfig.disabled) {
        logger.error('disabled');
        return callback(null, {});
    }
    return updateUser(id, data, callback);
};

exports.deleteUser = function(data, callback) {
    if (chatConfig.disabled) {
        logger.error('disabled');
        return callback(null, {});
    }
    return deleteUser(data, callback);
};

exports.notify = function(deviceId, data, callback) {
    if (chatConfig.disabled) {
        logger.error('disabled');
        return callback(null, {});
    }
    return notifyUser(data, callback);
};

exports.chat = function(id, message, callback) {
    if (chatConfig.disabled) {
        logger.error('disabled');
        return callback(null, {});
    }
    return messageUser(id, message, callback);
};

var init = function() {
    if (chatConfig.disabled) {
        logger.error('disabled');
        return;
    }
    if (!session) {
        login();
    }
};

init();