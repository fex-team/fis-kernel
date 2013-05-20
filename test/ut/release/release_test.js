var fs = require('fs'),
    path = require('path'),
    ROOT = path.join(__dirname, '../..')
        .replace(/\\/g, '/')
        .replace(/\/$/, ''),
    _path = __dirname
        .replace(/\\/g, '/')
        .replace(/\/$/, '');

var fis = require('../../../fis-kernel.js');
var  uri = fis.uri,
    config = fis.config,
    project = fis.project,
    release = fis.release;

//var opt ={
//    commands: [],
//    options:
//        [ { flags: '-d, --dest <names>',
//            required: -12,
//            optional: 0,
//            bool: true,
//            short: '-d',
//            long: '--dest',
//            description: 'release output destination' },
//            { flags: '-w, --watch',
//                required: 0,
//                optional: 0,
//                bool: true,
//                short: '-w',
//                long: '--watch',
//                description: 'monitor the changes of project' },
//            { flags: '--md5 <level>',
//                required: -7,
//                optional: 0,
//                bool: true,
//                long: '--md5',
//                description: 'md5 release option' },
//            { flags: '--domains',
//                required: 0,
//                optional: 0,
//                bool: true,
//                long: '--domains',
//                description: 'add domain name' },
//            { flags: '--lint',
//                required: 0,
//                optional: 0,
//                bool: true,
//                long: '--lint',
//                description: 'with lint' },
//            { flags: '--optimize',
//                required: 0,
//                optional: 0,
//                bool: true,
//                long: '--optimize',
//                description: 'with optimize' },
//            { flags: '--pack',
//                required: 0,
//                optional: 0,
//                bool: true,
//                long: '--pack',
//                description: 'with package' },
//            { flags: '--debug',
//                required: 0,
//                optional: 0,
//                bool: true,
//                long: '--debug',
//                description: 'debug mode' } ],
//        _args: [],
//        _name: 'release',
//        parent:
//        { commands: [ [Circular] ],
//            options: [],
//            _args: [],
//            _name: 'fis',
//            Command: "[Function: Command]",
//    Option: "[Function: Option]",
//    _events: { release: "[Object]" },
//    rawArgs:
//        [ 'node',
//            'C:\\Documents and Settings\\jiangshuguang\\Application Data\\npm\\node_
//            modules\\fis\\bin\\fis',
//    'release' ],
//    args: [ [Circular] ] },
//    _usage: undefined,
//        _description: 'build and deploy your project',
//        dest: 'preview',
//        _events:
//    { dest: [Function],
//        watch: [Function],
//        md5: [Function],
//        domains: [Function],
//        lint: [Function],
//        optimize: [Function],
//        pack: [Function],
//        debug: [Function] },
//    md5: 0,
//        hash: false,
//        beforeEach: [Function],
//        afterEach: [Function] }
var opt = {
    afterPack:function(ret){
        console.log("  ---------  ");
          console.log(ret.pkg)
    },
    beforePack:function(ret){
        console.log("  ---------  ");
        console.log(ret.pkg)
    },
//    exclude:/^\/ui\/a\/a\.js$/,
    pack:true,
    domain:true
};
fis.project.setProjectRoot(_path+"/test3");
conf = _path+"/test3/fis-conf.js";
fis.config.merge(fis.util.readJSON(__dirname + '/standard.json'));
require(conf);

release(opt,function(ret){

});

//console.log(_path+"/expect1/photo-map.json");
//fs.readFile(_path+"/expect1/photo-map.json","utf-8",function(err,data){
//    console.log(data);
//});