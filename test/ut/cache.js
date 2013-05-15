/**
 * Created with JetBrains WebStorm.
 * User: shenlixia01
 * Date: 13-5-14
 * Time: 上午11:22
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs'),
    path = require('path');
var fis = require('../../fis-kernel.js');
var project = fis.project;
project.setProjectRoot(__dirname);
var  _ = fis.cache,
    config = fis.config;
var expect = require('chai').expect;
var cachedir = new _(fis.util(__dirname)+'/cache');

describe('save(content, info)',function(){
    it('general',function(){

    });
    it('typeof content is buffer',function(){

    });


});

describe('revert(file)',function(){

});


describe('addDeps(file)',function(){

});

describe('removeDeps(file)',function(){

});

describe('mergeDeps(cache)',function(){

});

describe('clean(name)',function(){

});