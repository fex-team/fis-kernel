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
fis.project.setProjectRoot(__dirname);
var  _ = fis.file,
    config = fis.config;
var expect = require('chai').expect;
var u = fis.util;

function buf2arr(buf) {
    return Array.prototype.slice.call(buf);
}

describe('getContent',function(){
    var f = _.wrap('a.txt');

});
describe('setContent',function(){

});
describe('exists',function(){
    it('not exist',function(){
        var f = _.wrap('not_exist.txt');
        expect(f.exists()).to.be.false;
    });
    it('exist',function(){
        var f = _.wrap(__dirname+'/file/ext/modular/js.js');
        expect(f.exists()).to.be.true;
    });
});

describe('isText',function(){
    it('general',function(){
        var f = _.wrap('');
        expect(f.isText()).to.be.false;
        f = _.wrap('a.css');
        expect(f.isText()).to.be.true;
        f = _.wrap('a.css/a');
        expect(f.isText()).to.be.false;
        f = _.wrap('a.js/a.css');
        expect(f.isText()).to.be.true;
        f = _.wrap('test.js');
        expect(f.isText()).to.be.true;
        f = _.wrap('/dd/dd/test.bak');
        expect(f.isText()).to.be.true;
        f = _.wrap('d:/sdf/sdf/test.tmp');
        expect(f.isText()).to.be.true;
    });

});
describe('isImage',function(){
    it('general',function(){
        var f = _.wrap('');
        expect(f.isImage()).to.be.false;
        f = _.wrap('d:/sdf/sdf/test.txt');
        expect(f.isImage()).to.be.false;
        f = _.wrap('a.jpg');
        expect(f.isImage()).to.be.true;
        f = _.wrap('a.gif/a');
        expect(f.isImage()).to.be.false;
        f = _.wrap('a.js/a.jpeg');
        expect(f.isImage()).to.be.true;
        f = _.wrap('test.png');
        expect(f.isImage()).to.be.true;
        f = _.wrap('/dd/dd/test.bmp');
        expect(f.isImage()).to.be.true;
        f = _.wrap('d:/sdf/sdf/test.svg');
        expect(f.isImage()).to.be.true;
    });
});
describe('toString',function(){
    it('general',function(){
        var f = _.wrap('hello.js/hello.css');
        expect(f.toString()).to.equal('hello.js/hello.css');
        f = _.wrap('d:\\hello.js\\hello.css');
        expect(f.toString()).to.equal('d:/hello.js/hello.css');
        f = _.wrap('./file/ext/modular/js.js');
        expect(f.toString()).to.equal(u(__dirname)+'/file/ext/modular/js.js');
    });
});

