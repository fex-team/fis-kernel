var fs = require('fs'),
    fis = require('../../fis-kernel.js');

var project = fis.project;
var expect = require('chai').expect;

function getPath(root, args){
    if(args && args.length > 0){
        args = root + '/' + Array.prototype.join.call(args, '/');
        return fis.util(args);
    } else {
        return root;
    }
}

describe('project',function(){
    it('getTempPath', function(){
        var list = ['LOCALAPPDATA', 'APPDATA', 'HOME'];
        var tmp;
        for(var i = 0, len = list.length; i < len; i++){
            if(tmp = process.env[list[i]]){
                break;
            }
        }
        tmp = tmp || __dirname + '/../';
        tmp = tmp.replace(/\\/g, '/');
        tmp = getPath(tmp, arguments);
        expect(project.getTempPath()).to.be.equal(tmp+'/.fis-tmp');


    });
});