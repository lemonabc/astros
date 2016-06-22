'use strict';
var nodePath = require('path');
var nodeFS = require('fs');

var router = require('express').Router(); // 新建一个 router

var crypto = require('crypto');
var util = require('lang-utils');
var file = require('file-plus');

// 获取静态资源引用
router.post('/get-assets', function(req, res, next) {
    var app = res.app;
    //TODO 传过来project名称
    var project = req.body.project || 'default';

    var root = astro.get('root');
    var v = req.body.v || 2008;
    // root = nodePath.join(root, project, v);
    var prjCfg = astro.hasProject(project);
    if (!prjCfg) {
        // 没有设置过项目
        // 目前写死
        prjCfg = {
            //站点根目录
            root: root,
            //组件目录
            webCom: nodePath.join(root, 'components'),
            //页面目录  
            page: nodePath.join(root, 'pages'),
            //JS组件目录
            jsCom: nodePath.join(root, 'assets', 'jslib'),
            //LESS类库目录
            cssLib: nodePath.join(root, 'assets', 'less'),
            //资源发布目录
            realease: nodePath.join(root, 'realease')
        };
        astro.setProject(project, prjCfg);
    }else{
        prjCfg = astro.getProject(project);
    }

    var resString = req.body.path;
    var resList = resString;
    var type = req.body.type;

    //type 未script和css
    var resTag = ' ';
    var jsCode = '';
    if (type == 'script') {
        
        //分解请求字符串
        var assetsList =  resString.split(",");
        //按照请求形式分解需求自愿
        //components开头为只解析对应components
        //page开头只解析页面js
        // /开头为解析整个页面js
        for(var i=0;i<assetsList.length;i++){
            var path = assetsList[i];
            
            let modType,name;
            if(path.match(/^\/(.*)/)){
                modType = 'page';
                name = path.match(/^\/(.*)/)[1];
            }else if(path.search(/^components/)){

            }else if(path.search(/^page/)){
                modType = 'page';
        
            }else{
                return;
            }

            //通过dependon文件返回js文件
            if(modType == 'page'){
                let host = astro.getProject(project).host;
                if(!host){
                    host = 'http://'+req.headers.host;
                }

                let depFile = nodePath.join(astro.getProject(project).root, 'config', 'dependon');
                //console.log(nodeFS.existsSync(depFile + '.js') && require(depFile).page && require(depFile).page[name]);
                if(nodeFS.existsSync(depFile + '.js') && require(depFile).page && require(depFile).page[name]){
                    let dep = require(depFile).page;
                    if(!dep){
                        console.error('依赖关系配置错误');
                        res.end(resTag);
                        return;
                    }
                    if(dep[name]){
                        for(let i=0;i<dep[name].length;i++){
                            let item = dep[name][i];
                            resTag = resTag + '<script src="'+host+'/js/m/' + item + '.js"></script>\n';
                        }
                    }
                }else{

                    resTag = resTag + '<script src="'+host+'/js/p/' + name + '.js"></script>\n';
                }
                res.end(resTag);
            }
            

        }
    } else if (type == 'css') {
        // for (var i = 0; i < resList.length; i++) {
        //     var tag = '<link href="' + resList[i] + '"r el="stylesheet" type="text/css" />\n'
        //     resTag = resTag + tag;
        // }
        res.end('resTag');
    }

});


module.exports = router