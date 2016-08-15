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
        define(['jquery', 'wi'], function($, WI) {
            return factory(global, $, WI, template(global));
        });
    } else if (typeof define === 'function' && define.cmd) {
        define(function(require, exports, module) {
            module.exports = factory(global, require('jquery'), require('wi'), template(global));
        });
    } else {
        global.SPA = factory(global, global.jQuery, global.WI, template(global));
    };
})(window, function(global, $, WI, doT) {
    'use strict';

    const // 全局对象
        document = global.document,
        location = global.location,
        history = global.history,
        sessionStorage = global.sessionStorage,

        // 错误页模板
        tplRegex = [/{{#header}}/, /{{header#}}/, /{{#container}}/, /{{container#}}/, /{{#title#}}/, /{{#back#}}/, /{{#forward#}}/, /{{#home#}}/, /{{#title}}/, /{{title#}}/],
        tplRepStr = [document.body.style.hasOwnProperty('webkitBackdropFilter') ? '<header class="page-header backdrop">' : '<header class="page-header">', '</header>', '<div class="page-container">', '</div>', '<span class="page-title">{{=it.TITLE}}</span>', '<a data-rel="back" class="icon back"></a>', '<a data-rel="forward" class="icon forward"></a>', '<a data-rel="home" class="icon home"></a>', '<span class="page-title">', '</span>'],
        errorTpl = [tplRepStr[0] + tplRepStr[4] + tplRepStr[5] + tplRepStr[1] + tplRepStr[2] +'<div class="app-error"><p class="app-error-desc iconfont i-{{?it.icon}}{{=it.icon}}{{??}}x404{{?}}-bfo">{{=it.desc}}{{?it.refresh===true}}，请<a data-rel="refresh" class="refresh iconfont i-refresh-bfo">刷新重试</a>{{?}}</p></div>' + tplRepStr[3]],

        // SPA主程序
        SPA = function(container, config, routes, options) {
            let activeView = null;
            const self = this,

                routesKeys = Object.keys(routes),
                storage = this.storage = options.storage || {},
                constant = {},
                cache = {},

                isValidHash = function(hash) {
                    return hash && hash.slice(0, config.HASH_LENGTH) === config.HASH_PREFIX;
                },
                parseTpl = function(tplStr) {
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
                                if (WI.has(tplStr, tplRegex[j].source)) tplStr = tplStr.replace(tplRegex[j], tplRepStr[j]);
                            };
                        };

                        tplData.push(tplStr);
                    };

                    return {
                        tpl : tplData,
                        title : title ? title[1] : title
                    };
                },
                // 页面中是还包含有缓存模板
                hasTpl = function(path) {
                    return cache[path] !== undefined && cache[path]._tpl !== undefined;
                },
                // 路由规则匹配
                // 系统会按定义的顺序依次匹配路由规则，一旦匹配到的话，就会定位到路由定义中的控制器和操作方法去执行（可以传入其他的参数），并且后面的规则不会继续匹配。
                routeMatch = function(name, query) {
                    let route;

                    // 如果一个路径使用的是别名，那么就转向到真正的路由下面
                    if (routes.hasOwnProperty(name)) name = routes[name].name;

                    for (let i = 0, length = routesKeys.length; i < length; i++) {
                        let data = routes[routesKeys[i]];
                        
                        if (data.name === name) {
                            if (data.param === null) {
                                route = data;
                            } else if (data.param && query) {
                                for (let i = 0, paramLength = data.param.length, length = paramLength; i < paramLength; i++) {
                                    if (query.hasOwnProperty(data.param[i])) if (-- length === 0) {return data};
                                };
                            };
                        };
                    };

                    return route;
                },
                queryMatch = function(temp, escapes, preset) {
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
                },
                // 解析HASH
                getLocation = function(hash) {
                    let hashArr = hash.slice(config.HASH_LENGTH).split('?'),
                        routeName = hashArr[0],
                        search = hashArr[1] ? hashArr[1] : 'none',
                        tempQuery = hashArr[1] ? WI.query2json(hashArr[1]) : config.SEND_HASH ? {} : null,
                        tempRoute = routeMatch(routeName, tempQuery),
                        rules = {
                            search : search,
                            hash : hash,
                            query : tempQuery
                        };

                    // 如果需要发送HASH
                    if (config.SEND_HASH === true) tempQuery.hash = hash;

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
                            params : ['descriptor', queryMatch(tempQuery, tempRoute.escape, tempRoute.preset), {
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
                },
                // 更新title
                updateTitle = function(title) {
                    document.title = title || '页面加载中…';
                },
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
                })(),
                getWebView = function(hash, source, data) {
                    let webview,
                        location = getLocation(hash),
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
                },
                // 过渡动画
                transition = function(webview, title) {
                    // 更新新的视图
                    updateView(webview);

                    // 更新页面title
                    updateTitle(title);

                    // 启用页面状态
                    updateStatus(true);

                    if (options.onTransition) options.onTransition(webview);
                },
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
                request = this.request = function(hash, state, source, data) {
                    // 停止上一个未完成的ajax请求
                    if (activeView) activeView.stopRequest();

                    // 得到并设定history接入的类型
                    state = state === undefined ? (location.hash === hash ? 0 : 2) : state;

                    if (arguments.length === 3 && WI.is('object', arguments[2])) {
                        source = undefined;
                        data = arguments[2];
                    };

                    // 如果此浏览窗口第一次打开页面且此页面非主页，那么将主页HASH替换成第一页HASH
                    if (source === 0 && sessionStorage.getItem(config.PROJECT) === null) {
                        // 把首页HASH替换当前历史记录
                        history.replaceState(null, null, config.HOME_HASH);
                        // 记录此浏览器窗口为首次打开页面
                        sessionStorage.setItem(config.PROJECT, true);

                        // 当首页HASH替换当前历史记录后，重新插入当前页的历史记录
                        if (hash !== config.HOME_HASH) history.pushState(null, null, hash);
                    };
                    
                    if (state === 1) history.replaceState(null, null, hash);
                    if (state === 2) history.pushState(null, null, hash);

                    let webview = activeView = getWebView(hash, source === undefined ? 1 : source, data);
                    
                    // 如果需要预先处理一点东西
                    if (webview.route.redirect) {
                        let hash = webview.route.redirect(webview, storage);
                        if (hash) return redirect(hash);
                    };

                    // 判断是还存在模板缓存
                    if (hasTpl(webview.path)) {
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
                },
                redirect = this.redirect = function(hash, state, data) {
                    request(hash, WI.is('number', state) ? state : 1, data);
                },
                // 渲染带有数据的模版视图
                compile = this.compile = function(templ, data) {
                    return doT.compile(templ)($.extend({}, data, define()));
                },
                define = this.define = function(key, value) {
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

                            return WI.defineProp(constant, temp, {});
                    };
                };

            define('PROJECT_NAME', config.PROJECT_NAME);
            define('PROJECT_DIR', config.PROJECT_DIR);
            define('IMG_DIR', config.IMG_DIR);
            define('JS_DIR', config.JS_DIR);
            define('HASH_PREFIX', config.HASH_PREFIX);

            // WebView 类
            class WebView {
                constructor(location, data) {
                    WI.defineProp(this, location, {
                        runtime : {
                            listen : [],
                            pend : [],
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
                on(handler) {
                    let runtime = this.runtime;

                    if (WI.is('function', handler.listen)) {
                        handler.listen();

                        // 如果这个页面会被强制监视刷新，那么listen 数组将对此webview没有意义
                        if (this.route.observer === false) runtime.listen.push(handler.listen);
                    };
                    if (WI.is('function', handler.pend)) runtime.pend.push(handler.pend);
                    if (WI.is('function', handler.destroy)) runtime.destroy.push(handler.destroy);

                    return this;
                }
                off() {
                    let runtime = this.runtime,
                        pendArr = runtime.pend,
                        listenArr = runtime.listen,
                        pendArrLen = pendArr.length;

                    // 运行runtime中的注销，并移除相关的runtime事件
                    // 挂起页面事件
                    for (let i = 0; i < pendArrLen; i++) {
                        pendArr[i]();
                    };
                    pendArr.splice(0, pendArrLen);

                    // 如果这个页面会没有强制监视，则需要移除页面监听方法数组
                    if (this.route.observer === false) listenArr.splice(0, listenArr.length);

                    return this;
                }
                pause() {
                    // 暂停webview
                    for (let i = 0, pendArr = this.runtime.pend, pendArrLen = pendArr.length; i < pendArrLen; i++) {
                        pendArr[i]();
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
                    let destroyArr = this.runtime.destroy,
                        destroyArrLen = destroyArr.length;

                    for (let i = 0; i < destroyArrLen; i++) {
                        destroyArr[i]();
                    };
                    destroyArr.splice(0, destroyArrLen);

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
                    updateTitle();

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
                        type : config.API_TYPE,
                        data : this.route.params ? $.extend({}, this.route.params, config.API_DATA) : config.API_DATA,
                        dataType : config.API_DATA_TYPE,
                        timeout : config.TIME_OUT
                    }).done(function(response) {
                        if (WI.is('function', that.route.proxy)) response = that.route.proxy(response, that, storage, redirect);

                        if (response === undefined || response === null || response === false) {
                            return response;
                        } else if (response.status === undefined) {
                            that.stopRequest('返回的数据无status');
                        } else if (response.status === (that.route.status || 1)) {
                            if (response.render.status === 0) return that.stopRequest('您访问的页面不存在');
                            
                            // 将数据缓存
                            that.render = $.extend(that.render, response.render);
                            that.checkRequest();
                        } else {
                            that.stopRequest(response.msg || '服务器发生未知错误', 'debug');
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
                        WI.defineProp(this, {
                            templ : cache[this.path]._tpl
                        });
                    };

                    let tempData = this.render = this.render || {},
                        tempRender = this.route.render,
                        renderData,
                        title = cache[this.path]._title || define('PROJECT_NAME');

                    // 如果是一个被恢复且非监听的webview，则直接显示此webview
                    if (this.prop.status === 'restore') return transition(this, title);

                    // 合并得到渲染数据
                    if (tempRender !== null) renderData = WI.is('function', tempRender) ? tempRender(tempData, this, storage) : tempRender;

                    // 渲染模板
                    this.$webview.append(this.compile(templ || this.templ[0], renderData ? $.extend(tempData, renderData) : tempData, title));

                    // 执行过渡动画
                    transition(this, title);
                }
                // ajax回来新的模板
                ajaxTpl() {
                    let that = this;

                    return $.ajax({
                        url : config.TPL_DIR + this.path + config.TPL_EXT_NAME,
                        type : 'GET',
                        dataType : 'html',
                        timeout : config.TIME_OUT
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
                    let tplData = parseTpl(tplStr);

                    // 将模版节点缓存
                    cache[this.path]._tpl = tplData.tpl;

                    // 标记模板title
                    cache[this.path]._title = tplData.title;

                    return this;
                }
                compile(templ, data, title) {
                    return compile(templ, $.extend({
                        TITLE : title,
                        JS_FILE : this.path + config.JS_EXT_NAME
                    }, data));
                }
                exec(callback) {
                    switch (this.prop.status) {
                        case 'pending' :
                            this.runtime.callback = function() {
                                // 清空callback对象
                                this.runtime.callback = null;

                                // 执行页面回调
                                callback(this, $, WI, self);
                            };
                            break;

                        case 'ready' :
                        case 'active' :
                        case 'restore' :
                            callback(this, $, WI, self);
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
                        for (let i = 0, listenArr = this.runtime.listen, listenArrLen = listenArr.length; i < listenArrLen; i++) {
                            listenArr[i]();
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
                    } else if (arguments.length === 1 && WI.is('string', arguments[0])) {
                        return this.state[arguments[0]];
                    }else if (arguments.length === 2 && WI.is('string', arguments[0])) {
                        this.state[arguments[0]] = arguments[1];
                    } else {
                        for (let i = 0, length = arguments.length; i < length; i++) {
                            $.extend(this.state, arguments[0]);
                        };
                    };

                    return this.state;
                }
            };

            // 内存控制器
            const GC = (function(memoryArr) {
                    let interval = 45e2,
                        GCHanlder = function(index, webview) {
                            if (webview && webview.prop.status === 'pending') {
                                if (webview.prop.timer >= config.AUTO_DIE_TIME + (webview.prop.count * interval)) {
                                    webview.off().destroy();
                                } else {
                                    webview.prop.timer += interval;
                                };
                            };
                        },
                        GCInterval = function() {
                            for (let i = 0, length = memoryArr.length; i < length; i++) {
                                GCHanlder(i, memoryArr[i]);
                            };
                        },
                        GCTimer = setInterval(GCInterval, interval);

                        return {
                            push : function(webview) {
                                memoryArr.push(webview);
                                return webview;
                            },
                            remove : function(webview) {
                                memoryArr.splice(memoryArr.indexOf(webview), 1);
                                return webview;
                            }
                        };
                })([]),
                spajs = global.spajs = {
                    version : '2.7.21',
                    exec : function(callback) {
                        callback(activeView, $, WI, this);
                    }.bind(this)
                };

            // 初始化SPA，工作开始
            // 绑定onhashchange事件
            global.addEventListener('popstate', function(evt) {
                if (location.hash !== activeView.hash && isValidHash(location.hash)) return request(location.hash, 0, 2);
            }, false);

            // 绑定点击事件
            $(document.body).on('click', 'a[href^="'+ config.HASH_PREFIX +'"]', function(evt) {
                evt.preventDefault();
                return request(this.getAttribute('href'), this.dataset.state ? parseInt(this.dataset.state) : undefined);
            }).on('click', '[data-hash]', function(evt) {
                evt.preventDefault();
                return request(config.HASH_PREFIX + this.dataset.hash, this.dataset.state ? parseInt(this.dataset.state) : undefined);
            }).on('click', 'a[data-rel]', function(evt) {
                evt.preventDefault();

                switch (this.dataset.rel) {
                    case 'back' :
                        return history.back();

                    case 'forward' :
                        return history.forward();

                    case 'refresh' :
                        return redirect(location.hash);

                    case 'home' :
                        return request(config.HOME_HASH);
                };
            });

            if (options.onReady) options.onReady(this);

            // 初始化页面
            if (isValidHash(location.hash)) {
                request(location.hash, 0, 0);
            } else {
                request(config.HOME_HASH, 1);
            };

            return this;
        };

    SPA.config = function(project, config) {
        // 基本配置
        let HASH_PREFIX = config.prefix || '#!',
            HASH_LENGTH = HASH_PREFIX.length,

            // 项目相关信息
            PROJECT_NAME = config.name || project,
            PROJECT_VER = config.version || WI.getRandomStamp(),
            PROJECT_DIR = config.root ? config.root : './project/',

            // 页面请求相关配置
            API_TYPE = config.apiType || 'post',
            API_DATA_TYPE = config.apiDataType || 'json',
            API_DATA = config.apiData || {},
            TIME_OUT = config.timeout || 15e3,
            SEND_HASH = config.sendHash || false,

            // 页面资源相关配置
            IMG_DIR = PROJECT_DIR + (config.imgDir || 'img'),
            JS_DIR = PROJECT_DIR + (config.jsDir || 'js'),
            TPL_DIR = PROJECT_DIR + (config.tplDir || 'tpl'),
            TPL_EXT_NAME = PROJECT_VER === '{{version}}' ? '.tpl' : '-' + PROJECT_VER + '.tpl',
            JS_EXT_NAME = PROJECT_VER === '{{version}}' ? '.js' : '-' + PROJECT_VER + '.js',

            // 默认主页的HASH
            HOME_HASH = HASH_PREFIX + (config.homeHash || 'index'),

            // 页面自动销毁的时间
            AUTO_DIE_TIME = config.lifeCycle || 90e3;

        return {
            PROJECT : project,
            PROJECT_NAME,
            PROJECT_DIR,
            HASH_PREFIX,
            HASH_LENGTH,
            API_TYPE,
            API_DATA_TYPE,
            API_DATA,
            SEND_HASH,
            IMG_DIR,
            JS_DIR,
            TPL_DIR : TPL_DIR + '/',
            TPL_EXT_NAME,
            JS_EXT_NAME,
            HOME_HASH,
            TIME_OUT,
            AUTO_DIE_TIME
        };
    };
    SPA.router = function(basePath) {
        const getURI = function(uri) {
                if (!WI.is('string', uri)) {
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
            push () {
                let routeArr = arguments[0].split('?:'),
                    route = this[arguments[0]] = {
                        name : routeArr[0],
                        param : routeArr[1] ? routeArr[1].split(':') : null,
                        path : routeArr[1] ? arguments[0].replace(/\?/, '/').replace(/:/g, '~') : routeArr[0],
                        uri : null
                    };

                for (let i = 1; i < arguments.length; i++) {
                    if (WI.is('string', arguments[i])) {
                        if (arguments[i].slice(0, 9) === '<template') {
                            route.templ = arguments[i];
                        } else if (WI.has(arguments[i], '=')) {
                            route.preset = WI.query2json(arguments[i]);
                        } else {
                            route.uri = getURI(arguments[i]);
                        };
                    } else if (WI.is('array', arguments[i])) {
                        let routeEscape = route.escape = {};

                        arguments[i].forEach(function(str) {
                            let strArr = str.split(' => ');
                            routeEscape[strArr[1]] = strArr[0];
                        });
                    } else if (WI.is('object', arguments[i])) {
                        let options = arguments[i];
                        if (WI.is('function', options.redirect)) route.redirect = options.redirect;
                        if (WI.is('boolean', options.observer)) route.observer = options.observer;
                        if (WI.is('function', options.proxy)) route.proxy = options.proxy;
                        if (options.hasOwnProperty('status')) route.status = options.status;
                        if (WI.is('function', options.render)) route.render = options.render;

                        if (WI.is('string', options.alias)) {
                            this[options.alias] = cloneRoute(route, options.alias);
                        } else if (WI.is('array', options.alias)) {
                            for (let i = 0, length = options.alias.length; i < length; i++) {
                                this[options.alias[i]] = cloneRoute(route, options.alias[i]);
                            };
                        };
                    };
                };

                return this;
            }
        };

        return new Router();
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