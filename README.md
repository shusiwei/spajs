Single Page Application Framework Dependent on jQuery

spajs依赖于jQuery3

spajs模板引擎使用[doT.js]("http://olado.github.io/doT/)

该项目代码[托管在GitHub](https://github.com/shusiwei/spajs)上。

##阅读说明

```javascript
function(a, b[, c, d]) // 参数a, b 为必要参数，c, d为可选参数
a = string ['app'] // 参数a的数据类型为 string , 默认参数为'app'，* 代表必填参数, [] 代表参数默认值
// 这是里条注释 ['route/a', 'route/old/a'] // 参数书写范例（仅限 [ ] 括号中的内容）
```
##安装

###git

```bash
clone https://github.com/shusiwei/spajs.git
```
###bower

```bash
bower install --save shusiwei/spajs
```

##使用（Use）
###页面引入

```html
<link rel="stylesheet" type="text/css" href="../js/spa.css"></link>
<script type="text/javascript" src="./js/spa.js"></script>
```

###AMD&CMD
```javascript
// 引入SPA模块
var SPA = require('spa');
```

###初始化
```javascript
// 构建SPA应用
var APP = new SPA(project, config);

// 构建路由
var routes = APP.router(basePath);

// 添加路由规则
routes.push(routeName[, escape, preset, uri, templ, options]);

// 应用开始
APP.start(container[, storage, callback]);
```

###结果

```javascript
APP = {
  App : new WebApp = {
    ......(storage)<i>// 全局存储</i>,
    request(hash, state, source, data),
    redirect(hash, state, data),
    compile(templ, data),
    define(key, value),
    exec(callback)
  },
  project : project,
  version : '3.0.0',
  routes : new Router = {
    'routeNameA' : {...},
    'routeNameB' : {...},
    'routeNameC' : {...}
  }
}
```

###class SPA （SPA 类）

####constructor (构造函数)

```javascript
constructor(project, config);

var APP = new SPA('project_name', {});

* project = string <i>// 项目名称（英文）</i>
* config = {
    prefix : string ['#!'] <i>// hash前缀</i>
    * name : string <i>// 项目名称（中文）</i>
    * version : 'string' <i>// 版本号 [a.b.c]</i>
    root : string ['./project/'] <i>// 项目根目录</i>
    apiType : string ['post'] <i>// 接口方法['post'/'get']</i>
    apiDataType : string ['json'] <i>// 接口数据类型</i>
    apiData : object [{}] <i>// 默认传输的数据</i>
    apiDataKey : string ['data'] <i>// 接口数据key名</i>
    apiMsgKey : string ['msg'] <i>// 接口数据描述key名</i>
    apiCodeKey : string ['status'] <i>// 接口数据状态码key名</i>
    timeout : number [15000] <i>// 接口超时时间</i>
    imgDir : string [root + 'img'] <i>// 图片根目录</i>
    jsDir : string [root + 'js'] <i>// JS根目录</i>
    tplDir : string [root + 'tpl'] <i>// 模板根目录</i>
    * debug : boolean <i>// 是否为debug模式</i>
    lifeCycle : number [90e3] <i>// 页面生命周期</i>
  }
```
