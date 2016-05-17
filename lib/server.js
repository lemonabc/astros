'use strict';

var nodePath = require('path');
var nodeUtil = require('util');

var util = require('lang-utils');
var http = require('http');
require('console-prettify')({
    prefix:1
});

class Server {
    constructor(siteCfg) {
        this.dirname = siteCfg.dirname;
        this.siteCfg = siteCfg.siteCfg;

    }
    start(){
        //启动静态服务器
        console.log('--------------');
        require('astros');

        astro.setProject(this.dirname);
        astro.listen();
    //启动静态服务器 END



    //启动Web服务
        var app = (require('express'))();

        var pandora = new(require('pandorajs'));

        var appCfg = this.siteCfg;
        app.set('env', appCfg.env);

        process.env.NODE_ENV = appCfg.env;


        pandora.init(app, this.dirname);

        require('pandora-proxy')(app);
        require('pandora-astros-map')(app);

        var port = appCfg.port || 3100;
        var temp_i = 0;
        var server = http.createServer(app);
        server.on('error', function(e){
            if(appCfg.port){
                console.warn('端口 %s 被占用,请修改或注释掉site内的port字段', port);
                return;
            }
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
            console.info('你可以通过以下地址访问:')

            ips.forEach(function(ip){
                console.log('  http://%s:%s',ip, port);
            });
        });
        server.listen(port);
    }
} 



module.exports = Server;

    
//启动Web服务 END