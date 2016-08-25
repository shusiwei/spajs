/* 
 * Raspberry.js
 * Description : a relaxed javascript framework for Single Page Application WebApp,it relies on jQuery(zepto).
 * Coder : shusiwei
 * Date : 2016-07-21
 * Version : 2.7.21
 *
 * https://github.com/shusiwei/raspberry
 * Licensed under the MIT license.
 */
;(function(global, factory, template) {
    'use strict';

    // 此为单例模式
    if (global.spajs) return global.spajs;

    // CMD接口
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
            return factory(global, $, template(global));
        });
    } else if (typeof define === 'function' && define.cmd) {
        define(function(require, exports, module) {
            module.exports = factory(global, require('jquery'), template(global));
        });
    } else {
        global.SPA = factory(global, global.jQuery, template(global));
    };
})(window, function(global, $, doT) {
    'use strict';

    const isType = function(type, obj) {
            let proto = Object.prototype.toString.call(obj).toLowerCase().slice(8, -1);

            switch (type) {
                case 'undefined' :
                        return obj === undefined;
                    break;

                case 'null' :
                        return obj === null;
                    break;

                case 'object' :
                        return obj && proto === type;
                    break;

                case 'number' :
                case 'array' :
                case 'string' :
                case 'function' :
                case 'boolean' :
                        return proto === type;
                    break;

                default :
                        return false;
                    break;
            };
        },
        isUndefined = function() {
            return arguments[0] === undefined;
        },
        isNull = function() {
            return arguments[0] === null;
        },
        isObject = function() {
            return isType('object', arguments[0]);
        },
        isNumber = function() {
            return isType('number', arguments[0]);
        },
        isArray = function() {
            return isType('array', arguments[0]);
        },
        isString = function() {
            return isType('string', arguments[0]);
        },
        isFunction = function() {
            return isType('function', arguments[0]);
        },
        isBoolean = function() {
            return isType('boolean', arguments[0]);
        },
        inString = function() {
            return arguments[0].indexOf(arguments[1]) > -1;
        },
        defineProp = (function() {
            let parseDescriptor = function(source) {
                    let data = {};

                    for (let key in source[1]) {
                        Object.defineProperty(data, key, $.extend({
                            value : source[1][key]
                        }, source[2]));
                    };

                    return {
                        value : data
                    };
                };

            return function(target) {
                for (let i = 1, length = arguments.length; i < length; i++) {
                    for (let key in arguments[i]) {
                        let descriptor;

                        if (isObject(arguments[i][key])) {
                            descriptor = {
                                value : defineProp({}, arguments[i][key])
                            };
                        } else if (isArray(arguments[i][key]) && arguments[i][key].length === 3 && arguments[i][key][0] === 'descriptor') {
                            if (isObject(arguments[i][key][1])) {
                                descriptor = parseDescriptor(arguments[i][key]);
                            } else {
                                descriptor = $.extend({
                                    value : arguments[i][key][1]
                                }, arguments[i][key][2]);
                            };
                        } else {
                            descriptor = {
                                value : arguments[i][key]
                            };
                        };

                        Object.defineProperty(target, key, descriptor);
                    };
                };

                return target;
            };
        })(),
        query2json = function() {
            let queryStr = global.location.search.split('?').pop(),
                queryKey;

            // 如果queryStr不符合query的格式但符合key的格式，那么queryStr就代表key
            switch (arguments.length) {
                case 1 :
                        if (isString(arguments[0]) && inString(arguments[0], '=')) {
                            queryStr = arguments[0];
                        } else if (isArray(arguments[0]) || (isString(arguments[0]) && !inString(arguments[0], '='))) {
                            queryKey = arguments[0];
                        };

                    break;

                case 2 :
                    queryStr = arguments[0],
                    queryKey = arguments[1];

                    break;
            };

            if (!queryStr || !inString(queryStr, '=')) return null;

            let data = defineProp({}, {
                    length : ['descriptor', 0, {
                        writable : true
                    }]
                });

            $.each(queryStr.split('&'), function(index, param) {
                let paramArr = param.split('=');
                if (paramArr.length === 2) {
                    data[paramArr[0]] = paramArr[1];
                    data.length ++;
                };
            });

            if (isString(queryKey)) {
                return data[queryKey];
            } else if (isArray(queryKey)) {
                return (function(keyArr, result) {
                    $.each(keyArr, function(index, name) {
                        result[name] = data[name];
                        result.length ++;
                    });

                    return result;
                })(queryKey, defineProp({}, {
                    length : ['descriptor', 0, {
                        writable : true
                    }]
                }));
            } else if (queryKey === undefined) {
                return data;
            };
        },
        getRandomStamp = (function(stampArr) {
            let stampLen = stampArr.length;

            return function(length, repeat) {
                length = length || 16;

                let stamp = '';

                for (let i = 0; i < length; i++) {
                    let rnd = stampArr[Math.floor(Math.random() * stampLen)];
                    if (!repeat) {
                        while (stamp.indexOf(rnd) === -1) stamp += rnd;
                    } else {
                        stamp += rnd;
                    };
                };

                return stamp;
            };
        })([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']);

    class SPA {
        constructor (project, config) {
            this.project = project;
            this.version = '3.0.0';

            // 基本配置
            let HASH_PREFIX = config.prefix || '#!',
                HASH_LENGTH = HASH_PREFIX.length,

                // 项目相关信息
                PROJECT_NAME = config.name || this.project,
                PROJECT_VER = config.version || getRandomStamp(),
                PROJECT_DIR = config.root ? config.root : './project/',

                // 页面请求相关配置
                API_TYPE = config.apiType || 'post',
                API_DATA_TYPE = config.apiDataType || 'json',
                API_DATA = config.apiData || {},
                API_DATA_KEY = config.apiDataKey || 'data',
                API_MSG_KEY = config.apiMsgKey || 'msg',
                API_CODE_KEY = config.apiCodeKey || 'status',
                TIME_OUT = config.timeout || 15e3,

                // 页面资源相关配置
                IMG_DIR = PROJECT_DIR + (config.imgDir || 'img'),
                JS_DIR = PROJECT_DIR + (config.jsDir || 'js'),
                TPL_DIR = PROJECT_DIR + (config.tplDir || 'tpl'),
                TPL_EXT_NAME = config.debug === true ? '.tpl' : '-' + PROJECT_VER + '.tpl',
                JS_EXT_NAME = config.debug === true ? '.js' : '-' + PROJECT_VER + '.js',

                // 默认主页的HASH
                HOME_HASH = HASH_PREFIX + (config.homeHash || 'index'),

                // 页面自动销毁的时间
                AUTO_DIE_TIME = config.lifeCycle || 90e3;

            this.config = {
                PROJECT_NAME,
                PROJECT_DIR,
                PROJECT_VER,
                HASH_PREFIX,
                HASH_LENGTH,
                API_TYPE,
                API_DATA_TYPE,
                API_DATA,
                API_DATA_KEY,
                API_MSG_KEY,
                API_CODE_KEY,
                IMG_DIR,
                JS_DIR,
                TPL_DIR : TPL_DIR + '/',
                TPL_EXT_NAME,
                JS_EXT_NAME,
                HOME_HASH,
                TIME_OUT,
                AUTO_DIE_TIME
            };
        }
        router (basePath = '/') {
            const getURI = function(uri) {
                    if (!isString(uri)) {
                        return null;
                    } else if (uri.indexOf('http') === 0 || uri.indexOf('//') === 0 || uri.indexOf('/') === 0) {
                        return uri;
                    } else {
                        return basePath + uri;
                    };
                },
                cloneRoute = function(route, name) {
                    return $.extend({}, route, {name : name});
                };

            class Router {
                push (name, ...options) {
                    let routeArr = name.split('?:'),
                        route = this[name] = {
                            name : routeArr[0],
                            param : routeArr[1] ? routeArr[1].split(':') : null,
                            path : routeArr[1] ? arguments[0].replace(/\?/, '/').replace(/:/g, '~') : routeArr[0],
                            uri : null
                        };

                    for (let option of options) {
                        if (isString(option)) {
                            if (option.slice(0, 9) === '<template') {
                                route.templ = option;
                            } else if (inString(option, '=')) {
                                route.preset = query2json(option);
                            } else {
                                route.uri = getURI(option);
                            };
                        } else if (isArray(option)) {
                            let routeEscape = route.escape = {};

                            for (let str of option) {
                                let strArr = str.split(' => ');
                                routeEscape[strArr[1]] = strArr[0];
                            };
                        } else if (isObject(option)) {
                            if (isFunction(option.redirect)) route.redirect = option.redirect;
                            if (isBoolean(option.observer)) route.observer = option.observer;
                            if (isFunction(option.proxy)) route.proxy = option.proxy;
                            if (option.hasOwnProperty('status')) route.status = option.status;
                            if (isFunction(option.render)) route.render = option.render;

                            if (isString(option.alias)) {
                                this[option.alias] = cloneRoute(route, option.alias);
                            } else if (isArray(option.alias)) {
                                for (let alias of option.alias) {
                                    this[alias] = cloneRoute(route, alias);
                                };
                            };
                        };
                    };

                    return this;
                }
            };

            return this.routes = new Router();
        }
        start(container, storage = {}, callback = {}) {
            let activeView = null;
            const // 全局对象
                [document, location, history, sessionStorage] = [global.document, global.location, global.history, global.sessionStorage],
                [project, routes] = [this.project, this.routes],
                {PROJECT_NAME, PROJECT_DIR, PROJECT_VER, HASH_PREFIX, HASH_LENGTH, API_TYPE, API_DATA_TYPE, API_DATA, API_DATA_KEY, API_MSG_KEY, API_CODE_KEY, IMG_DIR, JS_DIR, TPL_DIR, TPL_EXT_NAME, JS_EXT_NAME, HOME_HASH, TIME_OUT, AUTO_DIE_TIME} = this.config,

                // 错误页模板
                tplRegex = [/{{#header}}/, /{{header#}}/, /{{#container}}/, /{{container#}}/, /{{#title#}}/, /{{#back#}}/, /{{#forward#}}/, /{{#home#}}/, /{{#title}}/, /{{title#}}/],
                tplRepStr = [document.body.style.hasOwnProperty('webkitBackdropFilter') ? '<header class="page-header backdrop">' : '<header class="page-header">', '</header>', '<div class="page-container">', '</div>', '<span class="page-title">{{=it.TITLE}}</span>', '<a data-rel="back" class="app-ui-icon app-icon-back icon back"></a>', '<a data-rel="forward" class="app-ui-icon app-icon-forward icon forward"></a>', '<a data-rel="home" class="app-ui-icon app-icon-home icon home"></a>', '<span class="page-title">', '</span>'],
                errorTpl = [tplRepStr[0] + tplRepStr[4] + tplRepStr[5] + tplRepStr[1] + tplRepStr[2] +'<div class="app-error"><p class="app-error-desc app-ui-icon app-icon-{{?it.icon}}{{=it.icon}}{{??}}x404{{?}}">{{=it.desc}}{{?it.refresh===true}}，请<a data-rel="refresh" class="refresh app-ui-icon app-icon-refresh">刷新重试</a>{{?}}</p></div>' + tplRepStr[3]],

                routesKeys = Object.keys(routes),
                constant = {},
                cache = {},

                // 更新视图
                updateView = (function() {
                    let current = null,
                        clear = function(webview) {
                            // 当页面为第一次载入或页面进入死循环跳转的时候
                            if (current === null || current === webview) return webview;

                            current.pause();

                            return webview;
                        };

                    return function(webview) {
                        // 清空原有的视图
                        return current = clear(webview).appendTo(container);
                    };
                })(),
                // 改变页面操作状态
                updateStatus = (function() {
                    let spinner = document.createElement('div'),
                        mask = document.createElement('b'),
                        loader = document.createElement('i'),
                        classList = spinner.classList,
                        status = true, // true为可操作页面,false为不可操作页面

                        // 禁用事件
                        preventEvent = function(evt) {
                            evt.preventDefault();
                        },
                        spinToggle = function(type) {
                            if (type === false) {
                                global.addEventListener('scroll', preventEvent, false);
                                document.body.addEventListener('touchmove', preventEvent, false);
                                classList.add('animated');
                            } else if (type === true) {
                                global.removeEventListener('scroll', preventEvent, false);
                                document.body.removeEventListener('touchmove', preventEvent, false);
                                classList.remove('animated');
                            };
                        };

                    spinner.className = 'app-spinner';
                    spinner.appendChild(mask);
                    spinner.appendChild(loader);
                    document.body.appendChild(spinner);

                    return function(type) {
                        if (type !== status) spinToggle(status = type);
                    };
                })();

            class WebApp {
                static isValidHash(hash) {
                    return hash && hash.slice(0, HASH_LENGTH) === HASH_PREFIX;
                }
                // 页面中是还包含有缓存模板
                static hasTpl(path) {
                    return cache[path] !== undefined && cache[path]._tpl !== undefined;
                }
                // 路由规则匹配
                // 系统会按定义的顺序依次匹配路由规则，一旦匹配到的话，就会定位到路由定义中的控制器和操作方法去执行（可以传入其他的参数），并且后面的规则不会继续匹配。
                static routeMatch(name, query) {
                    let route;

                    // 如果一个路径使用的是别名，那么就转向到真正的路由下面
                    if (routes.hasOwnProperty(name)) name = routes[name].name;

                    for (let key of routesKeys) {
                        let data = routes[key];

                        if (data.name === name) {
                            if (data.param === null) {
                                route = data;
                            } else if (data.param && query) {
                                let length = data.param.length;

                                for (let param of data.param) {
                                    if (query.hasOwnProperty(param)) if (-- length === 0) {return data};
                                };
                            };
                        };
                    };

                    return route;
                }
                static queryMatch(temp, escapes, preset) {
                    if (temp === null) {
                        if (preset !== undefined) {
                            return preset;
                        } else {
                            return temp;
                        };
                    } else {
                        let query = {};

                        // 复制一份预设
                        if (preset !== undefined) {
                            for (let key in preset) {
                                query[key] = preset[key];
                            };
                        };

                        // 转换参数名
                        if (escapes !== undefined) {
                            for (let key in temp) {
                                if (escapes.hasOwnProperty(key)) {
                                    query[escapes[key]] = temp[key];
                                } else {
                                    query[key] = temp[key];
                                };
                            };
                        } else {
                            for (let key in temp) {
                                query[key] = temp[key];
                            };
                        };
                        
                        return query;
                    };
                }
                // 解析HASH
                static parseHash(hash) {
                    let hashArr = hash.slice(HASH_LENGTH).split('?'),
                        routeName = hashArr[0],
                        search = hashArr[1] ? hashArr[1] : 'none',
                        tempQuery = hashArr[1] ? query2json(hashArr[1]) : null,
                        tempRoute = WebApp.routeMatch(routeName, tempQuery),
                        rules = {
                            search : search,
                            hash : hash,
                            query : tempQuery
                        };

                    if (tempRoute === undefined) {
                        rules.path = routeName;
                        rules.route = {
                            uri : null,
                            params : ['descriptor', tempQuery, {
                                enumerable : true
                            }],
                            redirect : null,
                            proxy : null,
                            status : 1,
                            observer : false,
                            render : null,
                            templ : null
                        };
                    } else {
                        rules.path = tempRoute.path;
                        rules.route = {
                            uri : tempRoute.uri || null,
                            params : ['descriptor', WebApp.queryMatch(tempQuery, tempRoute.escape, tempRoute.preset), {
                                enumerable : true
                            }],
                            redirect : tempRoute.redirect || null,
                            observer : tempRoute.observer || false,
                            templ : tempRoute.templ || null,
                            proxy : tempRoute.proxy || null,
                            status : tempRoute.hasOwnProperty('status') ? tempRoute.status : 1,
                            render : tempRoute.render || null
                        };
                    };
                    
                    return rules;
                }
                static getWebView(hash, source, data) {
                    let webview,
                        location = WebApp.parseHash(hash),
                        path = location.path,
                        search = location.search;

                    // tpl是否存在于缓存
                    if (!cache.hasOwnProperty(path)) cache[path] = {};
                    if (!cache[path].hasOwnProperty(search)) {
                        webview = cache[path][search] = new WebView(location, data);
                    } else {
                        webview = cache[path][search];

                        // 如果webview状态是暂停，则重新标注状态为"恢复"
                        if (webview.prop.status === 'pending') webview.prop.status = 'restore';

                        if (webview.prop.status === 'destroy') { // 如果此webview已经被注销
                            // 重新创建一个webview容器并更新
                            webview.create(data);
                        } else if (source === 1) { // 如果此页状态还未被注销，并且此页来源于链接
                            // 页面包含这个webview的时候，先进行销毁，避免内存泄漏,然后返回这个webview数据
                            // 重新创建一个webview容器并更新
                            webview.off().destroy().create(data);
                        } else if (source === 2 && webview.route.observer === true) {
                            webview.off().destroy().create(data);
                        };
                    };

                    // 返回一个页面视图
                    return webview;
                }
                // 更新title
                static updateTitle(title) {
                    document.title = title || '页面加载中…';
                }
                // 过渡动画
                static transition(webview, title) {
                    // 更新新的视图
                    updateView(webview);

                    // 更新页面title
                    WebApp.updateTitle(title);

                    // 启用页面状态
                    updateStatus(true);

                    if (callback.onTransition) callback.onTransition(webview, self);
                }
                constructor() {
                    const self = this;

                    if (isObject(storage)) for (let key in storage) this[key] = storage[key];

                    this.version = PROJECT_VER;

                    this.define('PROJECT_NAME', PROJECT_NAME);
                    this.define('PROJECT_DIR', PROJECT_DIR);
                    this.define('IMG_DIR', IMG_DIR);
                    this.define('JS_DIR', JS_DIR);
                    this.define('HASH_PREFIX', HASH_PREFIX);

                    // 初始化SPA，工作开始
                    // 绑定onhashchange事件
                    global.addEventListener('popstate', function(evt) {
                        if (location.hash !== activeView.hash && WebApp.isValidHash(location.hash)) return self.request(location.hash, 0, 2);
                    }, false);

                    // 绑定点击事件
                    $(document.body).on('click', 'a[href^="'+ HASH_PREFIX +'"]', function(evt) {
                        evt.preventDefault();
                        return self.request(this.getAttribute('href'), this.dataset.state ? parseInt(this.dataset.state) : undefined);
                    }).on('click', '[data-hash]', function(evt) {
                        evt.preventDefault();
                        return self.request(HASH_PREFIX + this.dataset.hash, this.dataset.state ? parseInt(this.dataset.state) : undefined);
                    }).on('click', 'a[data-rel]', function(evt) {
                        evt.preventDefault();

                        switch (this.dataset.rel) {
                            case 'back' :
                                return history.back();

                            case 'forward' :
                                return history.forward();

                            case 'refresh' :
                                return self.redirect(location.hash);

                            case 'home' :
                                return self.request(HOME_HASH);
                        };
                    });

                    if (callback.onReady) callback.onReady(this);

                    // 初始化页面
                    if (WebApp.isValidHash(location.hash)) {
                        this.request(location.hash, 0, 0);
                    } else {
                        this.request(HOME_HASH, 1);
                    };
                }
                // 开始请求页面
                // state : 拉入历史记录类型
                //         0 ：自动添加
                //         1 : 替换历史
                //         2 : 拉入历史
                //         3 : 不拉入历史
                // source : 页面跳转类型
                //         0：打开页面
                //         1：链接跳转
                //         2：历史跳转
                request(hash, state, source, data) {
                    // 停止上一个未完成的ajax请求
                    if (activeView) activeView.stopRequest();

                    // 得到并设定history接入的类型
                    state = state === undefined ? (location.hash === hash ? 0 : 2) : state;

                    if (arguments.length === 3 && isObject(arguments[2])) {
                        source = undefined;
                        data = arguments[2];
                    };

                    // 如果此浏览窗口第一次打开页面且此页面非主页，那么将主页HASH替换成第一页HASH
                    if (source === 0 && sessionStorage.getItem(project) === null) {
                        // 把首页HASH替换当前历史记录
                        history.replaceState(null, null, HOME_HASH);
                        // 记录此浏览器窗口为首次打开页面
                        sessionStorage.setItem(project, true);

                        // 当首页HASH替换当前历史记录后，重新插入当前页的历史记录
                        if (hash !== HOME_HASH) history.pushState(null, null, hash);
                    };
                    
                    if (state === 1) history.replaceState(null, null, hash);
                    if (state === 2) history.pushState(null, null, hash);

                    let webview = activeView = WebApp.getWebView(hash, source === undefined ? 1 : source, data);
                    
                    // 如果需要预先处理一点东西
                    if (webview.route.redirect) {
                        let hash = webview.route.redirect(webview, this);
                        if (hash) return this.redirect(hash);
                    };

                    // 判断是还存在模板缓存
                    if (WebApp.hasTpl(webview.path)) {
                        if (webview.route.uri === null || webview.prop.status === 'restore') {
                            webview.applyData();
                        } else {
                            // 请求页面数据
                            webview.runtime.dataXHR = webview.ajaxData();
                        };
                    } else {
                        // 请求页面数据
                        if (webview.route.uri !== null) webview.runtime.dataXHR = webview.ajaxData();

                        if (webview.route.templ) {
                            // 应用路由中的模板字符串
                            webview.applyTpl(webview.route.templ).checkRequest();
                        } else if (webview.route.templ === null) {
                            // 请求回来新的模板
                            webview.runtime.tplXHR = webview.ajaxTpl();
                        };
                    };
                }
                redirect(hash, state, data) {
                    this.request(hash, isNumber(state) ? state : 1, data);
                }
                // 渲染带有数据的模版视图
                compile(templ, data) {
                    return doT.compile(templ)($.extend({}, data, this.define()));
                }
                define(key, value) {
                    switch (arguments.length) {
                        case 0 :
                            return constant;

                        case 1 :
                            return constant[key];

                        case 2 :
                            let temp = {};
                            temp[key] = ['descriptor', value, {
                                enumerable : true
                            }];

                            return defineProp(constant, temp, {});
                    };
                }
                exec(callback) {
                    callback(activeView, this)
                }
            };

            // WebView 类
            class WebView {
                static parseTpl(tplStr) {
                    let tplData = [],
                        title;

                    for (let i = 0, tplArr = tplStr.replace(/\r\n\s*/g, '').split('</template>'), tplArrLen = tplArr.length; i < tplArrLen; i++) {
                        let tempStr = tplArr[i];

                        // 如果模版字符为空，则跳过
                        if (tempStr.length === 0) continue;

                        let tmplStart = tempStr.indexOf('>') + 1,
                            tplStr = tempStr.slice(tmplStart);

                        // 获取模板主页信息
                        if (i === 0) {
                            title = tempStr.slice(0, tmplStart).match(/data-title="(.*)"/);
                            
                            // 替换模板
                            for (let j = 0, tplRegexLen = tplRegex.length; j < tplRegexLen; j++) {
                                if (inString(tplStr, tplRegex[j].source)) tplStr = tplStr.replace(tplRegex[j], tplRepStr[j]);
                            };
                        };

                        tplData.push(tplStr);
                    };

                    return {
                        tpl : tplData,
                        title : title ? title[1] : title
                    };
                }
                constructor(location, data) {
                    defineProp(this, location, {
                        runtime : {
                            enter : [],
                            leave : [],
                            destroy : [],
                            callback : ['descriptor', null, {
                                writable : true
                            }],
                            tplXHR : ['descriptor', null, {
                                writable : true
                            }],
                            dataXHR : ['descriptor', null, {
                                writable : true
                            }]
                        },
                        prop : {
                            status : ['descriptor', null, {
                                writable : true
                            }],
                            timer : ['descriptor', 0, {
                                writable : true
                            }],
                            count : ['descriptor', 0, {
                                writable : true
                            }],
                            scrollY : ['descriptor', 0, {
                                writable : true
                            }]
                        }
                    }).create(data);
                }
                create(data) {
                    // 将此wrapper拉到集合
                    let webview = document.createElement('div');

                    // 定义默认的wrapper样式
                    webview.className = 'app-page';

                    // 数据状态存储器
                    this.state = {};

                    // 重设渲染数据
                    this.render = data || null;

                    // 将wrapper设置webview的显示层
                    this.$webview = $(webview);

                    // 所有新开的页面的状态初始都是active
                    this.prop.status = 'ready';

                    // 所有新开的页面的timer都从0开始
                    this.prop.timer = 0;

                    // 所有新开页面的计数都为0
                    this.prop.count = 0;

                    // 所有新开的页面的滚动条位置都为0
                    this.prop.scrollY = 0;

                    return GC.push(this);
                }
                on(type, fn) {
                    let runtime = this.runtime;

                    switch (type) {
                        case 'enter' :
                            fn();
                            runtime.enter.push(fn);
                            break;

                        case 'leave' :
                            runtime.leave.push(fn);
                            break;

                        case 'die' :
                            runtime.destroy.push(fn);
                            break;
                    };

                    return this;
                }
                off() {
                    let runtime = this.runtime,
                        leaveArr = runtime.leave,
                        enterArr = runtime.enter;

                    // 运行runtime中的注销，并移除相关的runtime事件
                    // 挂起页面事件
                    for (let leaveFn of leaveArr) {
                        leaveFn();
                    };

                    leaveArr.splice(0, leaveArr.length);

                    // 如果这个页面会没有强制监视，则需要移除页面监听方法数组
                    if (this.route.observer === false) enterArr.splice(0, enterArr.length);

                    return this;
                }
                pause() {
                    // 暂停webview
                    for (let leaveFn of this.runtime.leave) {
                        leaveFn();
                    };

                    // webview改变状态为暂停
                    this.prop.status = 'pending';

                    // 设定滚动位置
                    this.prop.scrollY = global.scrollY;

                    // webview增加查看次数
                    this.prop.count ++;

                    this.$webview.detach();

                    return this;
                }
                destroy(deep) {
                    // 销毁webview
                    let destroyArr = this.runtime.destroy;

                    for (let destroyFn of destroyArr) {
                        destroyFn();
                    };

                    destroyArr.splice(0, destroyArr.length);

                    // 从页面中移除
                    this.$webview.remove();

                    // 更新状态为注销
                    this.prop.status = 'destroy';

                    // 清除页面回调脚本
                    this.runtime.callback = null;

                    return GC.remove(this);
                }
                // 检查请求状态
                checkRequest() {
                    // 如果有模板/数据请求任务没有结束，则退出
                    if (this.runtime.dataXHR !== null && this.runtime.tplXHR !== null) return;

                    // 开始应用数据
                    this.applyData();
                }
                // 终止页面请求
                stopRequest(desc, icon, refresh) {
                    // 禁用/恢复页面状态
                    updateStatus(desc ? true : false);

                    if (this.runtime.tplXHR) this.runtime.tplXHR.abort();
                    if (this.runtime.dataXHR) this.runtime.dataXHR.abort();

                    if (desc) {
                        if (this.render) return this.applyData(errorTpl);

                        // 定义出错时的渲染数据
                        this.render = {
                            desc : desc,
                            refresh : refresh,
                            icon : icon
                        };
                        this.applyData(errorTpl);
                    };
                }
                // ajax新的数据
                ajaxData() {
                    let that = this;

                    return $.ajax({
                        url : this.route.uri,
                        type : API_TYPE,
                        data : this.route.params ? $.extend({}, this.route.params, API_DATA) : API_DATA,
                        dataType : API_DATA_TYPE,
                        timeout : TIME_OUT
                    }).done(function(response) {
                        if (isFunction(that.route.proxy)) response = that.route.proxy(response, that, self);

                        if (response === undefined || response === null || response === false) {
                            return response;
                        } else if (response[API_CODE_KEY] === undefined) {
                            that.stopRequest('返回的数据无status');
                        } else if (response[API_CODE_KEY] === (that.route.status || 1)) {
                            if (response[API_DATA_KEY].status === 0) return that.stopRequest('您访问的页面不存在');
                            
                            // 将数据缓存
                            that.render = $.extend(that.render, response[API_DATA_KEY]);
                            that.checkRequest();
                        } else {
                            that.stopRequest(response[API_MSG_KEY] || '服务器发生未知错误', 'debug');
                        };
                    }).fail(function(xhr, status, c) {
                        switch (status) {
                            case 'error' :
                                switch (xhr.status) {
                                    case 404 :
                                        that.stopRequest('您访问的页面未找到');
                                        break;

                                    default :
                                        that.stopRequest('服务器发生错误', 'debug', true);
                                        break;
                                };
                                break;

                            case 'abort' :
                                that.stopRequest('页面请求被中止');
                                break;

                            case 'timeout' :
                                that.stopRequest('您的网络不给力', 'wifi-error', true);
                                break;

                            case 'parsererror' :
                                that.stopRequest('数据格式错误', 'debug');
                                break;
                        };
                    }).always(function() {
                        // xhr请求完成，销毁xhr对象
                        that.runtime.dataXHR = null;
                    });
                }
                // 应用数据
                applyData(templ) {
                    if (!this.templ) {
                        defineProp(this, {
                            templ : cache[this.path]._tpl
                        });
                    };

                    let tempData = this.render = this.render || {},
                        tempRender = this.route.render,
                        renderData,
                        title = cache[this.path]._title || self.define('PROJECT_NAME');

                    // 如果是一个被恢复且非监听的webview，则直接显示此webview
                    if (this.prop.status === 'restore') return WebApp.transition(this, title);

                    // 合并得到渲染数据
                    if (tempRender !== null) renderData = isFunction(tempRender) ? tempRender(tempData, this, self) : tempRender;

                    // 渲染模板
                    this.$webview.append(this.compile(templ || this.templ[0], renderData ? $.extend(tempData, renderData) : tempData, title));

                    // 执行过渡动画
                    WebApp.transition(this, title);
                }
                // ajax回来新的模板
                ajaxTpl() {
                    let that = this;

                    return $.ajax({
                        url : TPL_DIR + this.path + TPL_EXT_NAME,
                        type : 'GET',
                        dataType : 'html',
                        timeout : TIME_OUT
                    }).done(function(response) {
                        that.applyTpl(response).checkRequest();
                    }).fail(function(xhr, status) {
                        switch (status) {
                            case 'error' :
                                    that.stopRequest('您访问的页面不存在');
                                break;

                            case 'timeout' :
                                    that.stopRequest('您的网络不给力', 'wifi-error', true);
                                break;
                        };
                    }).always(function() {
                        // xhr请求完成，销毁xhr对象
                        that.runtime.tplXHR = null;
                    });
                }
                applyTpl(tplStr) {
                    // 得到模板代码并生成模板节点
                    let tplData = WebView.parseTpl(tplStr);

                    // 将模版节点缓存
                    cache[this.path]._tpl = tplData.tpl;

                    // 标记模板title
                    cache[this.path]._title = tplData.title;

                    return this;
                }
                compile(templ, data, title) {
                    return self.compile(templ, $.extend({
                        TITLE : title,
                        JS_FILE : this.path + JS_EXT_NAME
                    }, data));
                }
                exec(callback) {
                    switch (this.prop.status) {
                        case 'pending' :
                            this.runtime.callback = function() {
                                // 清空callback对象
                                this.runtime.callback = null;

                                // 执行页面回调
                                callback(this, self);
                            };
                            break;

                        case 'ready' :
                        case 'active' :
                        case 'restore' :
                            callback(this, self);
                            break;
                    };
                }
                appendTo(container) {
                    // 填充新的视图
                    this.$webview.appendTo(container);

                    // 如果此webivew状态为恢复             
                    if (this.prop.status === 'restore') {
                        // 如果有未成功执行的脚本，则运行该脚本
                        if (this.runtime.callback) this.runtime.callback();

                        // 则重置滚动条状态
                        global.scrollTo(0, this.prop.scrollY);

                        // 如果该webview非强制监视刷新，则在恢复后重新监听（强制监视刷新会在新开页面时执行监听）
                        for (let enterFn of this.runtime.enter) {
                            enterFn();
                        };
                    } else {
                        global.scrollTo(0, 0);
                    };

                    // 当前页面恢复状态为激活
                    this.prop.status = 'active';

                    // 重置注销时间
                    this.prop.timer = 0;

                    return this;
                }
                setState() {
                    if (arguments.length === 0) {
                        return this.state;
                    } else if (arguments.length === 1 && isString(arguments[0])) {
                        return this.state[arguments[0]];
                    }else if (arguments.length === 2 && isString(arguments[0])) {
                        this.state[arguments[0]] = arguments[1];
                    } else {
                        for (let object of arguments) {
                            $.extend(this.state, object);
                        };
                    };

                    return this.state;
                }
            };

            // 内存控制器
            const GC = new class {
                    constructor () {
                        let trashArr = this.trashArr = [],
                            interval = 45e2,
                            GCHanlder = function(webview) {
                                if (webview && webview.prop.status === 'pending') {
                                    if (webview.prop.timer >= AUTO_DIE_TIME + (webview.prop.count * interval)) {
                                        webview.off().destroy();
                                    } else {
                                        webview.prop.timer += interval;
                                    };
                                };
                            },
                            GCInterval = function() {
                                for (let webview of trashArr) {
                                    GCHanlder(webview);
                                };
                            },
                            GCTimer = setInterval(GCInterval, interval);
                    }
                    push(webview) {
                        this.trashArr.push(webview);
                        return webview;
                    }
                    remove(webview) {
                        this.trashArr.splice(this.trashArr.indexOf(webview), 1);
                        return webview;
                    }
                },
                self = this.controller = global.App = new WebApp();

            return this;
        }
    };

    return SPA;
}, function(global) {
    "use strict";

    var doT = {
        version: "1.0.3",
        templateSettings: {
            evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
            interpolate: /\{\{=([\s\S]+?)\}\}/g,
            encode:      /\{\{!([\s\S]+?)\}\}/g,
            use:         /\{\{#([\s\S]+?)\}\}/g,
            useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
            define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
            defineParams:/^\s*([\w$]+):([\s\S]+)/,
            conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
            iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
            varname:    "it",
            strip:      true,
            append:     true,
            selfcontained: false,
            doNotSkipEncoded: false
        },
        template: undefined, //fn, compile template
        compile:  undefined  //fn, for express
    };

    doT.encodeHTMLSource = function(doNotSkipEncoded) {
        var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" },
            matchHTML = doNotSkipEncoded ? /[&<>"'\/]/g : /&(?!#?\w+;)|<|>|"|'|\//g;
        return function(code) {
            return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : "";
        };
    };

    var startend = {
        append: { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
        split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=encodeHTML(" }
    }, skip = /$^/;

    function resolveDefs(c, block, def) {
        return ((typeof block === "string") ? block : block.toString())
        .replace(c.define || skip, function(m, code, assign, value) {
            if (code.indexOf("def.") === 0) {
                code = code.substring(4);
            }
            if (!(code in def)) {
                if (assign === ":") {
                    if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
                        def[code] = {arg: param, text: v};
                    });
                    if (!(code in def)) def[code]= value;
                } else {
                    new Function("def", "def['"+code+"']=" + value)(def);
                }
            }
            return "";
        })
        .replace(c.use || skip, function(m, code) {
            if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
                if (def[d] && def[d].arg && param) {
                    var rw = (d+":"+param).replace(/'|\\/g, "_");
                    def.__exp = def.__exp || {};
                    def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
                    return s + "def.__exp['"+rw+"']";
                }
            });
            var v = new Function("def", "return " + code)(def);
            return v ? resolveDefs(c, v, def) : v;
        });
    }

    function unescape(code) {
        return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
    }

    doT.template = function(tmpl, c, def) {
        c = c || doT.templateSettings;
        var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
            str  = (c.use || c.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

        str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ")
                    .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,""): str)
            .replace(/'|\\/g, "\\$&")
            .replace(c.interpolate || skip, function(m, code) {
                return cse.start + unescape(code) + cse.end;
            })
            .replace(c.encode || skip, function(m, code) {
                needhtmlencode = true;
                return cse.startencode + unescape(code) + cse.end;
            })
            .replace(c.conditional || skip, function(m, elsecase, code) {
                return elsecase ?
                    (code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
                    (code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
            })
            .replace(c.iterate || skip, function(m, iterate, vname, iname) {
                if (!iterate) return "';} } out+='";
                sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
                return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
                    +vname+"=arr"+sid+"["+indv+"+=1];out+='";
            })
            .replace(c.evaluate || skip, function(m, code) {
                return "';" + unescape(code) + "out+='";
            })
            + "';return out;")
            .replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
            .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
            //.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

        if (needhtmlencode) {
            if (!c.selfcontained && global && !global._encodeHTML) global._encodeHTML = doT.encodeHTMLSource(c.doNotSkipEncoded);
            str = "var encodeHTML = typeof _encodeHTML !== 'undefined' ? _encodeHTML : ("
                + doT.encodeHTMLSource.toString() + "(" + (c.doNotSkipEncoded || '') + "));"
                + str;
        }
        try {
            return new Function(c.varname, str);
        } catch (e) {
            if (typeof console !== "undefined") console.log("Could not create a template function: " + str);
            throw e;
        }
    };

    doT.compile = function(tmpl, def) {
        return doT.template(tmpl, null, def);
    };

    return doT;
});