/*用来删除写到xunit report里的install信息*/

var fs = require('fs');
var file = "report.xml";
var report = fs.readFileSync(file);
var content = report.toString().split('\n');
var i = 0;
for(i=0; i<content.length;i++ ){
    var reg = /\binstall.*/g ;
    callback = function($1){
        if($1){
            content.splice(i,1);
            i--;
        }
    };
    content[i].replace(reg,callback);
}
fs.writeFileSync(file, content);