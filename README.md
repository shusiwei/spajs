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
    ...... // 全局存储，storage对象,
    request(hash, state, source, data),
    redirect(hash, state, data),
    compile(templ, data),
    define(key, value),
    exec(callback)
  },
  project : project,
  version : '3.0.0',
  routes : new Router = {
    routeNameA : {...},
    routeNameB : {...},
    routeNameC : {...}
  }
}
```

###class SPA （SPA 类）

####constructor (构造函数)

```javascript
constructor(project, config);

var APP = new SPA('project_name', {});

* project = string // 项目名称（英文）
* config = {
    prefix : string ['#!'] // hash前缀
    * name : string // 项目名称（中文）
    * version : 'string' // 版本号 [a.b.c]
    root : string ['./project/'] // 项目根目录
    apiType : string ['post'] // 接口方法['post'/'get']
    apiDataType : string ['json'] // 接口数据类型
    apiData : object [{}] // 默认传输的数据
    apiDataKey : string ['data'] // 接口数据key名
    apiMsgKey : string ['msg'] // 接口数据描述key名
    apiCodeKey : string ['status'] // 接口数据状态码key名
    timeout : number [15000] // 接口超时时间
    imgDir : string [root + 'img'] // 图片根目录
    jsDir : string [root + 'js'] // JS根目录
    tplDir : string [root + 'tpl'] // 模板根目录
    * debug : boolean // 是否为debug模式
    lifeCycle : number [90e3] // 页面生命周期
  }
```

####router (路由)

```javascript
router(basePath);

var routes = APP.router('http://api.domain.com/');

* basePath = string ['/'] // 接口根目录

返回一个路由集合对象 routes，路由中的相对路径的API地址都会默认在前面加上 http://api.domain.com/;
```

####路由规则
#####路由集合对象提供push方法可以增加新的路由规则，没有定义路由也能访问hash解析的页面

```javascript
routes.push(routeName[, uri, escape, preset, options]);

* routeName = string // 路由路径 [路径 : 'news/article' 或 路径+参数 : 'news/article?:id'] 按参数多少匹配，由少至多匹配
uri = string // api地址 ['list.php']，支持相对&绝对
escape = array // 参数转换 ['apiParam => urlParam', 'apiParam1 => urlParam1']，如url为 #!id=18，escape = ['shop_id => id']，那么在接口中会以 'api.php?shop_id=18' 的形式传参
preset = string // 参数预设 ['key=value&key=value']，如：url为 #!id=18&a=9，preset = 'a=1&b=2'，那么在接口中会以 'api.php?id=18&a=9&b=2' 的形式传参
options = { // 其它选项
  observer : boolean [false] // 永远保持强制刷新
  redirect : function(webview, App) { // 重定向
    return '#!new/hash/url' // 返回重定向的地址
  }
  proxy : function(response, webview, App) { // API数据代理
    ... // 代码块
  }
  render ：function(render, webview, App) { // 渲染数据重组
    ... // 代码块

    return { // 返回的对象，此对象最终会与API传回的数据合并
      key : value
    }
  }
  status : * // 重定义页面正确的数据状态码
  alias : string/array // 路由别名 ['route/a', 'route/old/a']
}
```
