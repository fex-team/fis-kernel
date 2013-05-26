var fs = require('fs'),
    path = require('path'),
    _path = __dirname
        .replace(/\\/g, '/')
        .replace(/\/$/, ''),
    _testPath = _path+"/release";

var fis = require('../../fis-kernel.js');
var release = fis.release,
    config = fis.config,
    project = fis.project;

var expect = require('chai').expect;

describe('release',function(){
    before(function(){
        config.init();
    });

    /*
    * 结果打包
    * */
    it('pack = true & map &domain',function(done){
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
                if(file.ext == ".js"){
                    expect(file.domain).to.equal("http://img.baidu.com");
                }else if(file.ext == ".css"){
                    expect(file.domain).to.equal("http://css.baidu.com");
                }
            },
            pack:true
        },files=[],expectFiles;
        expectFiles =
            [ _testPath+'/test1/index.css',
                _testPath+'/test1/index.js',
                _testPath+'/test1/index.tpl',
                _testPath+'/test1/npm.png',
                _testPath+'/test1/plugin/FISResource.class.php',
                _testPath+'/test1/plugin/compiler.body.php',
                _testPath+'/test1/plugin/compiler.head.php',
                _testPath+'/test1/plugin/compiler.html.php',
                _testPath+'/test1/plugin/compiler.require.php',
                _testPath+'/test1/plugin/compiler.script.php',
                _testPath+'/test1/plugin/compiler.widget.php',
                _testPath+'/test1/sea.js',
                _testPath+'/test1/widget/comp/comp.js',
                _testPath+'/test1/widget/list/list.css',
                _testPath+'/test1/widget/list/list.js',
                _testPath+'/test1/widget/list/list.tpl' ];
        fis.project.setProjectRoot(_testPath+"/test1");
        var conf = _testPath+"/test1/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);

        release(opt,function(ret){
            /*
             *打包的文件存在
             * */
             expect(ret.pkg["__p0__.js"].url).to.equal("/static/aio.js");
             //包的内容正确
             expect(ret.map.pkg.p0.has).to.deep.equal([ 'photo:widget/comp/comp.js', 'photo:widget/list/list.js' ]);
             //依赖正确
             expect(ret.map.pkg.p0.deps).to.deep.equal(['photo:widget/list/list.css']);

             /*
              * 普通文件 打包文件 map文件内容测试
              * */

            fs.readFile(_testPath+"/expect1/photo-map.json","utf-8",function(err,data){
                expect(ret.pkg["/photo-map.json"]._content).to.equal(data);
                fs.readFile(_testPath+"/expect1/__p0__.js","utf-8",function(err,data1){
//                    expect(ret.pkg["__p0__.js"]._content).to.equal(data1);
                    expect(files).to.deep.equal(expectFiles);
                    done();
                });
            });

        });
    });

   /*
    * 依赖测试
    * */
    it('deps',function(){
	    fis.config.del("roadmap.path");
        fis.project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
                if(file.ext == ".js"){
                    expect(file.domain).to.equal("http://img.baidu.com");
                }else if(file.ext == ".css"){
                    expect(file.domain).to.equal("http://css.baidu.com");
                }
            },
            pack:true
        };
        release(opt,function(ret){
            /*
             *  依赖检测
             * */

             expect(ret.src["/widget/list/list.js"].requires).to.deep.equal(
                 [  'photo:widget/comp/comp.js',
                    'photo:widget/c/c.js',
                    'photo:widget/e/e.js',
                    'photo:widget/list/list.css' ]);

            expect(ret.src["/widget/c/c.js"].requires).to.deep.equal(
                ['photo:widget/d/d.js']
            );

            expect(ret.src["/index.js"].requires).to.deep.equal(
                ['photo:index.css']
            );

           expect(ret.src["/ui/a/a.js"].requires).to.deep.equal(
                ['photo:ui/b/b.js']
            );
        });
    });


    it(' 参数 md5',function(){
        fis.project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            md5:true
        };

        release(opt,function(ret){
            expect(ret.src["/index.css"]._hash).to.equal(fis.util.md5(ret.src["/index.css"]._content,7));
            expect(ret.src["/index.js"]._hash).to.equal(fis.util.md5(ret.src["/index.js"]._content,7));
            expect(ret.src["/ui/a/a.js"]._hash).to.equal(fis.util.md5(ret.src["/ui/a/a.js"]._content,7));
            expect(ret.src["/widget/list/list.js"]._hash).to.equal(fis.util.md5(ret.src["/widget/list/list.js"]._content,7));
        });

        opt = {
            md5:false
        };

        release(opt,function(ret){
            expect("_hash" in ret.src["/index.css"]).to.equal(false);
            expect("_hash" in ret.src["/index.js"]).to.equal(false);
            expect("_hash" in ret.src["/ui/a/a.js"]).to.equal(false);
            expect("_hash" in ret.src["/widget/list/list.js"]).to.equal(false);
        });
    });


    it('domain = true',function(){
        fis.project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
                if(file.ext == ".js"){
                    expect(file.domain).to.equal("http://img.baidu.com");
                }else if(file.ext == ".css"){
                    expect(file.domain).to.equal("http://css.baidu.com");
                }
            },
            domain:true
        };

        release(opt,function(ret){
            for(var file in ret.map.res){
               if(ret.map.res[file].type == "css"){
                    expect(/^http:\/\/css\.baidu\.com/.test(ret.map.res[file].uri)).to.equal(true);
               }else if(ret.map.res[file].type == "js"){
                   expect(/^http:\/\/img\.baidu\.com/.test(ret.map.res[file].uri)).to.equal(true);
               }
            }
        });
    });

    it('domain = false',function(){
        fis.project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
                if(file.ext == ".js"){
                    expect(file.domain).to.equal("http://img.baidu.com");
                }else if(file.ext == ".css"){
                    expect(file.domain).to.equal("http://css.baidu.com");
                }
            },
            domain:false
        };

        release(opt,function(ret){
            for(var file in ret.map.res){
                if(ret.map.res[file].type == "css"){
                    expect(/^http:\/\/css\.baidu\.com/.test(ret.map.res[file].uri)).to.equal(false);
                }else if(ret.map.res[file].type == "js"){
                    expect(/^http:\/\/img\.baidu\.com/.test(ret.map.res[file].uri)).to.equal(false);
                }
            }
        });
    });


    it('beforeEach & afterEach',function(){
        fis.project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var curFile = "",beforeFiles=[],afterFiles=[];

        var opt = {
            beforeEach:function(file){
                beforeFiles.push(file.origin);
            },
            afterEach:function(file){
                if(file.ext!=".png"){
                    expect("cache" in file).to.equal(true);
                    expect("compiled" in file).to.equal(true);
                    expect("_content" in file).to.equal(true);
                }
                afterFiles.push(file.origin);
            },
            pack:true
        };
        release(opt,function(ret){

        });
        expect(beforeFiles).to.deep.equal(afterFiles);
    });


    it('beforePack & afterPack',function(){
        fis.project.setProjectRoot(_testPath+"/test3");
        var conf = _testPath+"/test3/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            beforePack:function(ret){
                expect(ret.pkg).to.deep.equal({});
            },
            afterPack:function(ret){
                expect("__p0__.js" in ret.pkg).to.equal(true);
                expect("__p1__.js" in ret.pkg).to.equal(true);
            },
            pack:true
        };
        release(opt,function(ret){

        });
    });

});