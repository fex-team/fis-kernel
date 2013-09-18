var fs = require('fs'),
    fis = require('../../fis-kernel.js');

var project = fis.project;
var expect = require('chai').expect;

describe('project',function(){
    it('getTempPath', function(){
        var list = ['LOCALAPPDATA', 'APPDATA', 'HOME'];
        var tmp;
        for(var i = 0, len = list.length; i < len; i++){
            if(tmp = process.env[list[i]]){
                break;
            }
        }
        tmp = tmp.replace(/\\/g, '/');
        expect(project.getTempPath()).to.be.equal(tmp+'/.fis-tmp');
    });
});