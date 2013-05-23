/**
 * Created with JetBrains WebStorm.
 * User: shenlixia01
 * Date: 13-5-15
 * Time: 下午3:37
 * To change this template use File | Settings | File Templates.
 */

'use strict';

var fis = require('../../fis-kernel.js'),
    _ = fis.util,
    config = fis.config,
    file = fis.file,
    expect = require('chai').expect;
var root = __dirname + '/file';
fis.project.setProjectRoot(root);
var compile = fis.compile;
describe('compile(path, debug)', function () {
    var conf = config.get(),
        tempfiles = [];
    var modstr = '--module--';
    var parstr = '--parser--';
    var lintstr = '--lint--';
    var optstr = '--opt--';
    //lint处理的结果不会写入到文件
    var added = parstr+modstr+optstr;
    before(function(){
        fis.project.setTempRoot(root+'/target/');
        _.copy(root+'/fis-modular-modular',root+'/../../../node_modules/fis-modular-modular');
        _.copy(root+'/fis-lint-lint',root+'/../../../node_modules/fis-lint-lint');
        _.copy(root+'/fis-optimizer-optimizer',root+'/../../../node_modules/fis-optimizer-optimizer');
        _.copy(root+'/fis-parser-parser',root+'/../../../node_modules/fis-parser-parser');
        //设置各个处理器的路径，对应于compile.js，modules.parser.js,module.modular.js
        config.set('modules', {
            parser : {
                js : 'parser'
            },
            modular : {
                js : 'modular'
            },
            lint :{
                js :'lint'
            },
            optimizer :{
                js :'optimizer'
            }
        });
        config.set('roadmap', {
            ext : {
                'coffee' : 'js'
            },
            path : [
                    {
                        "reg" : "^\/(.*)\\.coffee$",
                        "release" : "/static/$1.js"
                    },
                    {
                        "reg" : "^\/(.*)",
                        "release" : "/static/$1"
                    }
                ],
            url : [
                {
                    "reg" : "^\/static\/(.*)$",
                    "path" : "/$1"
                }
            ]
        });
    });
    after(function(){
        //恢复环境
        config.set(conf);
        compile.clean();
        _.del(root+'/../../../node_modules/fis-modular-modular');
        _.del(root+'/../../../node_modules/fis-lint-lint');
        _.del(root+'/../../../node_modules/fis-optimizer-optimizer');
        _.del(root+'/../../../node_modules/fis-parser-parser');
    });
    beforeEach(function(){
        compile.setup({
            debug:true,
            optimize:true,
            hash:true,
            lint :true,
            domain:true
        });
        tempfiles = [];
    });
    afterEach(function(){
        tempfiles.forEach(function(f){
            _.del(f);
        });
    });
    it('general', function(){
        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);
        tempfiles.push(f);
        var cache = fis.cache(f);

        f = file(f);
        f.isMod = true;
        var c = compile(f).getContent();
        expect(c).to.equal(content + added);
        //from cache
        c = compile(f).getContent();
        expect(c).to.equal(content + added);
    });



    it('embed--2 embed', function(){
        //f1内嵌f2，f2内嵌f3
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;<[{embed(./embed.coffee?i=123)}]>',
            content2 = '<[{embed(./embed2.js)}]>';
        var f3 = _(__dirname, 'file/embed2.js');
        var content3 = 'I am embed2.js';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        f1 = file(f1);
        f1.isMod = true;
        var c = compile(f1).getContent();
        //coffee默认不走parser，因为parser就是做coffee到js的转换之类的事情的
        expect(c).to.equal('I am embed.js;' +content3 +parstr + optstr + optstr + parstr + modstr + optstr);

        c = compile(f1).getContent();
        //coffee默认不走parser，因为parser就是做coffee到js的转换之类的事情的
        expect(c).to.equal('I am embed.js;' +content3 +parstr + optstr + optstr + parstr + modstr + optstr);


        //修改embed的文件，看主文件中embed的内容是否发生改变
        content3 = 'i am a lonely js';
        _.write(f3, content3);
        //故意错开他们的修改时间，使得他们的timestamp发生改变，从而使得缓存失效
        _.touch(f3,12345678);
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content3 +parstr + optstr + optstr + parstr + modstr + optstr);
    });

    it('embed--a->b->c,cache b,a first then change c and watch changes of a', function(){
        //f1内嵌f2，f2内嵌f3
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;<[{embed(./embed.coffee?i=123)}]>',
            content2 = '<[{embed(./embed2.js)}]>';
        var f3 = _(__dirname, 'file/embed2.js');
        var content3 = 'I am embed2.js';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        //先cache f2
        f2 = file(f2);
        var c = compile(f2).getContent();
        //再cache f1，之前有一个bug是处理f1再处理f2的时候，没有将f2的依赖加到f2上，使得再处理f1的依赖时少了f2的依赖。从而f3发生变化时，f1不会改变
        compile(f1).getContent();
        //修改embed的文件，看主文件中embed的内容是否发生改变
        content3 = 'i am a lonely js';
        _.write(f3, content3);
        //故意错开他们的修改时间，使得他们的timestamp发生改变，从而使得缓存失效
        _.touch(f3,12345678);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content3 +parstr + optstr + optstr + parstr + optstr);
    });

    it('embed--single embed', function () {
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;<[{embed(./embed.coffee?i=123)}]>',
            content2 = 'I am embed.coffee;';
        var f3 = _(__dirname, 'file/embed2.js');
        var content3 = 'I am embed2.js;<[{embed(./embed.coffee?i=124)}]>';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        var c = compile(f1).getContent();
        //coffee默认不走parser，因为parser就是做coffee到js的转换之类的事情的
        expect(c).to.equal('I am embed.js;' + content2 + optstr + parstr + optstr);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content2 + optstr + parstr + optstr);
        //f3也embed f2
        c = compile(f3).getContent();
        expect(c).to.equal('I am embed2.js;' + content2 + optstr + parstr + optstr);

            //修改embed的文件，看主文件中embed的内容是否发生改变
        _.touch(f2,12345678);
        c = compile(f3).getContent();
        expect(c).to.equal('I am embed2.js;' + content2 + optstr + parstr + optstr);
    });
    it('require', function () {
        var f1 = _(__dirname, 'file/require.js'),
            content1 = 'I <[{require(ext/lint/lint.js)}]>am re<[{require(ext/modular/js.js)}]>quire.js;<[{require(ext/lint/lint.js)}]>.';
        _.write(f1, content1);

        tempfiles.push(f1);
        f1 = file(f1);
        f1.isMod = true;
        expect(compile(f1).requires).to.deep.equal(['ext/lint/lint.js', 'ext/modular/js.js']);
        expect(f1.getContent()).to.equal('I ext/lint/lint.jsam reext/modular/js.jsquire.js;ext/lint/lint.js.' + added);
        //from cache
        expect(compile(f1).requires).to.deep.equal(['ext/lint/lint.js', 'ext/modular/js.js']);
        expect(f1.getContent()).to.equal('I ext/lint/lint.jsam reext/modular/js.jsquire.js;ext/lint/lint.js.' + added);
    });

    it('uri', function(){
        compile.setup({
            debug: true,
            optimize: false,
            hash: true,
            lint: false,
            domain: true
        });
        /*注意，这种方式是直接覆盖roadmap.domain下所有的设置*/
        config.set('roadmap.domain',{
            'js' : 'http://js.baidu.com/',
            'coffee' : 'http://coffee.baidu.com/',
            '*' : 'http://www.baidu.com/'
        });
        var f1 = _(__dirname, 'file/uri.js'),
            f2 = _(__dirname, 'file/curi.coffee'),
            f3 = _(__dirname, 'file/uri.php'),
            content1 = '<[{uri(curi.coffee?i=2)}]>I am uri.js;<[{uri(./curi.coffee?i=1)}]>.<[{uri(./uri.php?i=4)}]>.',
            content2 = 'I am uri.coffee;',
            content3 = 'I am uri.php;';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        f2 = file(f2);
        var hash = f2.getHash();
        var c = compile(f1).getContent();
        expect(c).to.equal('http://coffee.baidu.com/static/curi_'+hash+'.js?i=2I am uri.js;http://coffee.baidu.com/static/curi_'+hash+'.js?i=1./static/uri.php?i=4.'+parstr);
        //debug
        compile.setup({
            debug: true,
            optimize: false,
            hash: true,
            lint: false,
            domain: true
        });
        //todo debug模式怎么用的，应该是没有cdn的
//        c = compile(f1).getContent();
//        expect(c).to.equal('/static/uri.js?i=2I am uri.js;/static/uri.js?i=1./static/uri.php?i=4.'+parstr);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('http://coffee.baidu.com/static/curi_23b27f7.js?i=2I am uri.js;http://coffee.baidu.com/static/curi_23b27f7.js?i=1./static/uri.php?i=4.'+parstr);
        //debug from cache
//        c = compile(f1, 1).getContent();
//        expect(c).to.equal('/static/uri.js?i=2I am uri.js;/static/uri.js?i=1./static/uri.php?i=4.'+parstr);
    });

    it('dep', function(){
        var f1 = _(__dirname, 'file/dep.js'),
            f2 = _(__dirname, 'file/dep.coffee'),
            content1 = 'I am uri.js;<[{dep(dep.coffee)}]>.',
            content2 = 'I am uri.coffee;';
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);
        f1 = file(f1);
        compile(f1);
        var exp = {};
        exp[f2] = _.mtime(f2).getTime();
        expect(f1.cache.deps).to.deep.equal(exp);
    });

});