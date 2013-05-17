/*
 * auth:jiangshuguang
 *  问题1：fis.util.escapeReg没有case
 *
 * */

var fs = require('fs'),
    path = require('path'),
    ROOT = path.join(__dirname, '../..')
        .replace(/\\/g, '/')
        .replace(/\/$/, ''),
    _path = __dirname
        .replace(/\\/g, '/')
        .replace(/\/$/, '');

var fis = require('../../fis-kernel.js');
var  uri = fis.uri,
    config = fis.config,
    project = fis.project;

var expect = require('chai').expect;


    describe('uri()', function () {
        it('relative path "/"', function () {
            project.setProjectRoot("E:\\fis\\fis2\\fis-kernel\\test\\ut");
            expect(uri("uri/file/a.js?a=a","/common")["origin"]).to.equal("uri/file/a.js?a=a");
            expect(uri("uri/file/a.js?a=a","/common")["query"]).to.equal("?a=a");
            expect(uri("uri/file/a.js?a=a","/common")["file"]["fullname"]).to.equal("/common/uri/file/a.js");
        });

        it("absolute path",function(){

            project.setProjectRoot(_path);
            var expectResult =
            {   origin: '/uri/file/a.js?a=a',
                rest: '/uri/file/a.js',
                quote: '',
                query: '?a=a',
                file:
                { origin: 'E:/fis/fis2/fis-kernel/test/ut/uri/file/a.js',
                    rest: 'E:/fis/fis2/fis-kernel/test/ut/uri/file/a',
                    query: '',
                    fullname: 'E:/fis/fis2/fis-kernel/test/ut/uri/file/a.js',
                    dirname: 'E:/fis/fis2/fis-kernel/test/ut/uri/file',
                    ext: '.js',
                    filename: 'a',
                    basename: 'a.js',
                    rExt: '.js',
                    realpath: 'E:/fis/fis2/fis-kernel/test/ut/uri/file/a.js',
                    realpathNoExt: 'E:/fis/fis2/fis-kernel/test/ut/uri/file/a',
                    useHash: true,
                    useDomain: true,
                    isMod: false,
                    requires: [],
                    subpath: '/uri/file/a.js',
                    subdirname: '/uri/file',
                    subpathNoExt: '/uri/file/a',
                    release: '/uri/file/a.js',
                    url: '/uri/file/a.js',
                    domain: '',
                    id: 'uri/file/a.js' }
            };
            expect(uri("/uri/file/a.js?a=a")["query"]).to.equal("?a=a");
            expect(uri("/uri/file/a.js?a=a")["rest"]).to.equal("/uri/file/a.js");
            expect(uri("/uri/file/a.js?a=a")["file"]["realpath"]).to.equal(_path+"/uri/file/a.js");

        });
    });

    describe('getId()', function () {
        it('relative path "/"', function (){
            project.setProjectRoot("E:\\fis\\fis2\\fis-kernel\\test\\ut");
            expect(uri("uri/file/a.js?a=a","/common")["origin"]).to.equal("uri/file/a.js?a=a");
            expect(uri("uri/file/a.js?a=a","/common")["query"]).to.equal("?a=a");
            expect(uri("uri/file/a.js?a=a","/common")["file"]["fullname"]).to.equal("/common/uri/file/a.js");
        });

    });

   /*
   *  将变量${var}替换成 config中的值
   * */
    describe('replaceDefine()', function () {
        it('${var} replace config value', function (){
            fis.config.set('123', '<{11');
            fis.config.set('var', 'var_var');
            expect(uri.replaceDefine("hh${123}hh",true)).to.equal("hh\\<\\{11hh");
            expect(uri.replaceDefine("hh${123}hh",false)).to.equal("hh<{11hh");
            expect(uri.replaceDefine("hh{123}hh",false)).to.equal("hh{123}hh");
            expect(uri.replaceDefine("hh${var}hh",false)).to.equal("hhvar_varhh");
            expect(uri.replaceDefine("hh${var}hh",true)).to.equal("hhvar_varhh");
        });
    });

    /*
    * $& 或者 $\d替换成matches的键值
    * */
    describe('replaceMatches()', function () {
        it('relative path "/"', function (){
            var source = "$&hh$11hh",
                matches = {
                    "&":"test1",
                    "11":"test2"
                };
            expect(uri.replaceMatches(source,matches)).to.equal("$&hhtest2hh");
            source = "$11hh$22hh";
            matches = {
                "11":"test1",
                "22":"test2"
            };
            expect(uri.replaceMatches(source,matches)).to.equal("test1hhtest2hh");
            source = "$&hh$22hh";
            matches = ["test1"];
            expect(uri.replaceMatches(source,matches)).to.equal("test1hh$22hh");
        });
    });

      /*
       * 数组和对象的属性值递归替换
       *
       * */
    describe('replaceProperties()', function () {
        it('replaceProperties', function (){
            fis.config.set('123', '<{11');
            var source, matches, expectResult;
            source = "hh$&hh${123}hh";
            matches = [
                "test1"
            ];
            expect(uri.replaceProperties(source,matches)).to.equal("hhtest1hh<{11hh");
            source = "hh$&hh${123}hh";
            matches = [
                "test1"
            ];
            fis.config.set('123', '$&');
            expect(uri.replaceProperties(source,matches)).to.equal("hhtest1hhtest1hh");

            fis.config.set('123', '<{11');
            source = [
                "hh$&hh${123}hh",
                "aa$aa"
            ];
            matches = [
                "test1"
            ];
            expectResult = [
                "hhtest1hh<{11hh",
                "aa$aa"
            ];
            expect(uri.replaceProperties(source,matches)).to.deep.equal(expectResult);

            source = {
                aa:"hh$&hh${123}hh",
                bb:"aa$aa"
            };
            matches = [
                "test1"
            ];
            expectResult = {
                aa:"hhtest1hh<{11hh",
                bb:"aa$aa"
            };
            expect(uri.replaceProperties(source,matches)).to.deep.equal(expectResult);

            source = {
                aa:"hh$&hh${123}hh",
                bb:{
                    aa:"hh$&hh${123}hh",
                    bb:"aa$aa"
                }
            };
            matches = [
                "test1"
            ];
            expectResult = {
                aa:"hhtest1hh<{11hh",
                bb:{
                    aa:"hhtest1hh<{11hh",
                    bb:"aa$aa"
                }
            };
            expect(uri.replaceProperties(source,matches)).to.deep.equal(expectResult);
        });
    });


    describe('roadmap()', function () {
        it('relative path "/"', function (){
            var subpath,pth,obj={};
            subpath = "./demo/index1.tpl";
            pth = "demo";

            var regExp = new RegExp(".*index3.*","i");//必须要这样来定义正则，/.*index3.*/这样不行？
            fis.config.set('var2', 'index2');
            fis.config.set('roadmap.demo',[
                {
                    reg:"index1.*",
                    page:"index1.tpl"
                },
                {
                    reg:"${var2}",
                    page:"index2.tpl"
                },
                {
                    reg:regExp,
                    page:"index3.tpl"
                }
            ]);
            expect(uri.roadmap(subpath,pth,obj)).to.deep.equal({page:"index1.tpl"});
            /*
             * 正则中使用定义的变量
             * */
            subpath = "./demo/index2.tpl";
            expect(uri.roadmap(subpath,pth,obj)).to.deep.equal({page:"index2.tpl"});
            /*
             * 显示使用正则
             * */
            subpath = "./demo/index3.tpl";
            expect(uri.roadmap(subpath,pth,obj)).to.deep.equal({page:"index3.tpl"});
         });
    });