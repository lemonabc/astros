'use strict';

var nodeFs = require('fs');
var nodePath = require('path');
var nodeUtil = require('util');
var util = require('lang-utils');
class Astro {
    constructor(options) {
        if (GLOBAL.astro) {
            return GLOBAL.astro;
        }
        // 私有方法
        injectMethod(this);
        this.init();
        GLOBAL.astro = this;
    }
    /**
     * 初始化方法
     * @param  {Object|Sitring} 项目配置文件或站点配置 [description]
     * @return {[type]}         [description]
     */
    init(options) {
            var self = this,
                express = require('express'),
                app = express();

            app.set('astro', self);
            self.set('app', app);

            self.Asset = require('./asset');
            self.Middleware = require('./middleware');
        }
        // 开始监听
    listen(port) {
        port = port || this.getProject('default').port;
        if(!port){
            console.error('请在站点设置中配置port');
            return;
        }
        var app = this.get('app');
        var bodyParser = require('body-parser');

        app.use(bodyParser.json()); // for parsing application/json
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.use(require('./router/resource'));
        app.use(require('./router/api'));

        app.listen(port);

        console.info('static server is listening on ' + port);
    }
};

function injectMethod(ast) {
    var _projects = {};
    /**
     * 设置项目配置
     * @param {[type]} prjName [description]
     * @param {[ type]} cfg     [description]
     */
    ast.setProject = function(options) {
        var self = this,
            root;

        if (typeof options == 'string') {
            root = options;
            options = require(nodePath.join(root, 'config', 'static'));
            options.root = root;
        } else {
            root = options.root
        }
        self.evn = options.evn || 'development';
        options.name = options.name || 'default';

        options = createProjectConfig(root, options);
        if (!root) {
            throw new Error('Astro.init: please set root! as:astro({root:__dirname})');
        }
        options.mws     = [];
        options.rel.mws = [];

        let mws_rel = options.rel.hook || [],
            mws     = options.hook || [];

        [   [mws, options.mws, 'options.mws'],
            [mws_rel, options.rel.mws, 'options.rel.mws']
        ].forEach(function(item) {
            console.warn(item[2]+':');
            item[0].forEach(function(name) {
                try {
                    let mw = require(name);
                    if (!(mw instanceof astro.Middleware)) {
                        console.error('hook ' + name + ' is not instanceof astro.Middleware')
                    } else {
                        mw.name = name;
                        item[1].push(mw);
                        console.info('hook %s is loaded', name);
                    }
                } catch (error) {
                    console.error('hook %s is miss', name);
                    throw error;
                }
            });
        });

        _projects[options.name] = options;
    };
    /**
     * 跟获取项目配置
     * @param  {[type]} prjName [description]
     * @return {[type]}         [description]
     */
    ast.getProject = function(prjName) {
        if (!prjName || !_projects[prjName]) {
            throw new Error(nodeUtil.format('The project(%s) was not found', prjName));
            return null;
        }
        return _projects[prjName];
    };
    /**
     * 是否有站点配置
     * @return {Boolean} [description]
     */
    ast.hasProject = function() {
        for (var i in _projects) {
            return true;
        }
        return false;
    };

    var _data = {};
    ast.set = function(key, value) {
        _data[key] = value;
    };
    ast.get = function(key) {
        return _data[key] || null;
    };
}
/**
 * 生成站点默认配置
 * @private
 * @param  {[type]} root [description]
 * @return {[type]}      [description]
 */
function createProjectConfig(root, options) {
    return Object.assign({
        root: root,
        jsExt: 'js',
        cssExt: 'less',
        htmlExt: 'html',
        // imgPath: 'assets',
        hook: [],
        //页面目录  
        page: nodePath.join(root, 'pages'),
        assets: nodePath.join(root, 'assets'),
        //组件目录
        webCom: nodePath.join(root, 'components'),
        //JS组件目录
        jsCom: nodePath.join(root, 'assets', 'jslib'),
        //LESS类库目录
        cssLib: nodePath.join(root, 'assets', 'less'),
        //资源发布目录
        cache: nodePath.join(root, '_cache'),
        //资源发布目录
        release: nodePath.join(root, '_cache', 'release'),
        //图片相关缓存目录
        imgCache: nodePath.join(root, '_cache', 'imgcache'),
        img: nodePath.join(root, 'assets', 'img'),
    }, options);

}
// Object.defineProperty(global, 'fis', {
var astro = new Astro();

module.exports = astro;