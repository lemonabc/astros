'use strict';

var nodePath = require('path');
var nodeFs = require('fs');
var filePlus = require('file-plus');

/*
    // root/asset/img/abc.jpg
    // relPath    rel/img/abc.jpg
    var asset = new astro.Asset({
        modType:'static',
        fileType:'page',
        name: 'home'
    });
    
    asset.getContent(function(){
        console.log(assrt.info);
        // output
        // modType: page, name:home fileType: js
    });
 */

const _modNameMin = {
    'jsCom': 'jsccom',
    'webCom': 'webcom',
    // 'img': '',
    'page': 'p'
};


const _modNameFull = {
    'jsccom': 'jsCom',
    'webcom': 'webCom',
    'p': 'page'
};
class Asset {
    constructor(request, project) {
        project = project || 'default';
        this.project = project;
        if (request.url) {
            this.request = request;
        } else {
            Object.assign(this, request);
        }
    }
    get name(){
        return this._name;
    }
    set name(value){
        this._name = value;
        this.extname = nodePath.extname(value);
    }
    get path(){
        return this._path;
    }
    set path(value){
        this._path = value;
        this.extname = nodePath.extname(value);
        if(this.modType == 'static'){
            this.name = nodePath.relative(this.prjCfg.assets, value);
            return;
        }
    }
    // 文件物理路径
    get filePath() {
        if(this.path){
            return this.path
        }
        let cfg = this.prjCfg;
        let filePath = '';
        try {
            switch (this.modType) {
                case 'page':
                case 'webCom':
                case 'jsCom':
                    // if(this.fileType == 'img'){
                    //     filePath = nodePath.join(nodePath.dirname(this.name),'img',nodePath.basename(this.name));
                    //     break;
                    // }
                    filePath = nodePath.join(this.name, nodePath.basename(this.name))
                    break;
                case 'cssLib':
                    filePath = this.name;
                    break;
                default:
                    console.warn('astro.asset.filepath: ' + this.modType + ' is miss');
                    return '';
            }
            let ext = this.fileType == 'img'?'':('.' + (cfg[this.fileType + 'Ext'] || this.fileType));
            return nodePath.join(cfg[this.modType], filePath + ext);
        } catch (error) {
            console.info('filePath error', this.info);
        }
    }
    get info() {
        return require('util').format('modType:%s, name:%s, fileType:%s',
            this.modType, this.name, this.fileType);
    }
    /**
     * @param {String} relPath 发布路径
     */
    get relPath() {
        if(this._relPath){return this._relPath}
        if(this.modType == 'static'){
            require('assert')(typeof this.path, 'string', 'this.path is undefined; ' + this.info);
            return nodePath.join(this.prjCfg.release,this.name);
        }
        return nodePath.join(
            this.prjCfg.release,
            this.fileType,
            this.modNameMin[this.modType]||'',
            this.name + (this.fileType == 'img' ? '' : ('.' + this.fileType))
        );
    };

    set relPath(value) {
        this._relPath = value;
    };    
    /**
     * @param {Object} proCfg 项目配置
     */
    get prjCfg() {
        if (!this._prjConfig) {
            this._prjConfig = astro.getProject(this.project);
        }
        return this._prjConfig;
    }
    get modNameFull() {
        return _modNameFull
    };
    get modNameMin() {
        return _modNameMin;
    };
    /**
     * 发布资源
     */
    release (callback){
        let self = this;
        self.status = 'release';
        // return new Promise(function(resolve, reject){
        self.getContent(function () {
            // if(astro.theme){
            // console.log('cl',self.relPath);
            // }
            filePlus.createFileSync(self.relPath);
            nodeFs.writeFileSync(self.relPath, self.data);
            callback && callback(this);
            delete self.status;
        });
        // });
    }
    // 读取文件内容
    read() {
        var filepath = this.filePath;
        if (nodeFs.existsSync(filepath)) {
            var fileData = nodeFs.readFileSync(filepath);
            fileData = this.modType == 'static' || this.fileType == 'img' ? fileData : fileData.toString();
            return fileData;
        }
        console.warn('asset.read: ' + filepath + ' is miss')
        return null;
    }
    getContent(callback) {
        // TODO 防止在中间中，asset调用getContent，形成循环调用
        let self = this;
        let hi = 0;
        let mw;
        let mws = this.status == 'release' ? 
            self.prjCfg.rel.mws :
                self.prjCfg.mws;

        // console.log(mws);
        (astro.debug || self.debug) && console.info(self.info);
        function next(asset) {
            try {

                if (mw = mws[hi]) {
                    let ret = mw.test(self);
                    if (ret.val) {
                        (astro.debug || self.debug) && console.log('middleware metched:',mw.name);
                        mw.fn(asset, function() {
                            hi++;
                            next.apply(astro, arguments);
                        });
                    } else {
                        (astro.debug || self.debug) && console.log('middleware dont\'t metched:%s, \t%s',mw.name, ret.des);
                        hi++;
                        next.apply(astro, arguments);
                    }
                    return;
                }
                (astro.debug || self.debug) && console.log('\n')
                // 处理当使用Generator特性时，中间件没有使用异步的情况
                setTimeout(function(){
                    callback(asset);
                }, 0);
            } catch (error) {
                console.error(mw.name, error, ' 可能是内部调用其他方法引起的异常');
                asset.data = '*'.repeat(80)+'\n'.repeat(2) +
                    'there is a error in middleware('+
                    mw.name +'):\n\t'+ 
                    error + '\n'.repeat(2) +'*'.repeat(80)+'\n'.repeat(3)
                callback(asset);
            }
        }
        next(self);
    };
    // 批量获取Asset内容
    static getContents(assets, callback) {
        return new Promise(function(resolve, reject) {
            let i = 0;
            let read = () => {
                let asset = assets[i++];
                // console.log(i, asset ? asset.name : 'a');
                if (!asset) {
                    callback && callback(assets);
                    resolve(assets);
                    return;
                }
                asset.getContent(function() {
                    read();
                });
            }
            read();
        })
    }
    clone() {
        return Object.assign(new Asset({}), this);
    }
}

module.exports = Asset;