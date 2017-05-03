'use strict';
module.exports = function(res) {
    return {
        success: function(message, code) {
            var val = {
                isSuccess: true,
                message: message,
                code: code
            };
            res.log.info(message || 'success', val);
            res.json(val);
        },
        failure: function(error, message) {
            res.status(error.status || 400);
            var val = {
                isSuccess: false,
                message: message,
                error: error
            };
            res.log.error(message || 'failed', error);
            res.json(val);
        },
        accessDenied: function(error, message) {
            res.status(error.status || 400);
            var val = {
                isSuccess: false,
                message: message,
                error: error
            };
            res.log.error(message || 'failed', val);
            res.json(val);

        },
        data: function(item, message, code) {
            var val = {
                isSuccess: true,
                message: message,
                data: item,
                code: code
            };
            res.log.info(message || 'success', val);
            res.json(val);
        },
        page: function(items, total, pageNo) {

            var val = {
                isSuccess: true,
                pageNo: pageNo || 1,
                items: items,
                total: total || items.length
            };

            res.log.info('page', val);
            res.json(val);
        }
    };
};