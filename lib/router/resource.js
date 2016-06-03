var router = require('express').Router(); // 新建一个 router
var nodePath = require('path');
var nodeFs = require('fs');
var nodeUrl = require('url');
var util = require('lang-utils');

var mine = {
    default: 'text/html;charset=utf-8',
    html: 'text/html;charset=utf-8',
    ajax: 'text/html;charset=utf-8',
    // ajax:'application/json; charset=utf-8'
    "js": "text/javascript",
    "css": 'text/css;charset=utf-8',
    "gif": "image/gif",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml",
    //字体
    "ttf": "font/ttf",
    "eot": "application/vnd.ms-fontobject",
    "otf": "font/opentype",
    "woff": "font/x-woff",
    "svg": "image/svg+xml"
};
// 静态资源服务
router.get('/*', function(req, res, next) {
    /*
        /js/p/
        /css/p/
        /img/p/
        /img/m/
        /img/jslib/
    */
    var app = res.app;
    var project = 'default';


    var pathname = nodeUrl.parse(req.url).pathname,
        prjCfg = astro.getProject(project);

    if(!prjCfg.host || prjCfg.host.indexOf('127.0.0.1')>-1){
        if(prjCfg.host !== req.headers.host){
            prjCfg.host = req.headers.host;
        }
    }

    if (req.url.indexOf(prjCfg.cdnPrefix) == 0) {
        req.url = req.url.replace(prjCfg.cdnPrefix, '');
    }

    var ext = nodePath.extname(pathname),
        ext = ext ? ext.slice(1) : 'unknown',
        contentType = mine[ext] || 'text/plain';

    var asset = new astro.Asset(req, project);

    // 字体跨域访问
    res.set('Access-Control-Allow-Origin', "*");
    // 强制缓存，方便手机调试
    res.set('CacheControl', 'no-store');

    asset.getContent(function(asset){
        if(asset.data){
            res.set('Content-Type', contentType);        
            res.end(asset.data);
        }else{
            res.set('Content-Type', mine['txt']);
            res.statusCode = '404';
            res.end(asset.data ? asset.data : '404\n' + asset.filePath );
        }
    })

});
module.exports = router