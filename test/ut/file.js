/**
 * Created with JetBrains WebStorm.
 * User: shenlixia01
 * Date: 13-5-10
 * Time: 上午10:33
 * To change this template use File | Settings | File Templates.
 */
var fs = require('fs'),
    path = require('path');
var fis = require('../../fis-kernel.js');
var  _ = fis.file,
    config = fis.config;
var expect = require('chai').expect;
var u = fis.util;

function buf2arr(buf) {
    return Array.prototype.slice.call(buf);
}

//describe('getContent',function(){
//    beforeEach(function(){
//        fis.project.setProjectRoot(__dirname);
//    });
//    var f = _.wrap('a.txt');
//
//});
//describe('setContent',function(){
//
//});
describe('exists',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    fis.project.setProjectRoot(__dirname);
    it('not exist',function(){
        var f = _.wrap('not_exist.txt');
        expect(f.exists()).to.be.false;
    });
    it('exist',function(){
        var f = _.wrap(__dirname+'/file/ext/modular/js.js');
        expect(f.exists()).to.be.true;
    });
});

describe('toString',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        var f = _.wrap('hello.js/hello.css');
        expect(f.toString()).to.equal('hello.js/hello.css');
        f = _.wrap('d:\\hello.js\\hello.css');
        expect(f.toString()).to.equal('d:/hello.js/hello.css');
        f = _.wrap('./test/ut/file/ext/modular/js.js');
        expect(f.toString()).to.equal(u(__dirname)+'/file/ext/modular/js.js');
    });
});

describe('getMtime',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        var path = __dirname+'/file/a.js';
        var f = _.wrap(path);
        //创建文件
        fs.writeFileSync(path,'hello world');
        var mtime = fs.statSync(path).mtime;
        expect(f.getMtime()).to.deep.equal(mtime);
        //修改文件
        fs.writeFileSync(path,'hello world2');
        mtime = fs.statSync(path).mtime;
        expect(f.getMtime()).to.deep.equal(mtime);
        fs.unlinkSync(path);
    });
});
describe('isFile',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        expect(f.isFile()).to.be.true;
    });
    it('directory',function(){
        //文件夹
        var path = __dirname+'/file/';
        var f = _.wrap(path);
        expect(f.isFile()).to.be.false;
    });
    it('not exist',function(){
        //不存在
        var path = __dirname+'/notexist/a.js';
        var f = _.wrap(path);
        expect(f.isFile()).to.be.false;
    });
});
describe('isDir',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        var path = __dirname+'/file/ext/modular/';
        var f = _.wrap(path);
        expect(f.isDir()).to.be.true;
    });
    it('file',function(){
        //文件
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        expect(f.isDir()).to.be.false;
    });
    it('not exist',function(){
        //不存在
        var path = __dirname+'/notexist/a.js';
        var f = _.wrap(path);
        expect(f.isDir()).to.be.false;

        path = __dirname+'/notexist/';
        f = _.wrap(path);
        expect(f.isDir()).to.be.false;
    });
});

