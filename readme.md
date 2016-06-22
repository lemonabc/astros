Astros是一个前端集成开发环境，旨在通过工具自动化完成大部分非思考性的工作，如JS合并、脚本压缩、图片优化、合成雪碧图和字体文件等，让程序员更能享受编程本身。

Astros的核心，是做为一个前端静态资源服务器，每次请求，都是实时处理并返回。在Astros中，任何资源，如js、css、图片、字体、视频等都是一个`Asset`，收到请求后，依次调用可用的`中间件`完成对Asset的解析、依赖分析、优化等操作，最后返回处理结果。

通过Astros目前提供的中间件，已能完成如下功能：

* 自动合并雪碧图
* 根据SVG，自动合成字体文件
* 二倍图转一倍图（只需要切2倍图，自动生成1倍图）
* 自动对图片进行无损压缩，并附加交错属性
* 解析LESS，自动完善样式HACK（如为`border-radius`添加`-wekit-`等前缀）
* CSS和JS压缩
* 支持在浏览器端使用CMD模式
* HTML自动转JS模板（正常书写HTML，JS中作为变量引用，不必在JS中拼接字符串）
* 静态资源发布时，支持文件名MD5
* <del>livereload</del> 开发中

## 安装


### 安装astros-cli

创建项目时，你不必手动创建目录结构，挨个安装nodejs依赖，`astros-cli`能帮你完成这些工作。

``` bash
npm install -g astros-cli
```

### 创建项目

``` bash
astros create ~/astros-example
```
或者直接从 github 获取

``` bash
git clone git@github.com:lemonabc/astros-example.git
cd astros-example
npm install
npm start
```

默认端口号是Web服务器端口号是3301，静态资源服务端口号是 3300

## 工作目录
<pre>
root[dir] 站点根目录
    __cache[dir] 缓存目录
    assets[dir] 资源目录
        img[dir] 公共图片资源
        js[dir]公共JS资源
        jslib[dir] JS组件
            dialog[dir] 对话框组件，目录名称、文件名称必须和组件名称一致
                img[dir]该组件用到的图片
                dialog.js
                dialog.less
        less[dir]样式库
    components[dir] Web组件 *支持多级目录*
        header[dir] 通用头
            header.html
            header.js
            header.less
            img[dir]
    config[dir] 站点配置目录
        static.js   静态资源服务器配置
        site.js    站点配置。
    routes[dir] 路由 *支持多级目录*
    pages[dir] 页面模板 *支持多级目录*
    sh[dir]
</pre>

## 配置文件

### static.js
<pre>
// 静态资源服务器配置
module.exports = {
    //......
}
</pre>

>发布时，会读取static-build.js，可在发布时才引用图片压缩、JS压缩等中间件。

属性|类型|默认值|描述
----|----|----|----
name|String|default|项目名称
port|Number|3104| 静态资源服务器端口号
root|String||项目根目录
jsExt|String|js|JS文件后缀名
cssExt|String|less|样式文件后缀名
htmlExt|String|html|html文件后缀名
assets|String|site/assets|静态资源目录
webCom|String|site/components|web组件目录
jsCom|String|site/assets/less|js组件目录
cssLib|String|site/assets/less|公共样式类库目录
page|String|root/page|页面存储路径
cache|String|root/_cache|缓存目录
release|String|root/_cache/release|发布目录
img|String|root/assets/img|图片存放目录
imgCache|String|root/_cache/imgcache|图片处理缓存目录
**ignore**|Array|['jslib', 'less'|发布时要忽略的assets下的目录
middlewares|Array||项目加载的中间件
cdnPrefix|||资源路径修饰符

### site.js

属性|类型|默认值|描述
----|----|----|----
port|String|3100|web服务器端口号
root|String||项目根目录
openTag|String|{{|模板开始标记
closeTag|String|}}|模板结束标记
page|String|root/page|页面存储路径
autoAssets|Boolean|false|支持自动引用页面CSS和JS
globalVariable|Object||全局参数


<pre>
    // 站点端口号
    port: 3100,
    // 站点根目录
    root: require('path').join(__dirname, '..'),
    // 页面存储路径
    page: require('path').join(__dirname, '..', 'pages'),
    // 是否自动启用静态资源服务器
    // autoAssets: false,
    // 模板全局属性，在套页面时，用$.g.name访问
    // 通常用于设置版本号、图片服务器等全局参数
    : {
        assets: 'http://10.8.8.43:81/assets'
    }
</pre>

>发布时，会读取site-build.js

## 发布

在项目根目录下，执行

``` bash
astros build
```

或者

``` bash
astros build 项目目录
```


你可以增加 `--html` 参数，发布解析后的HTML


更多文档，请访问[官网](http://www.iastros.com/doc/start)