/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    ROOT = path.join(__dirname, '../..')
        .replace(/\\/g, '/')
        .replace(/\/$/, ''),
    fis = require('../../lib/fis.js'),
    _ = fis.util,
    _require = fis.require,
    config = _.config,
    expect = require('chai').expect;

fis.log.throw = true;

describe('require.resolve(name, dir, protocol)', function(){
    
    
    before(function(){
        _.setProjectRoot(process.cwd());
    });
    
    it('not found', function(){
        expect(_require.resolve('123')).to.be.false;
        expect(_require.resolve('local:123')).to.be.false;
        expect(_require.resolve('npm:123')).to.be.false;
        expect(_require.resolve('fis:123')).to.be.false;
    });
    it('local, fis, npm', function(){
        var dir = 'hello',
            local = _(process.cwd(), 'fis-ext', dir, 'local.js'),
            fis = _.getFISPath('ext/basic', dir, 'fis.js'),
            npm = _(__dirname, '../../node_modules/4test/index.js');
        
        _.write(local, '');
        _.write(fis, '');
        _.write(npm, '');
        
        var name = 'local';
        expect(_require.resolve(name, dir)).to.equal(local);
        expect(_require.resolve('all:' + name, dir)).to.equal(local);
        expect(_require.resolve(name, dir, 'all')).to.equal(local);
        
        expect(_require.resolve('local:' + name, dir)).to.equal(local);
        expect(_require.resolve(name, dir, 'local')).to.equal(local);
        
        expect(_require.resolve('fis:' + name, dir)).to.be.false;
        expect(_require.resolve(name, dir, 'fis')).to.be.false;
        expect(_require.resolve('npm:' + name, dir)).to.be.false;
        expect(_require.resolve(name, dir, 'npm')).to.be.false;
        
        name = 'fis';
        expect(_require.resolve(name, dir)).to.equal(fis);
        expect(_require.resolve('all:' + name, dir)).to.equal(fis);
        expect(_require.resolve(name, dir, 'all')).to.equal(fis);
        
        expect(_require.resolve('fis:' + name, dir)).to.equal(fis);
        expect(_require.resolve(name, dir, 'fis')).to.equal(fis);
        
        expect(_require.resolve('local:' + name, dir)).to.be.false;
        expect(_require.resolve(name, dir, 'local')).to.be.false;
        expect(_require.resolve('npm:' + name, dir)).to.be.false;
        expect(_require.resolve(name, dir, 'npm')).to.be.false;
        
        name = '4test';
        expect(_require.resolve(name, dir)).to.equal(npm);
        expect(_require.resolve('all:' + name, dir)).to.equal(npm);
        expect(_require.resolve(name, dir, 'all')).to.equal(npm);
        
        expect(_require.resolve('npm:' + name, dir)).to.equal(npm);
        expect(_require.resolve(name, dir, 'npm')).to.equal(npm);
        
        expect(_require.resolve('local:' + name, dir)).to.be.false;
        expect(_require.resolve(name, dir, 'local')).to.be.false;
        expect(_require.resolve('fis:' + name, dir)).to.be.false;
        expect(_require.resolve(name, dir, 'fis')).to.be.false;
        
        _.del(_(process.cwd(), 'fis-ext'));
        _.del(_.getFISPath('ext/basic', dir));
        _.del(_(__dirname, '../../node_modules/4test'));
    });
    it('remote', function(){
        var origin = _require.remote,
            url = 'http://localhost:8000/ext/',
            dir = 'test',
            name = 'a';
        _require.remote = url;
        var file = _require.resolve('remote:' + name, dir);
        expect(file).to.match(/\/lib\/ext\/remote\/test\/a-[a-z0-9]{7}\.js$/);
        expect(_.read(file)).to.contain('// - ' + url);
        expect(_require.resolve(name, dir, 'remote')).to.equal(file);
        _require.remote = origin;
        _.del(_.getFISPath('ext', 'remote'));
    });

    it('json', function(){
        var name = 'a.json',
            file = _(process.cwd(), name);
        expect(_require.resolve(name, '..')).to.be.false;
        _.write(file, '{"a":1}');
        expect(_require.resolve(name, '..')).to.equal(file);
        _.del(file);
    });

    it('framework', function(){
        config.set('project.framework', '4test');
        var file  = _.getFISPath('ext/framework/4test/command/config.js'),
            file2 = _.getFISPath('ext/framework/4test/command/clean.js'),
            file3 =_.getFISPath('ext/basic/command/clean.js');
        _.write(file, 'bcd');
        _.write(file2, 'efg');
        expect(_require.resolve('config', 'command')).to.equal(file);
        config.set('project.framework', '');
        expect(_require.resolve('clean', 'command')).to.equal(file3);
        _.del(_.getFISPath('ext/framework/4test'));
    });

    it('framework@version', function(){
        config.set('project.framework', '4test@1.1.1');
        var file  = _.getFISPath('ext/framework/4test/1.1.1/command/config.js'),
            file2 = _.getFISPath('ext/framework/4test/1.1.1/command/clean.js'),
            file3 =_.getFISPath('ext/basic/command/clean.js');
        _.write(file, 'abc');
        _.write(file2, 'abc');
        expect(_require.resolve('config', 'command')).to.equal(file);
        config.set('project.framework', '');
        expect(_require.resolve('clean', 'command')).to.equal(file3);
        _.del(_.getFISPath('ext/framework/4test'));
    });
});