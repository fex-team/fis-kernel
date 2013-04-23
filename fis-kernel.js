/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

//oo
Function.prototype.derive = function(constructor, proto){
    if(typeof constructor === 'object'){
        proto = constructor;
        constructor = proto.constructor || function(){};
        delete proto.constructor;
    }
    var parent = this;
    var fn = function(){
        parent.apply(this, arguments);
        constructor.apply(this, arguments);
    };
    var tmp = function(){};
    tmp.prototype = parent.prototype;
    var fp = new tmp(),
        cp = constructor.prototype,
        key;
    for(key in cp){
        if(cp.hasOwnProperty(key)){
            fp[key] = cp[key];
        }
    }
    proto = proto || {};
    for(key in proto){
        if(proto.hasOwnProperty(key)){
            fp[key] = proto[key];
        }
    }
    fp.constructor = constructor.prototype.constructor;
    fn.prototype = fp;
    return fn;
};

//factory
Function.prototype.factory = function(){
    var clazz = this;
    function F(args){
        clazz.apply(this, args);
    }
    F.prototype = clazz.prototype;
    return function(){
        return new F(arguments);
    };
};

var fis = module.exports = {};

//register global variable
Object.defineProperty(global, 'fis', {
    enumerable : true,
    writable : false,
    value : fis
});

//EventEmitter
fis.EventEmitter = require('events').EventEmitter;

//log
fis.log = require('./lib/log.js');

//require
fis.require = require('./lib/require.js');

//system config
fis.config = require('./lib/config.js');

//utils
fis.util = require('./lib/util.js');

//resource location
fis.uri = require('./lib/uri.js');

//project
fis.project = require('./lib/project.js');

//file
fis.file = require('./lib/file.js');

//cache
fis.cache = require('./lib/cache.js');

//compile kernel
fis.compile = require('./lib/compile.js');

//release api
fis.release = require('./lib/release.js');

//package info
fis.info = fis.util.readJSON(__dirname + '/package.json');

//kernel version
fis.version = fis.info.version;