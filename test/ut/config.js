/**
 * Created with JetBrains WebStorm.
 * User: tanwenmin
 * Date: 13-0-18
 * Time: 13:25
 * To change this template use File | Settings | File Templates.
 */
var fs = require('fs'),
    path = require('path');
var fis = require('../../fis-kernel.js');
var  _ = fis.file,
    config = fis.config;
var expect = require('chai').expect;
var u = fis.util;

describe('config',function(){
    beforeEach(function(){
        fis.project.setProjectRoot(__dirname);
        config.init();
    });

    it('set',function(){
        config.set('roadmap', {
            path : [{
                    "reg" : /^\/(.*)/,
                    "release" : "static/$1"
                }]
        });
        fis.config.set('roadmap.domain','www.baidu.com');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('www.baidu.com/static/file/ext/modular/js.js?__inline');
        //without domain
        fis.config.del('roadmap.domain');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/static/file/ext/modular/js.js?__inline');
        //without path
        fis.config.del('roadmap.path');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/file/ext/modular/js.js?__inline');
        //no change
        fis.config.del();
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/file/ext/modular/js.js?__inline');
    });

    it('del',function(){
        //without domain
        fis.config.del('roadmap.domain');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/file/ext/modular/js.js?__inline');

        //without path
        fis.config.del('roadmap.path');
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/file/ext/modular/js.js?__inline');
    });

    it('del null', function(){
        fis.config.del();
        path = __dirname+'/file/ext/modular/js.js?__inline';
        var f = _.wrap(path);
        var url = f.getUrl(false,true);
        expect(url).to.equal('/file/ext/modular/js.js?__inline');

        fis.config.del('roadmap');
        fis.config.del('system');
        fis.config.del('project');
        fis.config.set();
        expect(fis.config.get()).to.deep.equal({});
    });
});