describe('getHash',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('has no hash',function(){
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        //这个有点囧，直接用了util的方法来算md5
        expect(f.getHash()).to.equal(u.md5(fs.readFileSync(path)));
    });
    it('has hash',function(){
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        f._md5 = 'f88fd49';
        expect(f.getHash()).to.equal(f._md5);
    });
});
describe('getBase64(prefix)',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('prefix',function(){
        var path = __dirname+'/util/base64/logo.gif';
        var f = _.wrap(path);
        var content = fs.readFileSync(path);
        f.setContent(content);
        var base64 = f.getBase64();
        expect(/data:image\/gif;base64/.test(base64)).to.be.true;

        base64 = f.getBase64(1);
        expect(/data:image\/gif;base64/.test(base64)).to.be.true;
    });

    it('no prefix',function(){
        var path = __dirname+'/util/base64/logo.gif';
        var f = _.wrap(path);
        var content = fs.readFileSync(path);
        f.setContent(content);
        var base64 = f.getBase64(false);
        expect(base64).to.equal(u.base64(content));
    });

});
//describe('writeTo(target)',function(){
//    beforeEach(function(){
//        fis.project.setProjectRoot(__dirname);
//    });
//    it('utf8-utf8',function(){
//        //源文件和目标文件都是utf8
//        var path = __dirname+'/util/encoding/utf8.txt';
//        var target = __dirname+'/tmp/utf8.txt';
//        var f = _.wrap(path);
//        fis.compile(f);
//        f.writeTo( __dirname+'/tmp/utf8.txt');
//        var binary = buf2arr(fs.readFileSync(target));
//        expect(u.isUtf8(binary)).to.be.true;
//        expect(fs.readFileSync(target)).to.deep.equal(fs.readFileSync(__dirname+'/util/encoding/utf8.txt'));
//        u.del((__dirname+'/tmp/'));
//    });
//    it('gbk-utf8',function(){
//        //源文件是gbk，目标文件是utf8
//        var path = __dirname+'/util/encoding/gbk.txt';
//        var target = __dirname+'/tmp/utf8.txt';
//        var f = _.wrap(path);
//        fis.compile(f);
//        f.writeTo(target);
//        var binary = buf2arr(fs.readFileSync(target));
//        expect(u.isUtf8(binary)).to.be.true;
//        expect(u.read(target)).to.equal('你好,我是gbk');
//        u.del((__dirname+'/tmp/'));
//    });
//
//    it('utf8-gbk',function(){
//        //源文件是utf8，目标文件是gbk
//        fis.config.set('project.charset', 'gbk');
//        var path = __dirname+'/util/encoding/utf8-bom.txt';
//        var target = __dirname+'/tmp/gbk.txt';
//        var f = _.wrap(path);
//        fis.compile(f);
//        f.writeTo(target);
//        var binary = buf2arr(fs.readFileSync(target));
//        expect(u.isUtf8(binary)).to.be.false;
//        //gbk没有©这个字符，所以不能正常显示
//        expect(u.read(target)).to.equal('你好,\u0000\u0000我是€utf8-bom文件');
//        //恢复现场
//        u.del((__dirname+'/tmp/'));
//        fis.config.set('project.charset', 'utf-8');
//    });
//    it('gbk-gbk',function(){
//        //gbk到gbk
//        fis.config.set('project.charset', 'gbk');
//        var path = __dirname+'/util/encoding/gbk.txt';
//        var target = __dirname+'/tmp/gbk.txt';
//        var f = _.wrap(path);
//        fis.compile(f);
//        f.writeTo(target);
//        var binary = buf2arr(fs.readFileSync(target));
//        expect(u.isUtf8(binary)).to.be.false;
//        expect(u.read(target)).to.equal('你好,我是gbk');
//
//        u.del((__dirname+'/tmp/'));
//        fis.config.set('project.charset', 'utf-8');
//    });
//
//});

