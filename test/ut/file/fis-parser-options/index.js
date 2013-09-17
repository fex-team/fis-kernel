    /*
     * fis
     * http://fis.baidu.com/
     */

    'use strict';
    module.exports = function(content, file, conf) {
        return content + conf.test;
    };

    module.exports.defaultOptions = {
        test: 'TEST'
    };

