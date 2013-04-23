/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

var fis = require('../fis-kernel.js');

/**
 * @type {Function}
 * @param {Object} [opt]
 * @param {Function} callback
 * opt = {
 *     include : {RegExp} find include filter,
 *     exclude : {RegExp} find exclude filter,
 *     debug    : {Boolean} debug model,
 *     optimize : {Boolean} if optimize,
 *     pack     : {Boolean|String} if package,
 *     lint     : {Boolean} if lint,
 *     hash     : {Boolean} if with hash,
 *     domain   : {Boolean} if with domain,
 *     beforeEach : {Function} before compile each file callback,
 *     afterEach : {Function} after compile each file callback,
 *     beforePack : {Function} before pack file callback,
 *     afterPack : {Function} after pack file callback
 * }
 */

var exports = module.exports = function(opt, callback){
    if(typeof opt === 'function'){
        callback = opt;
        opt = {};
    } else {
        opt = opt || {};
    }
    var ret = {
        src : fis.project.getSource(opt),
        pkg : {},
        map : {
            res : {},
            pkg : {}
        }
    };
    if(opt.md5 > 0){
        opt.hash = true;
    }
    fis.compile.setup(opt);
    fis.util.map(ret.src, function(subpath, file){
        if(opt.beforeEach) {
            opt.beforeEach(file, ret);
        }
        file = fis.compile(file);
        if(opt.afterEach) {
            opt.afterEach(file, ret);
        }
        if(file.isMod || file.rExt === '.js' || file.rExt === '.css'){
            if(file.rExt === '.js'){
                file.addSameNameRequire('.css');
            } else if(file.rExt !== '.css'){
                file.addSameNameRequire('.js');
                file.addSameNameRequire('.css');
            }
            var res = ret.map.res[file.getId()] = {
                uri  : file.getUrl(opt.hash, opt.domain),
                type : file.rExt.replace(/^\./, '')
            };
            if(file.requires.length){
                res.deps = file.requires;
            }
        }
    });
    var root = fis.project.getProjectPath();
    if(opt.pack){
        var packager = fis.config.get('modules.packager', opt.packager);
        if(opt.beforePack) {
            opt.beforePack(ret);
        }
        if(packager){
            var pkg = fis.require('packager', packager)(ret, opt, fis);
            if(typeof pkg === 'object'){
                ret.pkg = pkg;
            }
        } else {
            var merge = fis.config.get('merge', {});
            var index = 0;
            fis.util.map(merge, function(path, files){
                var pkgId = 'p' + (index++),
                    pkg = fis.file(root, pkgId),
                    content = '', requires = [];
                pkg.useHash = true;
                pkg.release = path;
                files.forEach(function(subpath){
                    var info = fis.uri(subpath, root);
                    if(info.file && ret.src[info.file.subpath]){
                        content += info.file.getContent();
                        requires = requires.concat(info.file.requires);
                        var id = info.file.getId();
                        requires.push(id);
                        ret.map.res[id].pkg = pkgId;
                    } else{
                        fis.log.error('unable to find merge file [' + subpath + '] into [' + path + ']');
                    }
                });
                pkg.setContent(content);
                var requireMap = {};
                var collection = [];
                requires.forEach(function(id){
                    if(!requireMap[id]){
                        collect.push(id);
                        collection[id] = true;
                    }
                });
                ret.map.pkg[pkgId] = {
                    uri  : pkg.getUrl(opt.hash, opt.domain),
                    type : pkg.rExt.replace(/^\./, ''),
                    has : collection
                };
            });
        }
        if(opt.afterPack) {
            opt.afterPack(ret);
        }
    }
    var name = fis.config.get('namespace');
    var subpath = '/' + (name ? name + '-' : '') + 'map.json';
    var map = fis.file(root, subpath);
    map.useHash = false;
    map.setContent(JSON.stringify(ret.map));
    ret.pkg[subpath] = map;
    if(callback){
        callback(ret);
    }
};