describe('getId',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        var path = __dirname+'/util/encoding/gbk.txt';
        var f = _.wrap(path);
        f.id = 'gbk.txt';
        expect(f.getId()).to.equal('gbk.txt');
    });
});
describe('getUrl(withHash, withDomain)',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        //非js、css、图片文件
        fis.config.init();
        var path = __dirname+'/util/encoding/gbk.txt?__inline';
        var f = _.wrap(path);
        var url = f.getUrl();
        expect(url).to.equal('/util/encoding/gbk.txt?__inl' +
            'ine');
        //js、css、图片文件
        path = __dirname+'/file/ext/modular/js.js?__inline';
        f = _.wrap(path);
        url = f.getUrl();
        expect(url).to.equal('/file/ext/modular/js.js?__inline');
    });
    it('with hash',function(){
        //非js、css、图片文件
        fis.config.init();
        var path = __dirname+'/util/encoding/gbk.txt?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(true);
        expect(url).to.equal('/util/encoding/gbk.txt?__inline');
        //js、css、图片文件
        path = __dirname+'/file/ext/modular/js.js?__inline';
        f = _.wrap(path);
        url = f.getUrl(true);
        expect(url).to.equal('/file/ext/modular/js_'+ f.getHash()+'.js?__inline');
    });
    it('with domain',function(){
        //非js、css、图片文件
        fis.config.init();
        var path = __dirname+'/util/encoding/gbk.txt';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/util/encoding/gbk.txt');
        //js、css、图片文件
        fis.config.set('roadmap.domain','www.baidu.com');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        f = _.wrap(path);
        url = f.getUrl(false,true);
        expect(url).to.equal('www.baidu.com/file/ext/modular/js.js?__inline');
    });

    it('with domain——domain是对象，且键是图片，对图片的通用处理',function(){
        //非js、css、图片文件
        fis.config.init();
        var path = __dirname+'/util/img/data.png';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/util/img/data.png');
        //js、css、图片文件
        fis.config.set('roadmap.domain',{
            'image':'img.baidu.com',
            '**.js':'js.baidu.com',//'**'代表多级目录
            '*.css':'css.baidu.com'
        });
        f = _.wrap(path);
        url = f.getUrl(false,true);
        expect(url).to.equal('img.baidu.com/util/img/data.png');

        path = __dirname+'/file/ext/lint/lint.js';
        f = _.wrap(path);
        url = f.getUrl(false,true);
        expect(url).to.equal('js.baidu.com/file/ext/lint/lint.js');

        path = __dirname+'/file/css/test.css?__inline';
        f = _.wrap(path);
        url = f.getUrl(false,true);
        //同级目录下没有css文件，所以不会被命中
        expect(url).to.equal('/file/css/test.css?__inline');
    });

    it('with domains——domain array',function(){
        fis.config.init();
        fis.config.set('roadmap.domain',{
            'image': ['img1.baidu.com', 'img2.baidu.com', 'img3.baidu.com', 'img4.baidu.com'],
            '**.js': ['js1.baidu.com', 'js2.baidu.com', 'js3.baidu.com'],
            '*.css': ['css1.baidu.com', 'css2.baidu.com']
        });

        //js、css、图片文件
        var path = __dirname+'/util/img/data.png';
        var f = _.wrap(path);
        var url1 = f.getUrl(false,true);
        f = _.wrap(path);
        var url2 = f.getUrl(false,true);
        expect(url1).to.equal(url2);

        path = __dirname+'/file/ext/lint/lint.js';
        f = _.wrap(path);
        url1 = f.getUrl(false,true);
        f = _.wrap(path);
        url2 = f.getUrl(false,true);
        expect(url1).to.equal(url2);

        path = __dirname+'/file/css/test.css?__inline';
        f = _.wrap(path);
        url1 = f.getUrl(false,true);
        f = _.wrap(path);
        url2 = f.getUrl(false,true);
        expect(url1).to.equal(url2);
    });

    it('with no release',function(){
        config.set('roadmap', {
            path : [{
                    "reg" : /^\/(.*)/,
                    "release" : "static/$1"
                }]
        });
        //js
        fis.config.set('roadmap.domain','www.baidu.com');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('www.baidu.com/static/file/ext/modular/js.js?__inline');
    });

    it('with release false',function(){
        config.set('roadmap', {
            path : [{
                "reg" : '**.js',
                "release" : '/static$&'
            },
                {
                "reg" : /^\/(.*)/,
                "release" : false
            }]
        });
        //js
//        fis.config.set('roadmap.domain','www.baidu.com');
        path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        expect(fs.existsSync(__dirname+'/file/ext/modular/static/js.js')).to.be.ture;
        //html
        path = __dirname+'/file/ext/modular/html.html';
        f = _.wrap(path);
        expect(fs.existsSync(__dirname+'/file/ext/modular/static/html.html')).to.be.false;
    });

    //array
    it('with domain——domain是数组',function(){
        //非js、css、图片文件
        fis.config.init();
        var path = __dirname+'/util/img/data.png';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/util/img/data.png');
        fis.config.set('roadmap.domain',[
            'img.baidu.com'
        ]);
        f = _.wrap(path);
        url = f.getUrl(false,true);
        expect(url).to.equal('img.baidu.com/util/img/data.png');

        fis.config.set('roadmap.domain',[
            'js.baidu.com',
            'img.baidu.com',
            'css.baidu.com'
        ]);
        path = __dirname+'/file/ext/lint/lint.js';
        f = _.wrap(path);
        url = f.getUrl(false,true);
        expect(url).to.equal('js.baidu.com/file/ext/lint/lint.js');
    });


    it('with hash and domain',function(){
        //非js、css、图片文件
        fis.config.init();
        var path = __dirname+'/util/encoding/gbk.txt';
        var f = _.wrap(path);
        var url = f.getUrl(true,true);
        expect(url).to.equal('/util/encoding/gbk.txt');
        //js、css、图片文件
        fis.config.set('roadmap.domain','www.baidu.com');
        path = __dirname+'/file/css/test.css?__inline';
        f = _.wrap(path);
        url = f.getUrl(true,true);
        expect(url).to.equal('www.baidu.com/file/css/test_'+ f.getHash()+'.css?__inline');

    });

});
describe('getHashRelease',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    //txt不能release
//    it('general',function(){
//        var path = __dirname+'/util/encoding/gbk.txt';
//        var f = _.wrap(path);
//        var url = f.getHashRelease();
//        var hash = u.md5(f.getContent());
//        expect(url).to.equal('/util/encoding/gbk.txt');
//    });

    it('with hash',function(){
        //js
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        var url = f.getHashRelease();
        var hash = u.md5(f.getContent());
        expect(url).to.equal('/file/ext/modular/js_'+ hash+'.js');
        //css
        path = __dirname+'/file/css/test.css?__inline';
        f = _.wrap(path);
        url = f.getHashRelease();
        hash = u.md5(f.getContent());
        expect(url).to.equal('/file/css/test_'+ hash+'.css');
        //image
        path = __dirname+'/img/w3c_home.gif?__inline';
        f = _.wrap(path);
        url = f.getHashRelease();
        hash = u.md5(f.getContent());
        expect(url).to.equal('/img/w3c_home_'+ hash+'.gif');
    });
    it('without hash',function(){
        //html, not release
        var path = __dirname+'/file/ext/modular/html.html';
        var f = _.wrap(path);
        var url = f.getHashRelease();
        var hash = u.md5(f.getContent());
        expect(url).to.equal('/file/ext/modular/html.html');
    });

});

