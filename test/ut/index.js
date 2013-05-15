var Mocha = require('mocha'),
    path = require('path'),
    fs = require('fs');

var mocha = new Mocha({
    reporter: 'dot',
    ui: 'bdd',
    timeout: 999999
});

var testDir = 'D:/Workplace/git/fis-kernel/test/ut/cache.js';

//fs.readdir(testDir, function (err, files) {
//    if (err) {
//        console.log(err);
//        return;
//    }
//    files.forEach(function (file) {
//        if (path.extname(file) === '.js') {
//            console.log('adding test file: %s', file);
//            mocha.addFile(testDir + file);
//        }
//    });

mocha.addFile(testDir);

    var runner = mocha.run(function () {
//        console.log('all cases finished');
    });

    runner.on('pass', function (test) {
        console.log('... %s passed', test.title);
    });

    runner.on('fail', function (test) {
        console.log('... %s failed', test.title);
    });
//});