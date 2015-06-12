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
var compile = fis.compile;
var fs = require('fs');

describe('compile(path, debug)', function () {
    var conf = config.get(),
        tempfiles = [];
    var modstr = '--module--';
    var parstr = '--parser--';
    var optstr = '--opt--';
    //lint处理的结果不会写入到文件
    var added = parstr+modstr+optstr;
    beforeEach(function(){
        config.init();
        fis.project.setProjectRoot(root);
        fis.project.setTempRoot(root+'/target/');       //cache clean dir
        _.copy(root+'/fis-modular-modular',root+'/../../../node_modules/fis-preprocessor-modular');
        _.copy(root+'/fis-lint-lint',root+'/../../../node_modules/fis-lint-lint');
        _.copy(root+'/fis-test-test',root+'/../../../node_modules/fis-test-test');
        _.copy(root+'/fis-optimizer-optimizer',root+'/../../../node_modules/fis-optimizer-optimizer');
        _.copy(root+'/fis-parser-parser',root+'/../../../node_modules/fis-parser-parser');
        _.copy(root+'/fis-parser-options',root+'/../../../node_modules/fis-parser-options');
        _.copy(root+'/fis-config-test',root+'/../../../node_modules/fis-config-test');
        //设置各个处理器的路径，对应于compile.js，modules.parser.js,module.modular.js
        config.set('modules', {
            parser : {
                js : 'parser',
                css: 'options'
            },
            preprocessor : {
                js : 'modular'
            },
            lint :{
                js :'lint'
            },
            test :{
                js:'test'
            },
            optimizer :{
                js :'optimizer'
            }
        });
        config.set('roadmap', {
            ext : {
                'coffee' : 'js'
            },
            path : [{
                        "reg" : /^\/(.*)\\.coffee$/,
                        "release" : "/static/$1.js"
                    },
                    {
                        "reg" : /^\/(.*)/,
                        "release" : "/static/$1"
//                    }],
//            url : [{
//                    "reg" : "^\/static\/(.*)$",
//                    "path" : "/$1"
                }]
        });
    });
    after(function(){
        //恢复环境
        config.set(conf);
        compile.clean();
        fis.cache.clean(root+'/target');
        _.del(root+'/../../../node_modules/fis-preprocessor-modular');
        _.del(root+'/../../../node_modules/fis-lint-lint');
        _.del(root+'/../../../node_modules/fis-test-test');
        _.del(root+'/../../../node_modules/fis-optimizer-optimizer');
        _.del(root+'/../../../node_modules/fis-parser-parser');
        _.del(root+'/../../../node_modules/fis-parser-options');
        _.del(root+'/../../../node_modules/fis-config-test');
    });
    beforeEach(function(){
        compile.setup({
            debug:true,
            optimize:true,
            hash:true,
            // lint :true,
            // test :true,
            domain:true
        });
        tempfiles = [];
    });
    afterEach(function(){
        tempfiles.forEach(function(f){
            _.del(f);
            _.del(root+'/target/');
        });
    });

    it('general', function(){
        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);
        // tempfiles.push(f);
        var cache = fis.cache(f);

        f = file(f);
        f.isMod = true;
        var c = compile(f).getContent();
        expect(c).to.equal(content + added);
        //from cache
        c = compile(f).getContent();
        expect(c).to.equal(content + added);

        //useParser,usePreprocessor,useOptimizer false
        compile.clean();
        config.set('roadmap.path', [
            {
                reg : '**.js',
                useParser : false,
                usePreprocessor : false,
                useOptimizer :false
            }
        ]);
        f = _(__dirname, 'file/general.js');
        _.write(f, content);
        tempfiles.push(f);
        f = file(f);

        c = compile(f).getContent();
        expect(c).to.equal(content);
        //from cache
        c = compile(f).getContent();
        expect(c).to.equal(content);

    });

    it('general_', function(){
        compile.setup({
            debug: false,
            optimize: false,
            hash: false,
            lint: false,
            domain: false
        });
        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);
        tempfiles.push(f);
        var cache = fis.cache(f);

        f = file(f);
        f.isMod = true;
        var c = compile(f).getContent();
        expect(c).to.equal(content + '--parser----module--');
        //from cache
        c = compile(f).getContent();
        expect(c).to.equal(content + '--parser----module--');
    });

    it('roadmap.path useXX parameter', function(){
        //useParser,usePreprocessor,useStandard,useLint,useTest,useOprimizer
        compile.clean();
        config.init();
        config.set('roadmap.path', [
            {
                reg : '**.js',
                useParser : false,
                usePreprocessor : false,
                useStandard : false,
                // usePostprocessor : false,
                useLint : false,
                useTest : false,
                useOptimizer :false
            }
        ]);
        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);
        tempfiles.push(f);
        var cache = fis.cache(f);

        f = file(f);
        f.isMod = true;
        var c = compile(f).getContent();
        expect(c).to.equal(content);
        //from cache
        c = compile(f).getContent();
        expect(c).to.equal(content);
    });

    it('not compile', function(){
        //text
        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);
        f = file(f);
        f.useCompile = false;
        var c = compile(f).getContent();
        expect(typeof(c)).to.equal("string");
        expect(c.toString()).to.equal(content);

        //picture
        var f2 = _(__dirname, 'compile/css/test.bmp');
        f2 = file(f2);        
        f2.useCompile = false;
        var c2 = compile(f2).getContent();
        expect(typeof(c2)).to.equal("object");

    });

    it('class File', function(){
        var f = _(__dirname, 'file/a.js'),
            content = 'var abc = 123;';
        f = fis.file.wrap(f);
        f.setContent(content);
        var c = compile(f).getContent();
        expect(c).to.equal(content+added);
    });

    it('embed--2 embed', function(){
        //f1内嵌f2，f2内嵌f3
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;'+compile.lang.embed.ld+'./embed.coffee?i=123'+compile.lang.embed.rd,
            content2 = compile.lang.embed.ld+'./embed2.js'+compile.lang.embed.rd;
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
        expect(c).to.equal('I am embed.js;' +content3 +parstr + modstr + optstr + modstr +optstr + parstr + modstr + optstr);

        c = compile(f1).getContent();
        //coffee默认不走parser，因为parser就是做coffee到js的转换之类的事情的
        expect(c).to.equal('I am embed.js;' +content3 +parstr + modstr + optstr + modstr +optstr + parstr + modstr + optstr);


        //修改embed的文件，看主文件中embed的内容是否发生改变
        content3 = 'i am a lonely js';
        _.write(f3, content3);
        //故意错开他们的修改时间，使得他们的timestamp发生改变，从而使得缓存失效
        _.touch(f3,12345678);
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content3 +parstr + modstr+ optstr + modstr+ optstr + parstr + modstr + optstr);

    });

    it('embed--a->b->c,cache b,a first then change c and watch changes of a', function(){
        //f1内嵌f2，f2内嵌f3
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;'+compile.lang.embed.ld+'./embed.coffee?i=123'+compile.lang.embed.rd,
            content2 = compile.lang.embed.ld+'./embed2.js'+compile.lang.embed.rd;
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
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content3 +parstr + modstr+ optstr + modstr+ optstr + parstr + modstr +optstr);
    });

    it('embed--single embed', function () {
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;'+compile.lang.embed.ld+'./embed.coffee?i=123'+compile.lang.embed.rd,
            content2 = 'I am embed.coffee;';
        var f3 = _(__dirname, 'file/embed2.js');
        var content3 = 'I am embed2.js;'+compile.lang.embed.ld+'./embed.coffee?i=124'+compile.lang.embed.rd;
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        var c = compile(f1).getContent();
        //coffee默认不走parser，因为parser就是做coffee到js的转换之类的事情的
        expect(c).to.equal('I am embed.js;' + content2 + modstr +optstr + parstr + modstr +optstr);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content2 + modstr +optstr + parstr + modstr +optstr);
        //f3也embed f2
        c = compile(f3).getContent();
        expect(c).to.equal('I am embed2.js;' + content2 + modstr +optstr + parstr + modstr +optstr);

            //修改embed的文件，看主文件中embed的内容是否发生改变
        _.touch(f2,12345678);
        c = compile(f3).getContent();
        expect(c).to.equal('I am embed2.js;' + content2 + modstr +optstr + parstr + modstr +optstr);
    });

    it('embed--isAbusolute', function () {
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.coffee'),
            content1 = 'I am embed.js;'+compile.lang.embed.ld+__dirname+'/file/embed.coffee'+compile.lang.embed.rd,
            content2 = 'I am embed.coffee;';
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content2 + modstr +optstr + parstr + modstr +optstr);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + content2 + modstr +optstr + parstr + modstr +optstr);
    });

    it('embed with require', function(){
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.css'),
            content1 = 'I am embed.js;'+compile.lang.jsEmbed.ld+'./embed.css'+compile.lang.jsEmbed.rd,
            content2 = 'I am embed.css;'+compile.lang.require.ld+'ext/lint/lint.js'+compile.lang.require.rd;
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + '\"I am embed.css;ext/lint/lint.js--compile--\"' + added);
        expect(compile(f1).requires).to.deep.equal(['ext/lint/lint.js']);
        // //from cache
        // c = compile(f1).getContent();
        // expect(c).to.equal('I am embed.js;' + '\"I am embed.css;ext/lint/lint.js--compile--\"' + added);
        // expect(compile(f1).requires).to.deep.equal(['ext/lint/lint.js']);
    });
    it('embed with and without isJsLike',function(){  
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.css'),
            f3 = _(__dirname, 'file/embed.html'),
            f4 = _(__dirname, 'file/embed.txt');
        var content1 = 'I am embed.js;'+compile.lang.jsEmbed.ld+'./embed.css'+compile.lang.jsEmbed.rd+compile.lang.jsEmbed.ld+'./embed.html'+compile.lang.jsEmbed.rd+compile.lang.jsEmbed.ld+'./embed.txt'+compile.lang.jsEmbed.rd,
            content2 = 'I am embed.css;',
            content3 = '<head>test</head>',
            content4 = 'I am embed.txt;';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        _.write(f4, content4);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + '\"I am embed.css;--compile--\"\"<head>test</head>\"\"I am embed.txt;\"' + added);
        expect(compile(f1).requires).to.deep.equal([]);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + '\"I am embed.css;--compile--\"\"<head>test</head>\"\"I am embed.txt;\"' + added);
        expect(compile(f1).requires).to.deep.equal([]);

        //////isJsLike=true, embed not as txt
        compile.clean();
        config.set('roadmap', {
            path : [
                    {
                        "reg" : /^\/(.*)/,
                        "isJsLike" : true
                    }
                ]
        });
         _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        _.write(f4, content4);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        tempfiles.push(f4);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + 'I am embed.css;--compile--<head>test</head>I am embed.txt;' + added);
        expect(compile(f1).requires).to.deep.equal([]);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + 'I am embed.css;--compile--<head>test</head>I am embed.txt;' + added);
        expect(compile(f1).requires).to.deep.equal([]);
    });

    it('setting instead of defaultOptions', function(){
        compile.clean();
        config.set('settings', {
            parser : {
                'options':{
                    PARAtest : '_TEST'
                }
            }
        });
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed.css'),
            content1 = 'I am embed.js;'+compile.lang.jsEmbed.ld+'./embed.css'+compile.lang.jsEmbed.rd,
            content2 = 'I am embed.css;'+compile.lang.require.ld+'ext/lint/lint.js'+compile.lang.require.rd;
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + '\"I am embed.css;ext/lint/lint.js_TEST\"' + added);
        expect(compile(f1).requires).to.deep.equal(['ext/lint/lint.js']);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;' + '\"I am embed.css;ext/lint/lint.js_TEST\"' + added);
        expect(compile(f1).requires).to.deep.equal(['ext/lint/lint.js']);

        var processor = config.require("test");
        expect(processor.data.settings).to.equal(config.get('settings'));
    });

    it('embed img', function(){
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, 'file/embed/embed.txt'),
            content1 = 'I am embed.js;'+compile.lang.embed.ld+'./embed/embed.gif'+compile.lang.embed.rd,
            content2 = fs.readFileSync(f2, "utf-8");
        _.write(f1, content1);
        // tempfiles.push(f1);
        var c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;data:image/gif;base64,'+ content2 + added);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('I am embed.js;data:image/gif;base64,' + content2 + added);


        //check useStandard
        compile.clean();
        config.set('roadmap.path', [
            {
                reg : '**.js',
                useStandard : false
            }
        ]);
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        c = compile(f1).getContent();
        expect(c).to.equal(content1+added);
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal(content1+added);
    });

    it('require', function () {
        var f1 = _(__dirname, 'file/require.js'),
            content1 = 'I '+compile.lang.require.ld+'ext/lint/lint.js'+compile.lang.require.rd+'am re'+compile.lang.require.ld+'ext/modular/js.js'+compile.lang.require.rd+'quire.js;'+compile.lang.require.ld+'ext/lint/lint.js'+compile.lang.require.rd+'.';
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
            '*.js' : 'http://js.baidu.com/',
            '*.coffee' : 'http://coffee.baidu.com/',
            '*' : 'http://www.baidu.com/'
        });
        var f1 = _(__dirname, 'file/uri.js'),
            f2 = _(__dirname, 'file/curi.coffee'),
            f3 = _(__dirname, 'file/uri.php'),
            content1 = compile.lang.uri.ld+'curi.coffee?i=2'+compile.lang.uri.rd+'I am uri.js;'+compile.lang.uri.ld+'./curi.coffee?i=1'+compile.lang.uri.rd+'.'+compile.lang.uri.ld+'./uri.php?i=4'+compile.lang.uri.rd+'.',
            content2 = 'I am uri.coffee;',
            content3 = 'I am uri.php;';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        f2 = file(f2);
        var c = compile(f1).getContent();
        var hash = _.md5('I am uri.coffee;--module--');
        //保留‘/’，因为可能出现他们就是想要多一个斜杠的情况
        expect(c).to.equal('http://coffee.baidu.com//static/curi_'+hash+'.js?i=2I am uri.js;http://coffee.baidu.com//static/curi_'+hash+'.js?i=1./static/uri.php?i=4.'+parstr +modstr);
        //debug
        compile.setup({
            unique:true,
            debug: true,
            optimize: false,
            hash: true,
            lint: false,
            domain: true
        });
        //from cache
        c = compile(f1).getContent();
        expect(c).to.equal('http://coffee.baidu.com//static/curi_'+hash+'.js?i=2I am uri.js;http://coffee.baidu.com//static/curi_ca11557.js?i=1./static/uri.php?i=4.'+parstr +modstr );
    });
    it('dep', function(){
        var f1 = _(__dirname, 'file/dep.js'),
            f2 = _(__dirname, 'file/dep.coffee'),
            content1 = 'I am uri.js;'+compile.lang.dep.ld+'dep.coffee'+compile.lang.dep.rd+'.',
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


    /**
     * 三种语言能力，require、uri、embed
     */

    it('inline--js',function(){
        //清空前面的config参数
        config.init();
        fis.project.setProjectRoot(__dirname);
        var f1 = _(__dirname, 'file/embed.js'),
            f2 = _(__dirname, '/e.js'),
            f3 = _(__dirname, 'file/embed/e2.js'),
            content1 = 'var str = \'\';__inline("../e.js")',
            content2 = 'var f = "__inline( \'file/css/test.js\' )";\n\n__inline(\'file/embed/e2.js\');var f = "__inline(\'file/css/test.js\')"',
            content3 = 'var a = "__inline(\'c.js\')"';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);

        f1 = compile(f1);
        var c = f1.getContent();
        expect(c).to.equal('var str = \'\';var f = "__inline( \'file/css/test.js\' )";\n\nvar a = "__inline(\'c.js\')";var f = "__inline(\'file/css/test.js\')"');
        f2 = compile(f2);
        c = f2.getContent();
        expect(c).to.equal('var f = "__inline( \'file/css/test.js\' )";\n\nvar a = "__inline(\'c.js\')";var f = "__inline(\'file/css/test.js\')"');
    });


    /**
     * html中\<script\>标签正则匹配是否成功
    *以标签内是否能inline成功为指导，后面三个例子对应三种情况
     */
    it('html-\<script\>-no space',function(){
        //标签<script></script>
        config.init();
        var f1 = _(__dirname, 'file/embeded1.html'),
            f2 = _(__dirname, 'file/e1.js'),
            content1 = '<script>__inline(\'./e1.js\')</script>',
            content2 = 'js_inline_test';
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);

        f1 = file(f1);
        compile(f1);
        var c = f1.getContent();

        expect(c).to.equal('<script>js_inline_test</script>');
    });

    it('\html-\<script \>-with a space',function(){
        //标签<script ></script>
        config.init();
        var f1 = _(__dirname, 'file/embeded2.html'),
            f2 = _(__dirname, 'file/e2.js'),
            content1 = '<script >__inline(\'./e2.js\')</script>',
            content2 = 'js_inline_test';
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);


        f1 = file(f1);
        compile(f1);
        var c = f1.getContent();
        expect(c).to.equal('<script >js_inline_test</script>');
    });

    it('\html-\<script ***\>-space and nonspace',function(){
        //标签<script ****></script>
        config.init();
        var f1 = _(__dirname, 'file/embeded3.html'),
            f2 = _(__dirname, 'file/e3.js'),
            content1 = '<script type="text/javascript">__inline(\'./e3.js\')</script>',
            content2 = 'js_inline_test';
        _.write(f1, content1);
        _.write(f2, content2);
        tempfiles.push(f1);
        tempfiles.push(f2);


        f1 = file(f1);
        compile(f1);
        var c = f1.getContent();
        expect(c).to.equal('<script type="text/javascript">js_inline_test</script>');
    });


    it('uri--js',function(){
        //清空前面的config参数
        config.init();
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);
        var f1 = compile(root+'js/uri.js');
        var c = compile(f1).getContent();
        //包括注释和正常的uri，字符串中的uri，跨行的uri
        expect(c.replace(/\r/g,'')).to.equal("'/js/inline_7725901.js';\"/js/inline_7725901.js\";\n\"/js/inline_7725901.js\";'/js/inline_7725901.js';\n//__uri(\"./inline.js\");\n/*\n* __uri(\"./inline.js\");\n* */\"/js/inline_7725901.js\";\nvar a = '__uri(\"./inline.js\")';\n'/js/inline_7725901.js';");

    });

    it('inline,uri--css',function(){
        //清空前面的config参数
        config.init();
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);

        var f1 = compile(root+'css/main.css');
        var content = f1.getContent();
        var expectstr = file.wrap(root+'css/expect.css').getContent();
        expect(content).to.equal(expectstr);

        //注释里的不做处理
        f1 = _(root+'css/m.css');
        var f2 = _(root+'css/in1.css'),
            f3 = _(root+'css/in2.css'),
            content1 = '/* @import url(./in1.css);*/\nimport url( "./in2.css" )\n/*@import url(./in2.css)*/@import url( "./in2.css?__inline" )',
            content2 = '.in1{\nbackground:red\n}',
            content3 = '.in2{\n background:blue\n}';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        f1 = compile(f1);
        expect(f1.getContent()).to.equal('/* @import url(./in1.css);*/\nimport url("/css/in2_6e693ea.css")\n/*@import url(./in2.css)*/.in2{\n background:blue\n}');

    });

    //比上面那个case多考虑了一些路径的问题
    it('inline--css',function(){
        //清空前面的config参数
        config.init();
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);
        var f1 = root+'css/c.css',
            content1 = '@import url(./inline.css?__inline);@import url(../css/inline.css?__inline);@import url(../css/inline.css?__inline)@import url(\'./inline.css?__inline\');@import url("./inline.css?__inline");';
        _.write(f1, content1);
        tempfiles.push(f1);

        f1 = compile(f1);
        var c = f1.getContent();
        expect(c).to.equal('.test{\r\n   background: red;\r\n}.test{\r\n   background: red;\r\n}.test{\r\n   background: red;\r\n}.test{\r\n   background: red;\r\n}.test{\r\n   background: red;\r\n}')
    });

    it('inline,uri--html',function(){
        //清空前面的config参数
        config.init();
        fis.config.set('roadmap.path', [
            {
                reg : '**.png',
                hash : '#abc',
                query : '?a=123'
            }
        ]);
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);

        var f1 = compile(root+'html/main.html');
        var content = f1.getContent();
        var expectstr = file.wrap(root+'html/expect.html').getContent();
        expect(content).to.equal(expectstr);
        var count1 = 0;
        var count2 = 0;
        for(var key in f1.cache.deps){
            if(key == _(root+'js/inline.js')||key == _(root+'js/main.js')||key == _(root+'css/inline.css')||key == _(root+'css/test.bmp')||key ==  _(root+'css/main.css')||key == _(root+'html/main.html')||key == _(root+'html/inline.html')||key == _(root+'html/inline2.html')){
                count1++;
            }
            count2++;
        }
        expect(count1).to.equal(7);
        expect(count2).to.equal(9);
    });

    it('uri with hash',function(){
        //清空前面的config参数
        config.init();
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);
        var f1 = _(root+'test1.html'),
            f2 = _(root+'test2.html'),
            f3 = _(root+'test3.html'),
            content1 = '\<img src=\"a.png?q=456#h=123\"\>',
            content2 = '\<img src=\"a.png#h=456\"\>',
            content3 = '\<img src=\"a.png?q=456\"\>';
        _.write(f1, content1);
        _.write(f2, content2);
        _.write(f3, content3);
        tempfiles.push(f1);
        tempfiles.push(f2);
        tempfiles.push(f3);
        f1 = compile(f1);
        f2 = compile(f2);
        f3 = compile(f3);

        expect(f1.getContent()).to.equal('\<img src=\"a.png?q=456#h=123\"\>');
        expect(f2.getContent()).to.equal('\<img src=\"a.png#h=456\"\>');
        expect(f3.getContent()).to.equal('\<img src=\"a.png?q=456\"\>');
    });

    it('uri with hash-config',function(){
        //清空前面的config参数
        config.init();
        fis.config.set('roadmap.path', [
            {
                reg : '**.png',
                hash : '#abc',
                query : '?a=123'
            }
        ]);
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);
        var f1 = compile(root+'html/main.html');
//        f1= compile(f1);

        var expectstr = file.wrap(root+'html/expect.html').getContent();
        expect(f1.getContent()).to.equal(expectstr);
    });
    
    //html嵌入css的通用属性检查
    it('inline--html,通用属性--css',function(){
        //清空前面的config参数
        config.init();
        fis.config.set('roadmap.path', [
            {
                reg : '**.js',
                query : '?a=t'
            }
        ]);
        var root=__dirname+'/compile/';
        fis.project.setProjectRoot(root);
        var f1 = compile(root+'html/main.html');
        var content = f1.getContent();
        var expectstr = file.wrap(root+'html/expect_query.html').getContent();
        expect(content).to.equal(expectstr);
    });

    it('require--js',function(){
        //清空前面的config参数
        config.init();
        fis.config.set('roadmap.path', [
            {
                reg : '**.js',
                query : '?a=t'
            }
        ]);
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);

        var f1 = compile(root+'js/require.js');
        var content = f1.getContent();
        var expectstr = file.wrap(root+'js/expect_require.js').getContent();
        expect(content).to.equal(expectstr);
        expect(f1.requires).to.deep.equal([ 'js/main.js']);
    });
    it('require--css',function(){
        //清空前面的config参数
        config.init();
        fis.config.set('roadmap.path', [
            {
                reg : '**.js',
                query : '?a=t'
            }
        ]);
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);

        var f1 = compile(root+'css/require.css');
        var content = f1.getContent();
        var expectstr = file.wrap(root+'css/expect_require.css').getContent();
        expect(content).to.equal(expectstr);

        expect(f1.requires).to.deep.equal([ 'css/main.css']);

    });
    it('require--html',function(){
        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);

        var f1 = compile(root+'html/require.html');
        var content = f1.getContent();
        var expectstr = file.wrap(root+'html/expect_require.html').getContent();
        expect(content.replace('\r','')).to.equal(expectstr.replace('\r',''));

        expect(f1.requires).to.deep.equal([ 'js/main.js', 'css/main.css', './main.css' ]);

        //tpl、asp等后缀的文件也会被当做页面来处理
        f1 = compile(root+'html/require.tpl');
        content = f1.getContent();
        expect(content.replace(/[\r\n]/g,'')).to.equal(expectstr.replace(/[\r\n]/g,''));
        expect(f1.requires).to.deep.equal([ 'js/main.js', 'css/main.css', './main.css' ]);
    });

    it('modules-逗号隔开',function(){
        config.set('modules', {
            parser : {
                js : 'parser'
            },
            preprocessor : {
                js : 'modular,modular1'
            },
            lint :{
                js :'lint'
            },
            optimizer :{
                js :'optimizer'
            }
        });
        _.copy(root+'/fis-modular-modular',root+'/../../../node_modules/fis-preprocessor-modular1');
        tempfiles.push(root+'/../../../node_modules/fis-preprocessor-modular1');
        added = parstr+modstr+modstr+optstr;

        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);

        var cache = fis.cache(f);

        f = file(f);
        f.isMod = true;
        var c = compile(f).getContent();
        expect(c).to.equal(content + added);
        //from cache
        c = compile(f).getContent();
        expect(c).to.equal(content + added);
        tempfiles.push(f);

    });

    it('modules-数组且数组中有function',function(){
        config.set('modules', {
            parser : {
                js : 'parser'
            },
            preprocessor : {
                //require返回一个function
                js : ['modular','modular1',require('fis-preprocessor-modular')]
            },
            optimizer :{
                js :'optimizer'
            }
        });
        _.copy(root+'/fis-modular-modular',root+'/../../../node_modules/fis-preprocessor-modular1');
        tempfiles.push(root+'/../../../node_modules/fis-preprocessor-modular1');
        added = parstr+modstr+modstr+modstr+optstr;

        var f = _(__dirname, 'file/general.js'),
            content = 'var abc = 123;';
        _.write(f, content);
        _.touch(f,12344);
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

    it('clean(name)', function(){
        fis.util.mkdir(root+'/target/cache/compile/tmp');
        expect(fis.util.exists(root+'/target/cache/compile/tmp')).to.be.true;
        compile.clean('tmp');
        expect(fis.util.exists(root+'/target/cache/compile/tmp')).to.be.false;
        expect(fis.util.exists(root+'/target/cache/compile')).to.be.true;
        fis.cache.clean(root+'/target');
    });

    it('optimize uglify-js',function(){
        config.init();
        config.set('modules', {
            optimizer :{
                js :'uglify-js'
            }
        });
        config.set('settings.optimizer.uglify-js.compress.sequences', false);
        // _.copy(root+'/fis-modular-modular',root+'/../../../node_modules/fis-preprocessor-modular1');
        // tempfiles.push(root+'/../../../node_modules/fis-preprocessor-modular1');
        added = parstr+modstr+modstr+modstr+optstr;

        var root = __dirname+'/compile/';
        fis.project.setProjectRoot(root);
        var f1 = _(root+'a.js'),
            content1 = '(function(){var a = 1;var c = 7;var i = 0;if(a < 0){i = -7;}for (var zz = 0; i < c; i++) {alert(i);}})();';
        _.write(f1, content1);
        tempfiles.push(f1);
        f1 = compile(f1);
        expect(f1.getContent()).to.equal('!function(){var r=1,a=7,f=0;0>r&&(f=-7);for(;a>f;f++)alert(f)}();');
    });
  
    it('image srcset support', function () {
    });
});