describe('addRequire(id)',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    var path = __dirname+'/file/ext/modular/js.js';
    it('general',function(){
       //第一次加
        var f = _.wrap(path);
        f.addRequire(__dirname+'/file/css/test.css');
        expect(f.requires).to.deep.equal([
            __dirname+'/file/css/test.css'
        ]);
        //重复添加依赖
        f.addRequire(__dirname+'/file/css/test.css');
        expect(f.requires).to.deep.equal([
            __dirname+'/file/css/test.css'
        ]);
        f.addRequire(__dirname+'/file/ext/parser/js.js');
        expect(f.requires).to.deep.equal([
            __dirname+'/file/css/test.css',
            __dirname+'/file/ext/parser/js.js'
        ]);
    });
    it('general',function(){
        //第一次加
        var f = _.wrap(path);
        f.addRequire(__dirname+'/file/css/test.css');
        expect(f.requires).to.deep.equal([
            __dirname+'/file/css/test.css'
        ]);
        //重复添加依赖
        f.addRequire(' '+__dirname+'/file/css/test.css   ');
        expect(f.requires).to.deep.equal([
            __dirname+'/file/css/test.css'
        ]);
        var id = f.addRequire(__dirname+'/file/ext/parser/js.js  ');
        expect(f.requires).to.deep.equal([
            __dirname+'/file/css/test.css',
            __dirname+'/file/ext/parser/js.js'
        ]);
    });
    it('id is empty',function(){
        //第一次加
        var f = _.wrap(path);
        expect(f.addRequire('  ')).to.be.false;
        expect(f.requires).to.deep.equal([]);
    });

});
describe('removeRequire(id)',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    //第一次加
    var path = __dirname+'file/ext/modular/js.js';
    var f = _.wrap(path);
    f.addRequire(__dirname+'/file/css/test.css');
    f.addRequire(__dirname+'/file/ext/parser/js.js  ');

    f.removeRequire(__dirname+'/file/ext/parser/js.js');
    expect(f.requires).to.deep.equal([
        __dirname+'/file/css/test.css'
    ]);
});

//在当前目录下寻找同名不同后缀的文件，并作为依赖添加进来
describe('addSameNameRequire(ext)',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
    });
    it('general',function(){
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        //不存在同名的css文件
        f.addSameNameRequire('.css');
        expect(f.requires).to.deep.equal([]);

        path = __dirname+'/file/css/test.js';
        f = _.wrap(path);
        //存在同名的css文件
        f.addSameNameRequire('.css');
        expect(f.requires).to.deep.equal([
            'file/css/test.css'
        ]);
    });

    it('roadmap',function(){
        fis.config.set('roadmap.ext',{
            'less':'css'
        });
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        //存在同名的css文件
        f.addSameNameRequire('.css');
        expect(f.requires).to.deep.equal([
            'file/ext/modular/js.less'
        ]);
    });
});


