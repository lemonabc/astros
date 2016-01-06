'use strict';

require('console-prettify')();

var async = require('async');

var nodePath = require('path'),
    nodeFs = require('fs'),
    filePlus = require('file-plus'),
    mutil = require('lang-utils'),
    imgSmushitExt = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    md5Ext = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.eot', '.svg', '.ttf', '.woff'],
    crypto = require('crypto'); //md5

class Rel {
    constructor(siteCfg) {
        astro.evn = 'release';
        astro.setProject(siteCfg);
        this.project = siteCfg.name;
    }
    build(callback) {
        console.info('\nWelcome Astro!\t\t********');
        let self = this;;
        var ts = [new Date];

        function printTimeSpan(des) {
            ts.push(new Date);
            console.log(des, ts[ts.length - 1] - ts[ts.length - 2], 'ms');
        };

        async.series([
            function(cb){
                self.dealAssets(function(){
                    printTimeSpan('静态资源：');
                    cb()
                });
            },
            // function(cb) {
            //     self.dealWebCom(function() {
            //         printTimeSpan('web组件资源耗时：');
            //         cb();
            //     });
            // },
            function(cb) {
                self.dealPage(function() {
                    printTimeSpan('页面资源耗时：');
                    cb();
                });
            },
            function(err, values) {
                let prjCfg = astro.getProject(self.project);

                if (prjCfg.imgMd5) {
                    self.imgMd5();
                    printTimeSpan('图片MD5耗时：');
                }
                console.log('总耗时：', ts[ts.length - 1] - ts[0], 'ms');
                callback(prjCfg);
            }
        ]);
    };
    //发布页面资源
    dealPage(callback) {
        let self = this;
        try {
            let project = self.project,
                prjCfg = astro.getProject(project),
                files = filePlus.getAllFilesSync(prjCfg.page, null, ['.html']);

            async.eachSeries(files, function(file, next) {
                let asset = new astro.Asset({
                    project: project,
                    modType: 'page',
                    name: nodePath.dirname(nodePath.relative(prjCfg.page, file)),
                    fileType: 'css'
                });
                switch (nodePath.extname(file)) {
                    case '.' + prjCfg.cssExt:
                        break
                    case '.' + prjCfg.jsExt:
                        asset.fileType = 'js';
                        break;
                    default:
                        asset.fileType = 'img';
                        asset.path = file;
                        asset.name = nodePath.relative(prjCfg.page, file).replace(/[\\\/]img[\\\/](.*)$/,
                            function(a,b){return nodePath.sep + b});
                }
                asset.release(next);
            }, function(){
                callback();
            });
        } catch (error) {
            console.error('release.dealPage', error);
        }
    };
    // 发布Web组件资源
    dealWebCom(callback) {
        let self = this;
        let prjCfg = astro.getProject(self.project);
        let files = filePlus.getAllFilesSync(prjCfg.webCom, null, 
            ['.' + prjCfg.htmlExt, '.' + prjCfg.cssExt]);
        let asset = new astro.Asset({
            project: self.project,
            modType: 'webCom',
            name: '',
            fileType: 'img'
        });

        async.eachSeries(files, function(file, next) {
            let relativePath = nodePath.relative(prjCfg.webCom, file);
            asset.path = file
            asset.name = relativePath.replace(new RegExp('\\' + nodePath.sep + 'img(' + nodePath.sep + '.*?)$'),
                function(a, b) {
                    return b
                });
            asset.fileType = nodePath.extname(file)==('.'+prjCfg.jsExt)?'js':'img';
            asset.release(next);
        }, callback);
    };
    // 处理静态目录
    dealAssets(callback) {
        let self = this;
        try {
            var prjCfg = astro.getProject(self.project),
                assetsPath = nodePath.join(prjCfg.root, 'assets');

            var files = filePlus.getAllFilesSync(assetsPath, null, prjCfg.rel.ignore || []);

            let asset = new astro.Asset({
                project: self.project,
                modType: 'static',
            });
            async.eachSeries(files, function iterator(file, next) {
                // asset.name = nodePath.relative(assetsPath, file);
                asset.path = file;
                let ext = nodePath.extname(file);
                if(ext){
                    ext = ext.slice(1);
                }
                if(mutil.inArray(nodePath.extname(file), imgSmushitExt)){
                    asset.fileType = 'img';
                }else{
                    asset.fileType = ext;
                }
                asset.release(next);
            }, callback);
        } catch (error) {
            console.error('release.dealAssets', error);
            throw error
        }
    };
    // 把配置文件平移到发布目录
    dealConfig() {
        let prjCfg = astro.getProject(this.project),
            configDir = nodePath.join(prjCfg.root, 'config'),
            relDir = nodePath.join(prjCfg.release, 'config');

        filePlus.getAllFilesSync(configDir).forEach(function(file, index) {
            let relConfigFile = nodePath.join(relDir, nodePath.relative(configDir, file));
            filePlus.createFileSync(relConfigFile);
            nodeFs.writeFileSync(relConfigFile, nodeFs.readFileSync(file)); //同步写
        });
    };
    // 处理CSS图片中的雪碧图
    imgMd5() {
        var prjCfg = astro.getProject(this.project),
            imgPath = nodePath.join(prjCfg.release, 'img'),
            imgMd5Path = nodePath.join(prjCfg.release, 'm5', 'img'),
            md5JsonData = {};
        if(!nodeFs.existsSync(imgMd5Path)){
            return;
        }
        var md5Json = nodePath.join(prjCfg.imgCache, 'md5.json');
        if (!nodeFs.existsSync(md5Json)) {
            filePlus.createFileSync(md5Json);
        }
        let files = filePlus.getAllFilesSync(imgPath);
        if (files.length) {
            files.forEach(function(file, index) {
                let relativePath = nodePath.relative(imgPath, file),
                    imgMd5file = nodePath.join(imgMd5Path, relativePath),
                    ext = nodePath.extname(file);
                if (mutil.inArray(ext, md5Ext)) {
                    let filebuf     = nodeFs.readFileSync(file), //同步读
                        md5Name     = crypto.createHash('md5').update(filebuf).digest('hex').substr(0, 6), //截6
                        relMd5File  = nodePath.join(nodePath.dirname(imgMd5file, ext), 
                                        nodePath.basename(file, ext) + '_' + md5Name + ext);

                    filePlus.createFileSync(relMd5File);
                    nodeFs.writeFileSync(relMd5File, filebuf); //同步写
                    let relativeFile = nodePath.join(nodePath.sep, nodePath.relative(prjCfg.release, file));

                    relativeFile = relativeFile.split(nodePath.sep);
                    relativeFile = relativeFile.join('/');

                    let md5RelativeFile = nodePath.relative(prjCfg.release, relMd5File).split(nodePath.sep).join('/');
                    md5JsonData[relativeFile] = '/' + md5RelativeFile;
                }
            });
            // 写入json配置
            nodeFs.writeFileSync(md5Json, JSON.stringify(md5JsonData), 'utf8');
            
            files = filePlus.getAllFilesSync(nodePath.join(prjCfg.release, 'css'), ['.css']);

            let preFix = prjCfg.imgPath || prjCfg.cdnPrefix || '';
            files.forEach(function(file){
                let code = nodeFs.readFileSync(file, 'utf8').toString();

                code = code.replace(/url\((['"]?)(?!http)([^?)"']+?)(\?[^'")]+)?\1\)/ig, 
                        function(str, d, ipath, ver){
                    // ipath = ipath.replace(/^\s+|\s+$/g,'_')
                    if(preFix){
                        ipath = ipath.replace(preFix, '');
                    }
                    if(md5JsonData[ipath]){
                        return 'url(' +preFix+ md5JsonData[ipath] + (ver || '') + ')';
                    }
                    return str;
                });
                nodeFs.writeFileSync(file, code);
            });
        }
    }

};

module.exports = Rel;