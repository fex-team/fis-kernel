fis.config.merge({
    namespace : 'photo',
    "modules" : {
        "packager" : "map"
    },
    roadmap : {
        domain : {
            '*.js' : 'http://img.baidu.com',
            '*.css' : 'http://css.baidu.com'
        },
        path : [
            {
                reg : /^\/test\//i,
                release : false
            },
            {
                reg : /\.tmpl$/i,
                release : false
            },
            {
                reg : /^\/widget\/.*\.(js|css)$/i,
                isMod : true,
                release : '/static/${namespace}$&'
            },
            {
                reg : /^\/ui\/.*\.(js|css)$/i,
                isMod : true,
                release : '/static/${namespace}$&'
            },
            {
                reg : /^\/widget\/(.*\.tpl)$/i,
                isMod : true,
                url : 'widget/${namespace}/$1',
                release : '/template/widget/${namespace}/$1'
            },
            {
                reg : /^\/plugin\//i
            },
            {
                reg : /^\/.+\.tpl$/i,
                release : '/template/${namespace}$&'
            },
            {
                reg : /^\/photo-map\.json$/i,
                release : '/config$&'
            },
            {
                reg : /^.*$/,
                release : '/static/${namespace}$&'
            }

        ]
    },
    settings : {
        modular : {
            reqlang : {
                wrap : 'amd'
            }
        }
    },
    deploy : {
        'rd-test' : {
            receiver : 'http://zhangyunlong.fe.baidu.com/receiver.php',
            to : '/home/zhangyunlong/public_html'
        }
    }
});