//describe('deliver(output, md5)',function(){
//    beforeEach(function(){
//        fis.project.setProjectRoot(__dirname);
//    });
//    var output =  __dirname+'/file/output';
//    afterEach(function(){
//        u.del(output);
//    });
//    it('md5--js',function(){
//        //output目录不存在应当自动创建
//        var path = __dirname+'/file/ext/modular/js.js';
//        var f = _.wrap(path);
//        f.deliver(output,1);
//        expect(fs.existsSync(output+'/file/ext/modular/js_'+ f.getHash()+'.js')).to.be.true;
//        expect(fs.existsSync(output+'/file/ext/modular/js.js')).to.be.false;
//    });
//
//    it('md5--txt',function(){
//        //txt的文件默认不加hash
////        var path = __dirname+'/util/base64/logo.txt';
////        var f = _.wrap(path);
////        f.deliver(output,1);
////        expect(fs.existsSync(output+'/util/base64/logo_'+ f.getHash()+'.txt')).to.be.false;
////        expect(fs.existsSync(output+'/util/base64/logo.txt')).to.be.true;
//    });
//    it('no md5',function(){
//        //output目录不存在
//        var path = __dirname+'/file/ext/modular/js.js';
//        var f = _.wrap(path);
//        f.getContent();
//        f.deliver(output,0);
//        expect(fs.existsSync(output+'/file/ext/modular/js_'+ f.getHash()+'.js')).to.be.false;
//        expect(fs.existsSync(output+'/file/ext/modular/js.js')).to.be.true;
//        var newhash = u.md5(u.read(output+'/file/ext/modular/js.js'));
//        expect(f.getHash()).to.equal(newhash);
//    });
//    it('md5&no md5',function(){
//        //output目录不存在
//        var path = __dirname+'/file/css/test.css';
//        var f = _.wrap(path);
//        f.getContent();
//        f.deliver(output,2);
//        expect(fs.existsSync(output+'/file/css/test_'+ f.getHash()+'.css')).to.be.true;
//        expect(fs.existsSync(output+'/file/css/test.css')).to.be.true;
//    });
//
//    it('deliver 2 times and change contents of the file',function(){
//        //output目录不存在
//        var path = __dirname+'/file/css/test.css';
//        u.write(path,'wawawa');
//        var f = _.wrap(path);
//        //现在必须显式地设置file的内容，否则内容为空
//        f.getContent();
//        f.deliver(output,2);
//        //源文件的hash
//        var hash1 = f.getHash();
//        expect(f.delivered).to.deep.equal([
//            u(__dirname)+"/file/output/file/css/test.css",
//            u(__dirname)+"/file/output/file/css/test_"+hash1+".css"
//        ]);
//
//        //output的hash
//        var hash2 = u.md5(u.read(output+'/file/css/test.css'));
//        u.write(path,'hello world');
//        //修改文件内容后的源文件的hash
//        f = _.wrap(path);
//        /*第二次deliver，文件内容发生变化*/
//        f.deliver(output,2);
//        var newhash = f.getHash();
//        //2次hash值一定不相等
//        expect(newhash!=hash2).to.be.true;
//        expect(f.getContent()).to.equal('hello world');
//
//        /**第二次的新的md5版本的css文件**/
//        expect(fs.existsSync(output+'/file/css/test_'+ newhash+'.css')).to.be.true;
//        expect(fs.existsSync(output+'/file/css/test.css')).to.be.true;
//        //第一次release的css的md5版本
//        expect(fs.existsSync(output+'/file/css/test_'+ hash1+'.css')).to.be.true;
//
//        //第二次的没有md5的js文件与第一次没有md5的js文件不相同
//        expect(u.md5(u.read(output+'/file/css/test.css'))!=hash2).to.be.true;
//        expect(f.delivered).to.deep.equal([
//            u(__dirname)+"/file/output/file/css/test.css",
//            u(__dirname)+"/file/output/file/css/test_"+newhash+".css"
//        ]);
//    });
//});