describe('getMtime',function(){
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
    it('has no hash',function(){
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        //这个有点囧，直接用了util的方法来算md5
        expect(f.getHash()).to.equal(u.md5(fs.readFileSync(path)));
    });
    it('has hash',function(){
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        f._hash = 'f88fd49';
        expect(f.getHash()).to.equal(f._hash);
    });
});
describe('getBase64(prefix)',function(){
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
describe('writeTo(target)',function(){
    it('utf8-utf8',function(){
        //源文件和目标文件都是utf8
        var path = __dirname+'/util/encoding/utf8.txt';
        var target = __dirname+'/tmp/utf8.txt';
        var f = _.wrap(path);
        f.getContent();
        f.writeTo( __dirname+'/tmp/utf8.txt');
        var binary = buf2arr(fs.readFileSync(target));
        expect(u.isUtf8(binary)).to.be.true;
        expect(fs.readFileSync(target)).to.deep.equal(fs.readFileSync(__dirname+'/util/encoding/utf8.txt'));
        u.del((__dirname+'/tmp/'));
    });
    it('gbk-utf8',function(){
        //源文件是gbk，目标文件是utf8
        var path = __dirname+'/util/encoding/gbk.txt';
        var target = __dirname+'/tmp/utf8.txt';
        var f = _.wrap(path);
        f.getContent();
        f.writeTo(target);
        var binary = buf2arr(fs.readFileSync(target));
        expect(u.isUtf8(binary)).to.be.true;
        expect(u.read(target)).to.equal('你好,我是gbk');
        u.del((__dirname+'/tmp/'));
    });

    it('utf8-gbk',function(){
        //源文件是utf8，目标文件是gbk
        var path = __dirname+'/util/encoding/utf8-bom.txt';
        var target = __dirname+'/tmp/gbk.txt';
        var f = _.wrap(path);
        f.getContent();
        fis.config.set('project.charset', 'gbk');
        f.writeTo(target);
        var binary = buf2arr(fs.readFileSync(target));
        expect(u.isUtf8(binary)).to.be.false;
        //gbk没有©这个字符，所以不能正常显示
        expect(u.read(target)).to.equal('你好,\u0000\u0000我是€utf8-bom文件');
        //恢复现场
        u.del((__dirname+'/tmp/'));
        fis.config.set('project.charset', 'utf-8');
    });
    it('gbk-gbk',function(){
        //gbk到gbk
        var path = __dirname+'/util/encoding/gbk.txt';
        var target = __dirname+'/tmp/gbk.txt';
        var f = _.wrap(path);
        f.getContent();
        fis.config.set('project.charset', 'gbk');
        f.writeTo(target);
        var binary = buf2arr(fs.readFileSync(target));
        expect(u.isUtf8(binary)).to.be.false;
        expect(u.read(target)).to.equal('你好,我是gbk');

        u.del((__dirname+'/tmp/'));
        fis.config.set('project.charset', 'utf-8');
    });

});

describe('getId',function(){
    it('general',function(){
        var path = __dirname+'/util/encoding/gbk.txt';
        var f = _.wrap(path);
        f.id = 'gbk.txt';
        expect(f.getId()).to.equal('gbk.txt');
    });
});
describe('getUrl(withHash, withDomain)',function(){
    it('general',function(){
        //非js、css、图片文件
        var path = __dirname+'/util/encoding/gbk.txt?__inline';
        var f = _.wrap(path);
        var url = f.getUrl();
        expect(url).to.equal('/util/encoding/gbk.txt?__inline');
        //js、css、图片文件
        path = __dirname+'/file/ext/modular/js.js?__inline';
        f = _.wrap(path);
        url = f.getUrl();
        expect(url).to.equal('/file/ext/modular/js.js?__inline');
    });
    it('with hash',function(){
        //非js、css、图片文件
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

    it('with hash and domain',function(){
        //非js、css、图片文件
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
    it('general',function(){
        var path = __dirname+'/util/encoding/gbk.txt';
        var f = _.wrap(path);
        var url = f.getHashRelease();
        var hash = u.md5(f.getContent());
        expect(url).to.equal('/util/encoding/gbk.txt');
    });

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

});

describe('addRequire(id)',function(){
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
    //第一次加
    var path = __dirname+'/file/ext/modular/js.js';
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
        var path = __dirname+'/file/css/test.js';
        var f = _.wrap(path);
        //存在同名的css文件
        f.addSameNameRequire('.less');
        expect(f.requires).to.deep.equal([
            'file/css/test.css'
        ]);
    });
});


describe('deliver(output, md5)',function(){
    var output =  __dirname+'/file/output';
    afterEach(function(){
        u.del(output);
    });
    it('md5--js',function(){
        //output目录不存在应当自动创建
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        f.deliver(output,1);
        expect(fs.existsSync(output+'/file/ext/modular/js_'+ f.getHash()+'.js')).to.be.true;
        expect(fs.existsSync(output+'/file/ext/modular/js.js')).to.be.false;
    });

    it('md5--txt',function(){
        //txt的文件默认不加hash
        path = __dirname+'/util/base64/logo.txt';
        f = _.wrap(path);
        f.deliver(output,1);
        expect(fs.existsSync(output+'/util/base64/logo_'+ f.getHash()+'.txt')).to.be.false;
        expect(fs.existsSync(output+'/util/base64/logo.txt')).to.be.true;
    });
    it('no md5',function(){
        //output目录不存在
        var path = __dirname+'/file/ext/modular/js.js';
        var f = _.wrap(path);
        f.getContent();
        f.deliver(output,0);
        expect(fs.existsSync(output+'/file/ext/modular/js_'+ f.getHash()+'.js')).to.be.false;
        expect(fs.existsSync(output+'/file/ext/modular/js.js')).to.be.true;
        var newhash = u.md5(u.read(output+'/file/ext/modular/js.js'));
        expect(f.getHash()).to.equal(newhash);
    });
    it('md5&no md5',function(){
        //output目录不存在
        var path = __dirname+'/file/css/test.css';
        var f = _.wrap(path);
        f.getContent();
        f.deliver(output,2);
        expect(fs.existsSync(output+'/file/css/test_'+ f.getHash()+'.css')).to.be.true;
        expect(fs.existsSync(output+'/file/css/test.css')).to.be.true;
    });

    it('deliver 2 times and change contents of the file',function(){
        //output目录不存在
        var path = __dirname+'/file/css/test.css';
        u.write(path,'wawawa');
        var f = _.wrap(path);
        //现在必须显式地设置file的内容，否则内容为空
        f.getContent();
        f.deliver(output,2);
        //源文件的hash
        var hash1 = f.getHash();
        expect(f.delivered).to.deep.equal([
            u(__dirname)+"/file/output/file/css/test.css",
            u(__dirname)+"/file/output/file/css/test_"+hash1+".css"
        ]);

        //output的hash
        var hash2 = u.md5(u.read(output+'/file/css/test.css'));
        u.write(path,'hello world');
        //修改文件内容后的源文件的hash
        f = _.wrap(path);
        /*第二次deliver，文件内容发生变化*/
        f.deliver(output,2);
        var newhash = f.getHash();
        //2次hash值一定不相等
        expect(newhash!=hash2).to.be.true;
        expect(f.getContent()).to.equal('hello world');

        /**第二次的新的md5版本的css文件**/
        expect(fs.existsSync(output+'/file/css/test_'+ newhash+'.css')).to.be.true;
        expect(fs.existsSync(output+'/file/css/test.css')).to.be.true;
        //第一次release的css的md5版本
        expect(fs.existsSync(output+'/file/css/test_'+ hash1+'.css')).to.be.true;

        //第二次的没有md5的js文件与第一次没有md5的js文件不相同
        expect(u.md5(u.read(output+'/file/css/test.css'))!=hash2).to.be.true;
        expect(f.delivered).to.deep.equal([
            u(__dirname)+"/file/output/file/css/test.css",
            u(__dirname)+"/file/output/file/css/test_"+newhash+".css"
        ]);
    });
});