'use strict';
var nodePath = require('path');
var nodeFS = require('fs');

var router = require('express').Router(); // 新建一个 router

var crypto = require('crypto');
var util = require('lang-utils');
var file = require('file-plus');

// 获取静态资源饮用
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
            //console.log(path);
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
            let asset = new astro.Asset({
                project: project,
                modType: modType,
                name: name,
                fileType: 'js'
            });
            var cdn = 

            asset.getContent(function(){
                //获取 对应依赖关系
                //根据配置文件返回js
                //console.log(astro.getProject(project));
                let depFile = nodePath.join(astro.getProject(project).root, 'config', 'dependon');
                let dep = require(depFile);
                if(dep[name]){

                    var cdn = '';
                    if(astro.getProject(project).cdn){
                        cdn = astro.getProject(project).cdn
                    }else{
                        cdn = 'http://'+req.headers.host;
                    }
                    for(let item in dep[name]){
                        resTag = resTag + '<script src="'+cdn+'/js/c/' + item + '.js"></script>\n';
                    }

                    if(asset.read()){
                        resTag = resTag + '<script src="'+cdn+'/js/p/' + name + '.js"></script>\n';
                    }
                }
                res.end(resTag);
                //console.log(asset);
                // output
                // modType: page, name:home fileType: css
            });
        }

        return;
        jsCode = astro.fileAccessor.getFileContentSync(resList, 'js', project);

        // 解析
        astro.parse(jsCode, 'js', project, {
            compress: true
        }, function(code, unCombineList) {
            unCombineList.forEach(function(fileName) {
                var fileName = unCombineList[i];
                var name = fileName + v;
                var md5 = crypto.createHash('md5');
                md5.update(name);
                var d = md5.digest('hex');

                file.createFileSync(nodePath.join(prjCfg.realease, 'js', d + '.js'));
                nodeFS.writeFileSync(nodePath.join(prjCfg.realease, 'js', d + '.js'), 
                    astro.fileAccessor.getJsComJs(fileName, project));
                resTag = resTag + '<scritp src="rel/js/' + d + '.js"></script>\n';
            });
            var name = resString + v;
            var md5 = crypto.createHash('md5');
            md5.update(name);
            var d = md5.digest('hex');
            file.createFileSync(nodePath.join(prjCfg.realease, 'js', d + '.js'));
            nodeFS.writeFile(nodePath.join(prjCfg.realease, 'js', d + '.js'), jsCode, function(e) {
                if (!e) {
                    resTag = resTag + '<scritp src="rel/js/' + d + '.js"></script>\n';
                    res.end(resTag);
                } else {
                    res.end(resTag);
                }
            });
        });
    } else if (type == 'css') {
        // for (var i = 0; i < resList.length; i++) {
        //     var tag = '<link href="' + resList[i] + '"r el="stylesheet" type="text/css" />\n'
        //     resTag = resTag + tag;
        // }
        res.end('resTag');
    }

});


module.exports = router