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

let file_cache = {};
let file_miss = {};

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
        this.status = astro.evn;
        this._wms = [];
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
                    if(!this.modType)console.warn('astro.asset.filepath: ' + this.modType + ' is miss');
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
        let stat = filePlus.statSync(filepath);

        if(stat){
            // 已有缓存
            file_miss[filepath] = false;
            if(!file_cache[filepath] || this.mtime !== stat.mtime){
                this.mtime = stat.mtime;
                let obj = file_cache[filepath] || {}
                if(this.fileType == 'js' || 
                   this.fileType == 'css'|| 
                   this.fileType == 'html'){
                    obj.data = nodeFs.readFileSync(filepath, 'utf8').toString();
                }else{
                    obj.data = nodeFs.readFileSync(filepath);
                }
                file_cache[filepath] = obj;
            }
            return file_cache[filepath].data;
        }
        !file_miss[filepath] && console.warn('asset.read: ' + filepath + ' is miss\t', this.info);
        file_miss[filepath] = true;
        return null;
    }
    getContent(callback) {
        // TODO 防止在中间中，asset调用getContent，形成循环调用
        let self = this;
        let hi = 0;
        let mw;
        let mws = self.prjCfg.mws;

        // mws = mws ||[];
        if(!mws || !mws.length){
            // TODO
            console.error('未加载任何中间件！status:' + this.status);
            // console.log(self.prjCfg);
            return;
        }
        // console.log(mws);
        (astro.debug || self.debug) && console.info(self.info);
        function next(asset) {
            try {

                // 防止一个中间件出现异常事，导致后续中间件无法处理
                // 最终输出异常内容
                if((astro.debug || self.debug) && hi >= 1 && 
                    (!asset.data || asset.data == 'undefined')){
                    console.warn('data is undefined or null after middleware %s.  info%s', mw.name, asset.info)
                }

                if (mw = mws[hi]) {
                    let ret = mw.test(self);
                    if (ret.val) {
                        asset._wms.push(mw.name);
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
                process.nextTick(function () {
                    callback(asset);
                })
                // setTimeout(function(){
                //     callback(asset);
                // }, 0);
            } catch (error) {
                console.error(mw.name,  error.stack);
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
        require('assert')(require('util').isArray(assets), 'Asset.getContents 的参数必须是数组！');
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