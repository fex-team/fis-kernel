/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

var CACHE_DIR;

var exports = module.exports = function(file){
    if(!CACHE_DIR){
        fis.log.error('uninitialized compile cache directory.');
    }
    file = fis.file.wrap(file);
    if(file.isText()){
        fis.log.debug('compile [' + file.realpath + '] start');
        if(file.isFile()){
            var cache = file.cache = fis.cache(file.realpath, CACHE_DIR),
                revertObj = {};
            if(cache.revert(revertObj)){
                exports.settings.beforeCacheRevert(file);
                file.requires = revertObj.info;
                file.setContent(revertObj.content);
                exports.settings.afterCacheRevert(file);
            } else {
                exports.settings.beforeCompile(file);
                file.setContent(fis.util.read(file.realpath));
                process(file);
                exports.settings.afterCompile(file);
                cache.save(file.getContent(), file.requires);
            }
        } else if(!file.realpath){
            process(file);
        } else {
            fis.log.error('unable to compile [' + file.realpath + ']: Invalid file path.');
        }
        fis.log.debug('compile [' + file.realpath + '] end');
    } else if(file.realpath) {
        file.setContent(fis.util.read(file.realpath));
    }
    file.compiled = true;
    embeddedUnlock(file);
    return file;
};

exports.settings = {
    debug    : false,
    optimize : false,
    lint     : false,
    hash     : false,
    domain   : false,
    beforeCacheRevert : function(){},
    afterCacheRevert : function(){},
    beforeCompile : function(){},
    afterCompile : function(){}
};

exports.setup = function(opt){
    var settings = exports.settings;
    if(opt){
        fis.util.map(settings, function(key){
            if(typeof opt[key] !== 'undefined'){
                settings[key] = opt[key];
            }
        });
    }
    CACHE_DIR = 'compile/'
        + (settings.debug    ? 'debug'     : 'release')
        + (settings.optimize ? '-optimize' : '')
        + (settings.hash     ? '-hash'     : '')
        + (settings.domain   ? '-domain'   : '');
    return CACHE_DIR;
};

exports.clean = function(name){
    fis.cache.clean('compile/' + (name || ''));
};

exports.lang = (function(){
    var keywords = ['require', 'embed', 'uri', 'dep'],
        LD = '<[{', RD = '}]>',
        qLd = fis.util.escapeReg(LD),
        qRd = fis.util.escapeReg(RD),
        map = {
            reg : new RegExp(
                qLd + '(' + keywords.join('|') + ')\\(([\\s\\S]+?)\\)' + qRd,
                'g'
            )
        };
    keywords.forEach(function(key){
        map[key] = {};
        map[key]['ld'] = LD + key + '(';
        map[key]['rd'] = ')' + RD;
    });
    return map;
})();

//"abc?__inline" return true
//"abc?__inlinee" return false
//"abc?a=1&__inline"" return true
function isInline(info){
    return /[?&]__inline(?:[=&'"]|$)/.test(info.query);
}

//analyse [@require id] syntax in comment
function analyseComment(comment, map){
    var reg = /(@require\s+)('[^']+'|"[^"]+"|[^\s;!@#%^&*()]+)/g;
    return comment.replace(reg, function(m, prefix, value){
        return prefix + map.require.ld + value + map.require.rd;
    });
}

//expand javascript
//[@require id] in comment to require resource
//__inline(path) to embedd resource content or base64 encodings
//__uri(path) to locate resource
//require(path) to require resource
function extJs(content, map){
    var reg = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]+?(?:\*\/|$))|\b(__inline|__uri|require)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*')\s*\)/g;
    return content.replace(reg, function(m, comment, type, value){
        if(type){
            switch (type){
                case '__inline':
                    m = map.embed.ld + value + map.embed.rd;
                    break;
                case '__uri':
                    m = map.uri.ld + value + map.uri.rd;
                    break;
                case 'require':
                    m = 'require(' + map.require.ld + value + map.require.rd + ')';
                    break;
            }
        } else if(comment){
            m = analyseComment(comment, map);
        }
        return m;
    });
}

