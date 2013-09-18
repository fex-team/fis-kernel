var fs = require('fs');

var fis = require('../../fis-kernel.js');
var project = fis.project;

var expect = require('chai').expect;

describe('project',function(){
    it('getTempPath', function(){
        var tmp = process.env['LOCALAPPDATA'];
        tmp = tmp.replace(/\\/g, '/');
        expect(project.getTempPath()).to.be.equal(tmp+'/.fis-tmp');
    });
});