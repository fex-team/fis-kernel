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
        ids : {},
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
        var id = file.getId();
        ret.ids[id] = file;
        //add resource map
        if(file.isMod || file.rExt === '.js' || file.rExt === '.css'){
            if(file.rExt === '.js'){
                file.addSameNameRequire('.css');
            } else if(file.rExt !== '.css'){
                file.addSameNameRequire('.js');
                file.addSameNameRequire('.css');
            }
            var res = ret.map.res[id] = {
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
        var merge = fis.config.get('concat');
        if(!merge){
            return;
        }
        if(typeof merge !== 'object'){
            var conf = root + '/fis-concat.json';
            if(fis.util.isFile(conf)){
                fis.config.set('concat', fis.util.readJSON(conf));
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
            var pkgMap = {}, packed = {};
            //construct package table
            fis.util.map(merge, function(path, patterns, index){
                if(typeof patterns === 'string'){
                    patterns = [patterns];
                }
                if(fis.util.is(patterns, 'Array') && patterns.length){
                    var pid = 'p' + index,
                        subpath = path.replace(/^\//, ''),
                        pkg = ret.pkg[subpath] = fis.file(root, subpath);
                    pkg.useHash = true;
                    pkg.url = pkg.release = '/' + subpath;
                    if(typeof ret.src[pkg.subpath] !== 'undefined'){
                        fis.log.warning('there is a namesake file of package [' + path + ']');
                    }
                    pkgMap[pid] = {
                        id : pid,
                        file : pkg,
                        regs : patterns,
                        pkgs : new Array(patterns.length)
                    };
                } else {
                    fis.log.warning('invalid merge config [' + path + ']');
                }
            });
            
            //determine if subpath hit a merge config
            var hit = function(subpath, regs){
                for(var i = 0, len = regs.length; i < len; i++){
                    var reg = regs[i];
                    if(reg && fis.util.filter(subpath, reg)){
                        return i;
                    }
                }
                return false;
            };
            
            //pack file
            var pack = function(subpath, file, pkg){
                if(packed[subpath] || file.isImage()) return;
                if(pkg){
                    var index = hit(file.subpath, pkg.regs);
                    if(index !== false){
                        packed[subpath] = true;
                        file.requires.forEach(function(id){
                            var dep = ret.ids[id];
                            if(dep && dep.rExt === file.rExt){
                                pack(dep.subpath, dep, pkg);
                            }
                        });
                        var stack = pkg.pkgs[index] || [];
                        stack.push(file);
                        pkg.pkgs[index] = stack;
                        //add packed
                        return true;
                    }
                } else {
                    fis.util.map(pkgMap, function(pid, pkg){
                        return pack(file.subpath, file, pkg);
                    });
                }
            };
            
            //walk
            fis.util.map(ret.src, function(subpath, file){
                pack(subpath, file);
            });
            
            //concat
            fis.util.map(pkgMap, function(id, pkg){
                var content = '';
                pkg.pkgs.forEach(function(pkg){
                    pkg.forEach(function(file){
                        content += file.getContent() + '\n';
                    });
                });
                pkg.file.setContent(content);
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