/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

function getReleaseExt(ext){
    if(ext){
        var rExt = fis.config.get('roadmap.ext' + ext);
        if(rExt){
            ext = normalizeExt(rExt);
        }
    }
    return ext;
}

function normalizeExt(ext){
    if(ext[0] !== '.'){
        ext = '.' + ext;
    }
    return ext;
}

function normalizePath(path, reg, rExt){
    return path
        .replace(reg, '')
        .replace(/[:*?"<>|]/g, '_') + rExt;
}

function addHash(path, file){
    var rExt  = file.rExt,
        qRExt = fis.util.escapeReg(rExt),
        qExt = fis.util.escapeReg(file.ext),
        hash = file.getHash(),
        onnector = fis.config.get('project.md5Connector', '_'),
        reg = new RegExp(qRExt + '$|' + qExt + '$', 'i');
    return path.replace(reg, '') + onnector + hash + rExt;
}

function getDomainsByPath(path){
    var domain = fis.config.get('roadmap.domain', {}), value = [];
    if(typeof domain === 'string'){
        value = domain.split(/\s*,\s*/);
    } else if(fis.util.is(domain, 'Array')) {
        value = domain;
    } else {
        fis.util.map(domain, function(pattern, domain){
            if((pattern === 'image' && fis.util.isImageFile(path)) || fis.util.glob(pattern, path)){
                if(typeof domain === 'string'){
                    value = domain.split(/\s*,\s*/);
                } else if(fis.util.is(domain, 'Array')){
                    value = domain;
                } else {
                    fis.log.warning('invalid domain [' + domain + '] of [roadmap.domain.' + pattern + ']');
                }
                return true;
            }
        });
    }
    return value;
}


function getDomain(path){
    var hash = fis.util.md5(path),
        domains = getDomainsByPath(path),
        len = domains.length,
        domain = '';
    if(len){
        domain = domains[hash.charCodeAt(0) % len];
    }
    return domain;
}

var File = Object.derive(function(){
    var _ = fis.util,
        info = _.pathinfo(arguments);
    _.map(info, this, true);
    var ext = info.ext,
        rExt = this.rExt = getReleaseExt(ext),
        realpath = this.realpath = _.realpathSafe(info.fullname),
        realpathNoExt = this.realpathNoExt = info.rest,
        root = fis.project.getProjectPath();

    this.useCompile = true;
    this.useDomain = false;
    this.useCache = true;
    this.useHash = false;
    this.useMap = false;

    this._isImage = true;
    this._isText = false;
    this.isMod = false;

    this.requires = [];
    this.extras = {};

    this._likes = {};
    var likes = ['isHtmlLike', 'isJsLike', 'isCssLike'];
    var props = {};

    likes.forEach(function (v) {
        props[v] = {
            set: (function (prop) {
                return function (val) {

                    if (val === false) {
                        this._likes[v] = false;
                        return;
                    }

                    var that = this;
                    likes.forEach(function (v) {
                        if (prop === v) {
                            that._likes[v] = true
                        } else {
                            that._likes[v] = false;
                        }
                    });
                }
            })(v),
            get: (function(prop) {
                return function () {
                    return this._likes[prop];
                };
            })(v)
        };
    });

    Object.defineProperties(this, props);

    if(_.isTextFile(rExt)) {
        this._isImage = false;
        this._isText = true;
        this.charset = null;
        switch(rExt){
            case '.js':
            case '.jsx':
            case '.coffee':
                this.isJsLike = true;
                this.useDomain = true;
                this.useHash = true;
                this.useMap = true;
                break;
            case '.css':
            case '.less':
            case '.sass':
            case '.styl':
            case '.scss':
                this.isCssLike = true;
                this.useDomain = true;
                this.useHash = true;
                this.useMap = true;
                break;
            case '.html':
            case '.xhtml':
            case '.shtml':
            case '.htm':
            case '.tpl':   //smarty template
            case '.ftl':   //freemarker template
            case '.vm':    //velocity template
            case '.php':
            case '.jsp':
            case '.asp':
            case '.aspx':
            case '.ascx':
            case '.cshtml':
            case '.master':
                this.isHtmlLike = true;
                break;
            case '.json':
                this.isJsonLike = true;
                break;
        }
    } else if(_.isImageFile(rExt)) {
        this.useDomain = true;
        this.useHash = rExt !== '.ico';
    } else {
        this.useCompile = false;
    }

    if(realpath.indexOf(root) === 0){
        //subpath
        var len = root.length, subpath;
        this.subpath = subpath = realpath.substring(len);
        this.subdirname = info.dirname.substring(len);
        this.subpathNoExt = realpathNoExt.substring(len);

        //roadmap
        fis.uri.roadmap(subpath, 'path', this);

        //release
        if(this.release === false){
            this.useMap = false;
            var self = this;
            Object.defineProperty(this, 'url', {
                enumerable : true,
                get : function(){
                    fis.log.error('unreleasable file [' + self.realpath + ']');
                }
            });
        } else {
            this.useMap = this.isMod ? true : this.useMap;
            //release & url
            var reg = new RegExp(_.escapeReg(ext) + '$|' + _.escapeReg(rExt) + '$', 'i');
            var release;
            if(this.release){
                release = this.release.replace(/[\/\\]+/g, '/');
                if(release[0] !== '/'){
                    release = '/' + release;
                }
            } else {
                release = this.subpath;
            }
            this.release = normalizePath(release, reg, rExt);
            this.url = this.url ? normalizePath(this.url, reg, rExt) : this.release;
        }

        //charset
        if(this._isText){
            this.charset = (
                this.charset || fis.config.get('project.charset', 'utf8')
            ).toLowerCase();
        }

        //file id
        var id = this.id || subpath.replace(/^\//, '');
        var ns = fis.config.get('namespace');
        if(ns) {
            id = ns + fis.config.get('namespaceConnector', ':') + id;
        }
        this.id = id;
    }
}, {
    exists : function(){
        return fis.util.exists(this.realpath);
    },
    isText : function(){
        return this._isText;
    },
    isImage : function(){
        return this._isImage;
    },
    toString : function(){
        return this.realpath;
    },
    getMtime : function(){
        return fis.util.mtime(this.realpath);
    },
    isFile : function(){
        return fis.util.isFile(this.realpath);
    },
    isDir : function(){
        return fis.util.isDir(this.realpath);
    },
    setContent : function(c){
        this._content = c;
        return this;
    },
    getContent : function(){
        if(typeof this._content === 'undefined'){
            this._content = fis.util.read(this.realpath, this.isText());
        }
        return this._content;
    },
    getHash : function(){
        if(typeof this._md5 === 'undefined'){
            Object.defineProperty(this, '_md5', {
                value : fis.util.md5(this.getContent()),
                writable : false
            });
        }
        return this._md5;
    },
    getBase64 : function(prefix){
        prefix = typeof prefix === 'undefined' ? true : prefix;
        if(prefix){
            prefix = 'data:' + fis.util.getMimeType(this.rExt) + ';base64,';
        } else {
            prefix = '';
        }
        return prefix + fis.util.base64(this._content);
    },
    getId : function(){
        return this.id;
    },
    getUrl : function(withHash, withDomain){
        var url = this.url;
        if(withHash && this.useHash){
            url = addHash(url, this);
        }
        if(withDomain && this.useDomain){
            if(typeof this.domain === 'undefined'){
                this.domain = getDomain(this.subpath);
            }
            url = this.domain + url;
        }
        return url + this.query;
    },
    getHashRelease : function(release){
        release = release || this.release;
        if(release){
            if(this.useHash){
                return addHash(release, this);
            } else {
                return release;
            }
        } else {
            fis.log.error('unreleasable file [' + this.realpath + ']');
        }
    },
    addRequire : function(id){
        if(id && (id = id.trim())){
            if(this.requires.indexOf(id) < 0){
                this.requires.push(id);
            }
            return id;
        }
        return false;
    },
    addSameNameRequire : function(ext){
        var path;
        if(fis.util.isFile(this.realpathNoExt + ext)){
            path = './' + this.filename + ext;
        } else {
            var map = fis.config.get('roadmap.ext');
            for(var key in map){
                if(map.hasOwnProperty(key)){
                    var oExt = normalizeExt(key);
                    var rExt = normalizeExt(map[key]);
                    if(rExt === ext && fis.util.isFile(this.realpathNoExt + oExt)) {
                        path = './' + this.filename + oExt;
                        break;
                    }
                }
            }
        }
        if(path){
            var info = fis.uri.getId(path, this.dirname);

            // if(info.file && info.file.useMap){
            //     this.addRequire(info.id);
            // }

            // 如果目标文件已经在异步依赖中，则不处理。
            if(info.file && info.file.useMap && (!this.extras || !this.extras.async || !~this.extras.async.indexOf(info.file.id))){
                this.addRequire(info.id);
            }
        }
    },
    removeRequire : function(id){
        var pos = this.requires.indexOf(id);
        if(pos > -1){
            this.requires.splice(pos, 1);
        }
    }
});

module.exports = File.factory();
module.exports.wrap = function(file){
    if(typeof file === 'string'){
        return new File(file);
    } else if(file instanceof File){
        return file;
    } else {
        fis.log.error('unable to convert [' + (typeof file) + '] to [File] object.');
    }
};
