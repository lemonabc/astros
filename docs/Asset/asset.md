## Asset

### constructor
**参数形式1：**
    
```
    new astro.Asset(request, project);
```

**参数形式2：**
    
```
    new astro.Asset({
        modType: 'page'
        ......
    });
```

### 属性
#### asset.modType
资源类型
* jsCom|webCom|page|static

#### asset.name
资源名称

#### asset.fileType
资源类型

* js|css|img|...

#### asset.filePath

文件物理路径

* 可读、写

#### asset.info

* 只读

返回资源对象信息

```
    console.log(asset.info);
    /* output:
    
        modType: page, name:home fileType: css
    */
```

#### asset.relPath

发布的物理路径

* 可读、写


#### 示例
```
    // request(http://127.0.0.1:3100/css/p/home.css)
    
    var asset = new astro.Asset(request, projectName);
    
    asset.getContent(function(){
        console.log(assrt.info);
        // output
        // modType: page, name:home fileType: css
    });
```
```    
    // request(http://127.0.0.1:3100/img/webcom/footer/background.png)
    var asset = new astro.Asset(request, projectName);
    
    asset.getContent(function(){
        console.log(assrt.info);
        // output
        // modType: webCom, name:footer/background.png fileType: img
    });
```
```    
    var asset = new astro.Asset({
        modType:'page',
        fileType:'page',
        name: 'home'
    });
    
    asset.getContent(function(){
        console.log(assrt.info);
        // output
        // modType: page, name:home fileType: js
    });
```

#### asset.prjCfg

* 只读

asset所属项目配置

#### asset.modNameMin
资源类型对应的缩写

```
    {    
        'jsCom': 'jsccom',
        'webCom': 'webcom',
        'img': '',
        'page': 'p'
    }
```
#### asset.modNameFull
资源类型对应的完整名称

```
    {    
        'jsccom': 'jsCom',
        'webcom': 'webCom',
        'p': 'page'
    }
```

### 方法

#### (static) asset.Asset.getContents（assetList, callback）

批量读取资源内容

* 返回 **Promise** 对象（可通过回调函数或者Promise完成异步回调）

#### asset.read()
读取资源原始内容

* 同步

#### asset.getContent(callback)

读取资源，并通过中间件处理后返回

* 异步