//expand css
//[@require id] in comment to require resource
//[@import url(path?__inline)] to embed resource content
//url(path) to locate resource
//url(path?__inline) to embed resource content or base64 encodings
//src=path to locate resource
function extCss(content, map){
    var reg = /(\/\*[\s\S]+?(?:\*\/|$))|(?:@import\s+)?\burl\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}]+)\s*\)|\bsrc\s*=\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^\s}]+)/g;
    return content.replace(reg, function(m, comment, url, filter){
        if(url){
            var key = isInline(fis.util.query(url)) ? 'embed' : 'uri';
            if(m.indexOf('@') === 0){
                if(key === 'embed'){
                    m = map.embed.ld + url + map.embed.rd;
                } else {
                    m = '@import url(' + map.uri.ld + url + map.uri.rd + ')';
                }
            } else {
                m = 'url(' + map[key].ld + url + map[key].rd + ')';
            }
        } else if(filter) {
            m = 'src=' + map.uri.ld + filter + map.uri.rd;
        } else if(comment) {
            m = analyseComment(comment, map);
        }
        return m;
    });
}

//expand html
//[@require id] in comment to require resource
//<!--inline[path]--> to embed resource content
//<img|embed|audio|video|link|object ... (data-)?src="path"/> to locate resource
//<img|embed|audio|video|link|object ... (data-)?src="path?__inline"/> to embed resource content
//<script|style ... src="path"></script|style> to locate js|css resource
//<script|style ... src="path?__inline"></script|style> to embed js|css resource
//<script|style ...>...</script|style> to analyse as js|css
function extHtml(content, map){
    var reg = /(<script(?:\s+[\s\S]+?["'\s\w\/]>|>))([\s\S]*?)(?=<\/script>|$)|(<style(?:\s+[\s\S]+?["'\s\w\/]>|>))([\s\S]*?)(?=<\/style>|$)|<(img|embed|audio|video|link|object)\s+[\s\S]*?["'\s\w\/](?:>|$)|<!--inline\[([^\]]+)\]-->|<!--(?!\[)([\s\S]+?)(-->|$)/ig;
    return content.replace(reg, function(m, $1, $2, $3, $4, $5, $6, $7, $8){
        if($1){//<script>
            var embed = '';
            $1 = $1.replace(/(\s(?:data-)?src\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value){
                if(isInline(fis.util.query(value))){
                    embed += map.embed.ld + value + map.embed.rd;
                    return '';
                } else {
                    return prefix + map.uri.ld + value + map.uri.rd;
                }
            });
            m = $1 + (embed || extJs($2, map));
        } else if($3){//<style>
            m = $3 + extCss($4, map);
        } else if($5){//<img|embed|audio|video|link|object>
            var tag = $5.toLowerCase();
            if(tag === 'link'){
                var inline = '';
                m = m.replace(/(\s(?:data-)?href\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value){
                    if(isInline(fis.util.query(value))){
                        inline += '<style>' + map.embed.ld + value + map.embed.rd + '</style>';
                        return '';
                    } else {
                        return prefix + map.uri.ld + value + map.uri.rd;
                    }
                });
                m = inline || m;
            } else if(tag === 'object'){
                m = m.replace(/(\sdata\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value){
                    return prefix + map.uri.ld + value + map.uri.rd;
                });
            } else {
                m = m.replace(/(\s(?:data-)?src\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value){
                    var key = isInline(fis.util.query(value)) ? 'embed' : 'uri';
                    return prefix + map[key]['ld'] + value + map[key]['rd'];
                });
            }
        } else if($6){
            m = map.embed.ld + $6 + map.embed.rd;
        } else if($7){
            m = '<!--' + analyseComment($7, map) + $8;
        }
        return m;
    });
}

var extlangMap = {
    '.js'    : extJs,
    '.css'   : extCss,
    '.html'  : extHtml,
    '.htm'   : extHtml,
    '.xhtml' : extHtml,
    '.php'   : extHtml,
    '.jsp'   : extHtml,
    '.asp'   : extHtml
};

function process(file){
    pipe(file, 'parser', file.ext);
    pipe(file, 'preprocessor', file.rExt);
    standard(file);
    pipe(file, 'postprocessor', file.rExt);
    if(exports.settings.lint){
        pipe(file, 'lint', file.rExt, true);
    }
    if(exports.settings.optimize){
        pipe(file, 'optimizer', file.rExt);
    }
}

function getConf(key, filename){
    var conf = fis.config.get('settings.' + key, {});
    conf.filename = filename;
    return conf;
}

function pipe(file, type, ext, keep){
    var names = fis.config.get('modules.' + type + '.' + ext, '').trim();
    if(names){
        if(typeof names === 'string'){
            names = names.split(/\s*,\s*/);
        }
        names.forEach(function(name){
            if(name){
                var key = type + '.' + name;
                fis.log.debug('pipe [' + key + '] start');
                var conf = getConf(key, file.realpath),
                    processor = fis.require(type, name),
                    content = file.getContent();
                try {
                    content = processor(content, file, conf);
                } catch(e) {
                    var msg = key + ': ' + e.message + ' [' + file.subpath;
                    if(e.hasOwnProperty('line')){
                        msg += ':' + e.line;
                    }
                    if(e.hasOwnProperty('col')){
                        msg += ':' + e.col;
                    }
                    msg += ']';
                    fis.log.error(msg);
                }
                fis.log.debug('pipe [' + key + '] end');
                if(!keep && typeof content !== 'undefined'){
                    file.setContent(content);
                }
            }
        });
    }
}

var embeddedMap = {};

function embeddedCheck(main, embedded){
    main = fis.file.wrap(main).realpath;
    embedded = fis.file.wrap(embedded).realpath;
    if(main === embedded){
        fis.log.error('unable to embed file[' + main + '] into itself.');
    } else if(embeddedMap[embedded]) {
        var next = embeddedMap[embedded],
            msg = [embedded];
        while(next && next !== embedded){
            msg.push(next);
            next = embeddedMap[next];
        }
        msg.push(embedded);
        fis.log.error('circular dependency on [' + msg.join('] -> [') + '].');
    }
    embeddedMap[embedded] = main;
    return true;
}

function embeddedUnlock(file){
    delete embeddedMap[file.realpath];
}

function addDeps(a, b){
    if(a && a.cache && b){
        if(b.cache){
            a.cache.mergeDeps(b.cache);
        }
        a.cache.addDeps(b.realpath || b);
    }
}

function standard(file){
    var path = file.realpath,
        content = file.getContent();
    if(typeof content === 'string'){
        //expand language ability
        var parser = extlangMap[file.rExt] || (file.isHtmlLike ? parseHtml : null);
        if(parser){
            content = parser(content, fis.compile.lang);
        }
        content = content.replace(exports.lang.reg, function(all, type, value){
            var ret = '', info;
            switch(type){
                case 'require':
                    info = fis.uri.getId(value, file.dirname);
                    file.addRequire(info.id);
                    ret = info.quote + info.id + info.quote;
                    break;
                case 'uri':
                    info = fis.uri(value, file.dirname);
                    if(info.file && info.file.isFile()){
                        if(exports.settings.hash){
                            if(embeddedCheck(file, info.file)){
                                exports(info.file);
                                addDeps(file, info.file);
                            }
                        }
                        ret = info.quote + info.file.getUrl(exports.settings.hash, exports.settings.domain) + info.query + info.quote;
                    } else {
                        ret = value;
                    }
                    break;
                case 'dep':
                    if(file.cache){
                        info = fis.uri(value, file.dirname);
                        addDeps(file, info.file);
                    } else {
                        fis.log.warning('unable to add deps to file [' + path + ']');
                    }
                    break;
                case 'embed':
                    info = fis.uri(value, file.dirname);
                    var f;
                    if(info.file){
                        f = info.file;
                    } else if(fis.util.isAbsolute(info.rest)){
                        f = fis.file(info.rest);
                    }
                    if(f && f.isFile()){
                        if(embeddedCheck(file, f)){
                            exports(f);
                            addDeps(file, f);
                            f.requires.forEach(function(id){
                                file.addRequire(id);
                            });
                            if(f.isText()){
                                ret = f.getContent();
                            } else {
                                ret = info.quote + f.getBase64() + info.quote;
                            }
                        }
                    } else {
                        fis.log.error('unable to embed file[' + value + '] into file[' + path + ']: No such file.');
                    }
                    break;
            }
            return ret;
        });
        file.setContent(content);
    }
}