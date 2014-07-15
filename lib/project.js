/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

exports.DEFAULT_REMOTE_REPOS = 'http://fis.baidu.com/repos';

exports.getSource = function(){
    var root = exports.getProjectPath(),
        source = {},
        project_exclude = new RegExp(
            '^' + fis.util.escapeReg(root + '/') +
                '(?:output\\b|fis-[^\\/]+$)',
            'i'),
        include = fis.config.get('project.include'),
        exclude = fis.config.get('project.exclude');
    fis.util.find(root, null, project_exclude).forEach(function(file){
        file = fis.file(file);
        if(file.release && fis.util.filter(file.subpath, include, exclude)){
            source[file.subpath] = file;
        }
    });
    return source;
};

//paths
var PROJECT_ROOT;
var TEMP_ROOT;

function getPath(root, args){
    if(args && args.length > 0){
        args = root + '/' + Array.prototype.join.call(args, '/');
        return fis.util(args);
    } else {
        return fis.util(root);
    }
}

function initDir(path, title){
    if(fis.util.exists(path)){
        if(!fis.util.isDir(path)){
            fis.log.error('unable to set path[' + path + '] as ' + title + ' directory.');
        }
    } else {
        fis.util.mkdir(path);
    }
    path = fis.util.realpath(path);
    if(path){
        return path;
    } else {
        fis.log.error('unable to create dir [' + path + '] for ' + title + ' directory.');
    }
}

exports.getProjectPath = function(){
    if(PROJECT_ROOT){
        return getPath(PROJECT_ROOT, arguments);
    } else {
        fis.log.error('undefined project root');
    }
};

exports.setProjectRoot = function(path){
    if(fis.util.isDir(path)){
        PROJECT_ROOT = fis.util.realpath(path);
    } else {
        fis.log.error('invalid project root path [' + path + ']');
    }
};

exports.setTempRoot = function(tmp){
    TEMP_ROOT = initDir(tmp);
};

exports.getTempPath = function(){
    if(!TEMP_ROOT){
        var list = ['FIS_TEMP_DIR', 'LOCALAPPDATA', 'APPDATA', 'HOME'];
        var name = fis.cli && fis.cli.name ? fis.cli.name : 'fis';
        var tmp;
        for(var i = 0, len = list.length; i < len; i++){
            if(tmp = process.env[list[i]]){
                break;
            }
        }
        tmp = tmp || __dirname + '/../';
        exports.setTempRoot(tmp + '/.' + name + '-tmp');
    }
    return getPath(TEMP_ROOT, arguments);
};

exports.getCachePath = function(){
    return getPath(exports.getTempPath('cache'), arguments);
};