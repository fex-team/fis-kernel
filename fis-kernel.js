/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var last = Date.now();

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

fis.emitter = new (require('events').EventEmitter);

//time for debug
fis.time = function(title){
    console.log(title + ' : ' + (Date.now() - last) + 'ms');
    last = Date.now();
};

//log
fis.log = require('./lib/log.js');

//require
fis.require = function(){
    var path;
    var name = Array.prototype.slice.call(arguments, 0).join('-');
    if(fis.require._cache.hasOwnProperty(name)) return fis.require._cache[name];
    var names = [];
    for(var i = 0, len = fis.require.prefixes.length; i < len; i++){
        try {
            var pluginName = fis.require.prefixes[i] + '-' + name;
            names.push(pluginName);
            path = require.resolve(pluginName);
            try {
                return fis.require._cache[name] = require(pluginName);
            } catch (e){
                fis.log.error('load plugin [' + pluginName + '] error : ' + e.message);
            }
        } catch (e){}
    }
    fis.log.error('unable to load plugin [' + names.join('] or [') + ']');
};

fis.require._cache = {};

fis.require.prefixes = ['fis'];

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

fis.initPlugins = function(plugins) {
    plugins = plugins || fis.config.get('modules.plugins', []);

    plugins.forEach(function(plugin, index) {
        var key = 'plugin.' + index;

        if (typeof plugin === 'string') {
            plugin = fis.require('plugin', plugin);
            key = 'plugin.' + plugin;
        }

        var initFn = plugin && (plugin.init || plugin);

        if (!initFn || typeof plugin !== 'function' ) {
            fis.log.warning('invalid plugin [modules.' + key + ']');
        }

        var settings = fis.config.get('settings.' + key, {});
        if(plugin.defaultOptions){
            settings = fis.util.merge(plugin.defaultOptions, settings);
        }

        initFn(settings);
    });
};