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
    afterEach(function(){
        config.init();
        fis.compile.clean();
    });

    /*
    * 结果打包
    * */
    it('pack = true & map &domain',function(done){
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
                filess.push(file);
            },
            pack:true,
            domain:true
        },files=[],expectFiles,filess=[];
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
        project.setProjectRoot(_testPath+"/test1");
        var conf = _testPath+"/test1/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);

        release(opt,function(ret){
            /*
             *打包的文件存在
             * */
              expect("/aio.js" in ret.pkg,'aio pkg').to.true;
             //包的内容正确
             expect(ret.map.pkg['photo:p0'].has).to.deep.equal([ 'photo:widget/comp/comp.js', 'photo:widget/list/list.js' ]);
             //依赖正确
             expect(ret.map.pkg['photo:p0'].deps).to.deep.equal(['photo:widget/list/list.css']);

             for(var i = 0; i< filess.length;i++){
                 var file = filess[i];
                if(file.ext == ".js"){
                    expect(file.domain).to.equal("http://img.baidu.com");
                }else if(file.ext == ".css"){
                    expect(file.domain).to.equal("http://css.baidu.com");
                }
            }

             /*
              * 普通文件 打包文件 map文件内容测试             * */
            var content = ret.pkg["/photo-map.json"]._content;
            content = content.replace(/[\r\n\t\s]*/g,'');

             fs.readFile(_testPath+"/expect1/photo-map.json","utf-8",function(err,data){
                expect(content).to.equal(data);
//                expect(files).to.deep.equal(expectFiles);
                done();
            });

        });
    });

    it('useMap false',function(done){
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
                filess.push(file);
            },
            pack:true,
            domain:true
        },
            files=[],expectFiles,filess=[];
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
        project.setProjectRoot(_testPath+"/test1");
        var conf = _testPath+"/test1/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        fis.config.set('roadmap.path',[
            {
                reg : "*.css",
                useMap : false
            }
        ]);
        release(opt,function(ret){
            expect(ret.map.res['index.js'].deps).to.be.undefined;
            done();
        });
    });

    it('domain——true',function(done){
        project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            afterEach:function(file){
                files.push(file.origin);
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
            for(var i = 0; i<files.length;i++){
                var file = files[i];
                if(file.ext == ".js"){
                    expect(file.domain).to.equal("http://img.baidu.com");
                }else if(file.ext == ".css"){
                    expect(file.domain).to.equal("http://css.baidu.com");
                }
            }
            done();
        });

    });
    it('domain——false',function(done){
        project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var opt = {
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
            done();
        });
    });


   /*
    * 依赖测试
    * */
    it('deps',function(done){
        project.setProjectRoot(_testPath+"/test4");
        var conf = _testPath+"/test4/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var files = [];
        var opt = {
            pack:true
        };
        release(opt,function(ret){
            /*
             *  依赖检测，不但包括文件中require的内容，还包括同名的css文件
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
            done();
        });
    });

    it('opt——md5',function(done){
        project.setProjectRoot(_testPath+"/test5");
        var conf = _testPath+"/test5/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var opt = {
            md5:true
        };
        release(opt,function(ret){
            expect(ret.src["/index.css"]._md5).to.equal(fis.util.md5(ret.src["/index.css"]._content,7));
            expect(ret.src["/index.js"]._md5).to.equal(fis.util.md5(ret.src["/index.js"]._content,7));
            expect(ret.src["/ui/a/a.js"]._md5).to.equal(fis.util.md5(ret.src["/ui/a/a.js"]._content,7));
            expect(ret.src["/widget/list/list.js"]._md5).to.equal(fis.util.md5(ret.src["/widget/list/list.js"]._content,7));

            done();
        });
    });
    it('opt——md5关闭',function(done){

        project.setProjectRoot(_testPath+"/test5");
        var conf = _testPath+"/test5/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        //关闭md5
        var opt = {
            md5:false
        };
        release(opt,function(ret){
            expect("_md5" in ret.src["/index.css"]).to.equal(false);
            expect("_md5" in ret.src["/index.js"]).to.equal(false);
            expect("_md5" in ret.src["/ui/a/a.js"]).to.equal(false);
            expect("_md5" in ret.src["/widget/list/list.js"]).to.equal(false);
            done();
        });
    });

    it('beforeEach & afterEach',function(done){
        fis.project.setProjectRoot(_testPath+"/test6");
        var conf = _testPath+"/test6/fis-conf.js";
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
        release(opt,function(){
            done();
        });
        expect(beforeFiles).to.deep.equal(afterFiles);
    });


    it('prepackager & postpackager',function(done){
        fis.project.setProjectRoot(_testPath+"/test3");
        var conf = _testPath+"/test3/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var opt = {
            prepackager:function(ret){
                expect(ret.pkg).to.deep.equal({});
            },
            postpackager:function(ret){
                expect("/static/aio1.js" in ret.pkg,'aio1.js').to.be.true;
                expect("/static/aio.js" in ret.pkg,'aio.js').to.be.true;
                done();
            },
            pack:true
        };
        release(opt,function(ret){
              expect(ret.map.pkg["photo:p0"].has,'photo:p0').to.deep.equal([
                  "photo:widget/comp/comp.js",
                  "photo:widget/list/list.js"
              ]);
              expect(ret.map.pkg["photo:p1"].has,'photo:p1').to.deep.equal([
                  "photo:ui/a/a.js",
                  "photo:ui/b/b.js"
              ]);
        });
    });


    it("打包支持正则",function(done){
        fis.project.setProjectRoot(_testPath+"/test7");
        var conf = _testPath+"/test7/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var opt = {
            pack:true
        };

        release(opt,function(ret){
            expect(ret.map.pkg["photo:p1"].has).to.deep.equal([
                "photo:ui/b/b.js",
                "photo:ui/a/a.js"
            ]);
            expect(ret.map.pkg["photo:p2"].has).to.deep.equal([
                "photo:js/a/a.js",
                "photo:js/b/b.js"
            ]);
            done();
        });

    });

    //需要添加，bug未修
    it("打包文件 打包",function(done){
        fis.project.setProjectRoot(_testPath+"/test8");
        var conf = _testPath+"/test8/fis-conf.js";
        fis.config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        var opt = {
            pack:true
        };

        release(opt,function(ret){
            expect(ret.map.pkg["photo:p0"].has).to.deep.equal([
                "photo:widget/comp/comp.js",
                "photo:widget/list/list.js"
            ]);
            expect(ret.map.pkg["photo:p1"].has).to.deep.equal([
                "photo:ui/b/b.js",
                "photo:ui/a/a.js"
            ]);
            done();
        });

    });

    it('without opt',function(done){
        //opt为空所有打包、domain、md5都不做
        //domain
        project.setProjectRoot(_testPath+"/test2");
        var conf = _testPath+"/test2/fis-conf.js";
        config.merge(fis.util.readJSON(_testPath + '/standard.json'));
        require(conf);
        release(function(ret){
            for(var file in ret.map.res){
                if(ret.map.res[file].type == "css"){
                    expect(/^http:\/\/css\.baidu\.com/.test(ret.map.res[file].uri)).to.equal(false);
                }else if(ret.map.res[file].type == "js"){
                    expect(/^http:\/\/img\.baidu\.com/.test(ret.map.res[file].uri)).to.equal(false);
                }
            }
            done();
        });
    });
});