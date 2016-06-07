'use strict';

var nodePath = require('path');
var nodeUtil = require('util');
var fs = require("fs"); 
var release = require('astros').builder;
var http = require('http');
var nodegrass = require('nodegrass');
var filep = require('file-plus');
var util = require('lang-utils');
var async = require('async');
var http = require('http');
require('console-prettify')({
    prefix:1
});

class build{
    constructor(siteCfg) {
        this.siteCfg = siteCfg;
    }
    build(callback) {
        var self = this;
        var b = new release(self.siteCfg);
        b.build(function(prjCfg){
            //启动Web服务
            var app = (require('express'))();
            var pandora = new(require('pandorajs'));

            var appCfg = require(nodePath.join(self.siteCfg.root, 'config','site-build'));

            app.set('env', appCfg.env);
            process.env.NODE_ENV = appCfg.env;

            pandora.init(app, appCfg);

            require('pandora-proxy')(app);

            var port = appCfg.port;
            var temp_i = 0;
            var server = http.createServer(app);
            server.on('error', function(e){
                if (e.code == 'EADDRINUSE' )  {
                    if(temp_i++ >= 10){
                        console.log('尝试超过十次！');
                        return;
                    }
                    console.warn('端口 %s 被占用，尝试从 %s 启动', port, ++port);
                    setTimeout(function() {
                        server.close();
                        server.listen(port);
                    }, 100);
                    return;
                }
                console.info('服务启动失败:');
                console.log(e.stack);
            });
            server.on('listening',function(e){
                var ips = util.getLocalIp();

                console.log(nodeUtil.format('server is listening on %d', port));
                console.log('you can visit with:')

                ips.forEach(function(ip){
                    console.info('  http://%s:%s',ip, port);
                });
                //启动Web服务 END
                var routesDir = prjCfg.routes,
                    routes = filep.getAllFilesSync(routesDir),
                    rootUrl = "http://"+util.getLocalIp()[0]+":"+port,
                    reg = /router\.get\('([^\']*)'/,
                    fileNameReg = /@html:([^\n]*)/,
                    _cache = prjCfg.release;

                async.map(routes,function(file,next){
                    var content = fs.readFileSync(file,'utf-8');
                    var group = content.match(reg);
                    var tempUrl = rootUrl + group[1];
                    var fileName;
                    //从注释获取文件名
                    var fileNameGroup = content.match(fileNameReg);
                    if(fileNameGroup){
                        fileName = fileNameGroup[1].trim();
                        var rfile = nodePath.join(_cache,fileName+'.html');
                        //请求对应页面
                        nodegrass.get(tempUrl,function(data,status,headers){
                            filep.createFileSync(rfile);
                            fs.writeFileSync(rfile, data);
                            next(null,true);
                        },null,'utf8').on('error', function(e) {
                            console.log("Got error: " + e.message);
                        });
                    }else{
                        next(null,true);
                    }
                    
                },function(err,result) {
                    console.log('发布成功');
                    process.exit();      
                })
            })

            //app.listen(port);
            server.listen(port);       
            
        })
    }
}
module.exports = build;
