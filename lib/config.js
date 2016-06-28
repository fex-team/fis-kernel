/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var DEFALUT_SETTINGS = {
    system : {
        repos : 'http://fis.baidu.com/repos'
    },
    project : {
        charset : 'utf8',
        md5Length : 7,
        md5Connector : '_'
    }
};

//You can't use merge in util.js
function merge(source, target){
    if(typeof source === 'object' && typeof target === 'object'){
        for(var key in target){
            if(target.hasOwnProperty(key)){
                source[key] = merge(source[key], target[key]);
            }
        }
    } else {
        source = target;
    }
    return source;
}

function checkRoadmapPath(origin, roadmapPath, stack){

    function getRoadmapPathSummary(roadmapPath){
        var info = roadmapPath.map(function(c){
            return c.reg;
        }).slice(0, 5);
        if (roadmapPath.length > 5){
            info.push('...');
        }
        return info.join(', ');
    }

    function getStackInfo(stack){
        var stacks = stack.split('\n');
        if (stacks.length < 2){
            return '';
        }
        //stacks[2] is the fis-conf stack
        var fisConfStack = stacks[2];
        var info = fisConfStack.match(/\((.*)\)/);
        if (info.length < 1){
            return '';
        }
        return ' at ' + info[1];
    }

    if (origin.roadmap && origin.roadmap.path){
        fis.log.warning(
            'roadmap.path [' +
                getRoadmapPathSummary(origin.roadmap.path) +
            '] was overrided by [' +
                getRoadmapPathSummary(roadmapPath) +
            ']' + getStackInfo(stack) +
            ', please use fis.config.get(\'roadmap.path\').unshift(ruler) to add rulers.');
        console.log()
    }
}

var Config = Object.derive({
    constructor : function(){
        this.init.apply(this, arguments);
    },
    init : function(){
        this.data = {};
        if(arguments.length > 0){
            this.merge.apply(this, arguments);
        }
        return this;
    },
    get : function(path, def){
        var result = this.data || {};
        (path || '').split('.').forEach(function(key){
            if(key && (typeof result !== 'undefined')){
                result = result[key];
            }
        });
        if(typeof result === 'undefined'){
            return def;
        } else {
            return result;
        }
    },
    set : function(path, value){
        if(typeof value === 'undefined'){
            if (path.roadmap && path.roadmap.path){
                checkRoadmapPath(this.data, path, (new Error()).stack);
            }
            this.data = path;
        } else {
            if (path === 'roadmap.path'){
                checkRoadmapPath(this.data, value, (new Error()).stack);
            }
            if (path === 'roadmap' && value.path){
                checkRoadmapPath(this.data, value.path, (new Error()).stack);
            }
            path = String(path || '').trim();
            if(path){
                var paths = path.split('.'),
                    last = paths.pop(),
                    data = this.data || {};
                paths.forEach(function(key){
                    var type = typeof data[key];
                    if(type === 'object'){
                        data = data[key];
                    } else if(type === 'undefined'){
                        data = data[key] = {};
                    } else {
                        fis.log.error('forbidden to set property [' + key + '] of [' + type + '] data');
                    }
                });
                data[last] = value;
            }
        }
        return this;
    },
    del : function(path){
        path = String(path || '').trim();
        if(path){
            var paths = path.split('.'),
                data = this.data,
                last = paths.pop(), key;
            for(var i = 0, len = paths.length; i < len; i++){
                key = paths[i];
                if(typeof data[key] === 'object'){
                    data = data[key];
                } else {
                    return this;
                }
            }
            if(typeof data[last] !== 'undefined'){
                delete data[last];
            }
        }
        return this;
    },
    merge : function(){
        var self = this;
        var stack = (new Error()).stack;
        [].slice.call(arguments).forEach(function(arg){
            if(typeof arg === 'object'){
                if (arg.roadmap && arg.roadmap.path){
                    checkRoadmapPath(self.data, arg.roadmap.path, stack);
                }
                merge(self.data, arg);
            } else {
                fis.log.warning('unable to merge data[' + arg + '].');
            }
        });
        return this;
    },
    require : function(name){
        fis.require('config', name);
        return this;
    }
});

module.exports = (new Config).init(DEFALUT_SETTINGS);
module.exports.Config = Config;