/*
 * fis
 * http://fis.baidu.com/
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
            for(var key in file.extras){
                if(file.extras.hasOwnProperty(key)){
                    res.extras = file.extras;
                    break;
                }
            }
            if(file.requires && file.requires.length){
                res.deps = file.requires;
            }
        }
    });
    
    //project root
    var root = fis.project.getProjectPath();
    
    var ns = fis.config.get('namespace');
    
    //get pack config
    var conf = fis.config.get('pack');
    if(typeof conf === 'undefined'){
        //from fis-pack.json
        var file = root + '/fis-pack.json';
        if(fis.util.isFile(file)){
            fis.config.set('pack', fis.util.readJSON(file));
        }
    }
    
    //package callback
    var cb = function(packager, settings, key){
        fis.log.debug('[' + key + '] start');
        packager(ret, conf, settings, opt);
        fis.log.debug('[' + key + '] end');
    };
    
    //prepackage
    fis.util.pipe('prepackager', cb, opt.prepackager);
    
    //package
    if(opt.pack && conf){
        //package
        if(fis.config.get('modules.packager', opt.packager)){
            fis.util.pipe('packager', cb, opt.packager);
        } else {
            var pkgMap = {}, packed = {};
            //construct package table
            fis.util.map(conf, function(path, patterns, index){
                if(typeof patterns === 'string'){
                    patterns = [patterns];
                }
                if(fis.util.is(patterns, 'Array') && patterns.length){
                    var pid = (ns ? ns + ':' : '') + 'p' + index,
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
                    fis.log.warning('invalid pack config [' + path + ']');
                }
            });
            
            //determine if subpath hit a pack config
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
            
            //pack
            fis.util.map(pkgMap, function(pid, pkg){
                //collect contents
                var content = '', has = [], requires = [], requireMap = {};
                pkg.pkgs.forEach(function(pkg){
                    var len = pkg.length;
                    pkg.forEach(function(file, index){
                        content += file.getContent();
                        if(index < len){
                            content += '\n';
                            if(file.rExt === '.js'){
                                content += ';';
                            }
                        }
                        var id = file.getId();
                        ret.map.res[id].pkg = pid;
                        requires = requires.concat(file.requires);
                        requireMap[id] = true;
                        has.push(id);
                    });
                });
                pkg.file.setContent(content);
                
                //collect dependencies
                var deps = [];
                requires.forEach(function(id){
                    if(!requireMap[id]){
                        deps.push(id);
                        requireMap[id] = true;
                    }
                });
                ret.map.pkg[pid] = {
                    uri  : pkg.file.getUrl(opt.hash, opt.domain),
                    type : pkg.file.rExt.replace(/^\./, ''),
                    has  : has,
                    deps : deps
                };
            });
        }
    }
    
    //create map.json
    var map = fis.file(root, (ns ? ns + '-' : '') + 'map.json');
    map.useHash = false;
    map.setContent(JSON.stringify(ret.map));
    ret.pkg[map.subpath] = map;
    
    //postpackage
    fis.util.pipe('postpackager', cb, opt.postpackager);
    
    //done
    if(callback){
        callback(ret);
    }
};