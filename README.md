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
路由集合对象提供push方法可以增加新的路由规则，没有定义路由也能访问hash解析的页面

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

####start （开始）

执行此方法，SPA开始构建App，并加载显示页面

```javascript
APP.start(container[, storage, callback]);

* container = element // webview容器
storage = object // App全局存储
callback = { // 回调
  onReady : function(App) // 初始化成功
  onTransition : function(webview, App) // 页面跳转回调
}
```

###APP.controller(window.App) 应用控制器

SPA构建后最终得到的是controller对象，controller基于WebApp类构建，它会以App的名称暴露在window中，controller本身成员对象是APP中的storage，以存储APP中所需要的值或方法

controller提供了一些方法

```javascript
controller.compile(templ[, data]) // 渲染将一个模板字符串转代为html字符串
如 ： controller.compile('模板字符串', {渲染数据});

* templ = string // 模板字符串
data = object // 渲染数据
```

```javascript
controller.define([key, value]) // 定义一个值
如 ： controller.define('name', 'uhuibao'); // {name : 'uhuibao'}

key = string // 值的名称
value = * // 保存的值
// 如果没有参数，则得到整个被保存的数据
```

```javascript
controller.exec(callback) // 回调一个传入webview对象的函数
如 ：controller.exec(function(webview) {});

* callback = function // 值的名称
```

```javascript
controller.request(hash[, state, source, data]) // 请求一个新的页面
如 ：controller.request('#!index');

* hash = string // 带有hash的url地址
state = number [当hash等于当前的hash的时候，默认值为 0，否则为 1] // 拉入历史记录类型，0:自动 1:替换历史 2:拉入历史 3:不拉入历史
source = number // 页面跳转类型 0:打开页面 1:链接跳转 2:历史跳转
data = object // 页面默认的渲染数据
```

```javascript
controller.redirect(hash[, state, data]) // 为页面做一个次url重定向跳转
如 ：controller.redirect('#!index');

* hash = string // 带有hash的url地址
state = number [1] // 此参数参考controller.request
data = object // 此参数参考controller.request
```

```javascript
controller.replaceState(hash) // 替换当前页面的url/hash地址
如 ：controller.replaceState('#!index');

* hash = string // 带有hash的url地址
```

```javascript
controller.pushState(hash) // 加入新的url/hash地址
如 ：controller.pushState('#!index');

* hash = string // 带有hash的url地址
```

###WebView 页面视图

spajs中，每个页面都是独立的webview对象，webview基于WebView类构建

webview保存着页面中的所有信息

```javascript
$webview : jQuery DOM // 页面容器
hash : string // 页面的hash地址
path : string // 页面的路径
prop : { // 页面中的静态属性
  count : 0 // 页面打开次数
  scrollY : 0 // 滚动条位置
  status : "active" // 页面状态
  timer : 0 // 页面挂起后的计时
}
query : object/null // 页面url中的参数，如果没有参数，则为null
render : object // 渲染页面的数据
route : object // 页面使用的路由规则，请参考<b>Router</b>
runtime : {
  callback : function(webview, App) // 页面加载完的回调函数
  dataXHR : xhr // 数据加载xhr对象
  destroy : Array // 页面销毁时执行的函数集合
  enter : Array // 页面进入时执行的函数集合
  leave : Array // 页面离开时执行的函数集合
  tplXHR : xhr // 模板加载xhr对象
}
search : string ['none'] // 页面url中的查询参数字符串
state : object // 页面数据储存，每次页面销毁时此对象也将被销毁
templ : array // 页面包含的模版字符串
```

webview提供了一此操作页面的方法

```javascript
webview.on(type, fn) // 页面事件绑定，分别是页面进入时，页面离开时，页面销毁时

* type = string // webview绑定的事件，enter:页面进入时 leave:页面离开时 die:页面销毁时
* fn = function // 触发事件后执行的函数
```

```javascript
webview.setState([key, value]) // 为webview.state设直一个值
如 webview.setState('name', 'uhuibao');
如 webview.setState('name'); // 'uhuibao'
如 webview.setState({a : 1, b : 2}); // {name : 'uhuibao', a : 1, b : 2}
如 webview.setState({a : 3, b : 4}, {c : 5, d : 6}); // {name : 'uhuibao', a : 3, b : 4, c : 5, d : 6}
如 webview.setState(); // {name : 'uhuibao', a : 3, b : 4, c : 5, d : 6}

key = string/object // 值的名称，当key是一个对象时，则保存整个对象，同时此方法后面的参数也只能为1个或多个对象，当key是一个字符串时，value为要保存的值，如果value参数没有，则返回webview.state[key]的值
value = * // 保存的值
// 如果没有任何参数时，则返回整个webview.state
```


###Template 模板

spajs模板引擎使用[doT.js](http://olado.github.io/doT/)

页面中的链接可以使用两种方式

```html
<a href="#!index">
<a data-hash="index">
```

```html
页面链接可以通过data-hash与data-state属性定义拉入历史记录类型 // 参考 APP.controller.request 方法
如：<a data-hash="index" data-sate="1">
或又如：<a data-hash="index" data-sate="3">

页面链接可以通过data-rel属性定义快捷链接 // home:首页 back:后退 forward:前进 refresh:刷新
如：<a data-rel="home">
或又如：<a data-rel="back">
```

SPA默认暴露的渲染数据有

```html
{{=it.PROJECT_NAME}} // 项目名称
{{=it.PROJECT_DIR}} // 项目目录
{{=it.IMG_DIR}} // 图像目录
{{=it.JS_DIR}} // JS目录
{{=it.HASH_PREFIX}} // hash前缀
```

自定义的模版标签有

```html
{{#header}}{{header#}} // 生成 <header class="page-header backdrop"></header>
{{#container}}{{container#}} // <div class="page-container"></div>
{{#title#}} // <span class="page-title">{{=it.TITLE}}</span>
{{#title}}{{title#}} // <span class="page-title"></span>
{{#back#}} // <a data-rel="back" class="app-ui-icon app-icon-back icon back"></a>
{{#forward#}} // <a data-rel="forward" class="app-ui-icon app-icon-forward icon forward"></a>
{{#home#}} // <a data-rel="home" class="app-ui-icon app-icon-home icon home"></a>
```

template 标签属性

```html
<template data-title="标题文字"> // 页面标题
```

###API 接口

spajs 数据基于接口 ajax，接口返回的数据必须遵守以下格式，key名的修改请参照 #SPA 构造函数#

```javascript
{
  status : number/string/boolean [1] // 状态码
  msg : string // 状态描述
  data : { // 接口数据，值必须为一个object对象
    status : 0  // 当求一个绝对数据如：?id=8，而数据库中不存在id为8的数据，此时应该返回空数据，此时则需要status为0，webview将会跳转到404页面
  }
}
```
