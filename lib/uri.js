/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

function replaceDefine(value, escape){
    return value.replace(/\$\{([^\}]+)\}/g, function(all, $1){
        var val = fis.config.get($1);
        if(typeof val === 'undefined'){
            fis.log.error('undefined property [' + $1 + '].');
        } else {
            return escape ? fis.util.escapeReg(val) : val;
        }
        return all;
    });
}

function replaceMatches(value, matches){
    return value.replace(/\$(\d+|&)/g, function(all, $1){
        return matches[$1 === '&' ? '0' : $1] || all;
    });
}

function roadmap(subpath, path, obj){
    var map = fis.config.get('roadmap.' + path, []);
    for(var i = 0, len = map.length; i < len; i++){
        var opt = map[i], reg = opt.reg;
        if(reg){
            if(typeof reg === 'string'){
                reg = new RegExp(replaceDefine(reg, true), 'i');
            } else if(!fis.util.is(reg, 'RegExp')){
                fis.log.error('invalid regexp [' + reg + '] of [roadmap.' + path + '.' + i + ']');
            }
            var matches = subpath.match(reg);
            if(matches){
                obj = obj || {};
                for(var key in opt){
                    if(key !== 'reg' && opt.hasOwnProperty(key)){
                        var value = opt[key];
                        if(typeof value === 'string'){
                            value = replaceMatches(
                                replaceDefine(value),
                                matches
                            );
                        }
                        obj[key] = value;
                    }
                }
                return obj;
            }
        } else {
            fis.log.error('[roadmap.' + path + '.' + i + '] missing property [reg].');
        }
    }
    return false;
}

var uri = module.exports = function(path, dirname){
    var info = fis.util.stringQuote(path),
        qInfo = fis.util.query(info.rest),
        root = fis.project.getProjectPath();
    info.query = qInfo.query;
    info.rest = qInfo.rest;
    if(info.rest){
        path = info.rest;
        if(path.indexOf(':') === -1){
            if(path[0] === '/'){
                info.file = fis.file(root, path);
            } else if(dirname) {
                info.file = fis.file(dirname, path);
            } else {
                fis.log.error('invalid dirname.');
            }
        }
    }
    return info;
};

uri.getId = function(path, dirname){
    var info = uri(path, dirname);
    if(info.file){
        info.id = info.file.getId();
    } else {
        info.id = info.rest;
    }
    return info;
};

uri.replaceDefine = replaceDefine;
uri.replaceMatches = replaceMatches;
uri.roadmap = roadmap;