/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

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
            if(typeof file.extras === 'object'){
                res.extras = file.extras;
            }
            if(file.requires.length){
                res.deps = file.requires;
            }
        }
    });
    var root = fis.project.getProjectPath();
    if(opt.pack){
        var merge = fis.config.get('merge');
        if(typeof merge !== 'object'){
            var conf = root + '/fis-merge.json';
            if(fis.util.isFile(conf)){
                fis.config.set('merge', fis.util.readJSON(conf));
            } else {
                merge = {};
            }
        }
        var packager = fis.config.get('modules.packager', opt.packager);
        if(opt.beforePack) {
            opt.beforePack(ret);
        }
        if(packager){
            var pkg = fis.require('packager', packager)(ret, opt);
            if(typeof pkg === 'object'){
                ret.pkg = pkg;
            }
        } else {
            var index = 0;
            fis.util.map(merge, function(path, files){
                var pkgId = 'p' + (index++),
                    pkgSubpath = path.replace(/^\//, ''),
                    pkg = ret.pkg[pkgSubpath] = fis.file(root, pkgSubpath),
                    content = '', requires = [], has = [], requireMap = {};
                pkg.useHash = true;
                pkg.url = pkg.release = '/' + pkgSubpath;
                if(typeof ret.src[pkg.subpath] !== 'undefined'){
                    fis.log.warning('there is a namesake file of package [' + path + ']');
                }
                files.forEach(function(subpath){
                    var file = fis.uri(subpath, root).file;
                    if(file){
                        if(ret.src[file.subpath]){
                            file = ret.src[file.subpath];
                        } else {
                            fis.compile(file);
                        }
                        content += file.getContent();
                        requires = requires.concat(file.requires);
                        if(file.release){
                            var id = file.getId();
                            requireMap[id] = true;
                            has.push(id);
                            ret.map.res[id].pkg = pkgId;
                        }
                    } else {
                        fis.log.error('unable to find merge file [' + subpath + '] into [' + path + ']');
                    }
                });
                pkg.setContent(content);
                var deps = [];
                requires.forEach(function(id){
                    if(!requireMap[id]){
                        deps.push(id);
                        requireMap[id] = true;
                    }
                });
                ret.map.pkg[pkgId] = {
                    uri  : pkg.getUrl(opt.hash, opt.domain),
                    type : pkg.rExt.replace(/^\./, ''),
                    has  : has,
                    deps : deps
                };
            });
        }
        if(opt.afterPack) {
            opt.afterPack(ret);
        }
    }
    var name = fis.config.get('namespace');
    var map = fis.file(root, (name ? name + '-' : '') + 'map.json');
    map.useHash = false;
    map.setContent(JSON.stringify(ret.map));
    ret.pkg[map.subpath] = map;
    if(callback){
        callback(ret);
    }
};