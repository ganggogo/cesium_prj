# cesium-ws-patch

基于 `WebSocket `的 `Cesium `多连接模型加载插件，支持模型资源加速加载、任务智能调度、opfs缓存管理等功能。

npm安装使用，暂无`Cesium`版本限制

测试`Cesium`版本：

`V1.107`、`V1.107.1`、`V1.130`

---



## **⚙️** 相关配置

### 1、worker-loader配置

`vue.config.js`：

```javascript
// worker配置
config.output.globalObject('this')
config.module
    .rule('worker')
    .test(/\.worker\.js$/)
    .use('worker-loader')
    .loader('worker-loader')
    .options({
        filename: '[name].[contenthash].worker.js',
        inline: 'no-fallback',
        esModule: false
	})
.end();
```

### 2、代理 

1、本地代理：

```javascript
'/modelWsOnline': {
    target: 'http://192.168.2.122:18889/modelWs/',
    changeOrigin: true,
    pathRewrite: {
    '^/modelWsOnline': '/'
    }
}
```

2、业务系统服务器nginx（以224服务器为例）：

```nginx
# 指向模型路径
location ^~ /gisxycsdz/modelWsOnline/ {
  proxy_pass   http://192.168.2.122:18889/modelWs/;
  autoindex on;
}
```

## ℹ️使用说明

安装 `cesium-ws-patch`

```bash
npm install cesium-ws-patch@latest
```

安装 `worker-loader`

```bash
npm  install worker-loader@3.0.8
```

安装 `pako`

```bash
npm  install pako@2.1.0
```

1、引入插件依赖：

```js
import patchCesium from 'cesium-ws-patch'
```

2、使用插件：

```javascript
// 1、初始化
await patchCesium({
  Cesium,
  serverUrl: $g.syscfg.modelwsipset,        // 模型加载服务ip端口
  modelWsLibPort：$g.syscfg.modelWsLibPort  // 模型配置ip端口
  maxConnections: 40,                       // ws连接池数量
  cesiumContainer: 'cesiumcontainer',       // cesiumcontainer为容器id名
  calllFn                                   // 模型加载完的回调函数
})

// 1.1 在加载模型之前做初始化判断
if (!WebSocketPoolDispatcher.STATUS_CODE) return this.$message.warning('初始化中，请稍后')

// 2、初始化完毕，加载模型
let url = 'modelWsOnline/gis_zhcsdz/工程地质模型.json'
let tileset = await Cesium.Cesium3DTileset.fromUrl(
    url, {
        ...params
    }
)
tileset.allTilesLoaded.addEventListener(function() {
    console.log('加载完成');
});

// 3、参数说明：
/**
 * @method
 * @param {Object} options
 * @param {String} options.cesiumContainer    Cesium 容器 ID         【required】
 * @param {String} options.serverUrl     WebSocket 服务地址          【required】
  * @param {Number} options.modelWsLibPort    模型传输端口            【required】
 * @param {Object} options.Cesium      Cesium 对象                   【optional】
 * @param {Array} [options.filetypes=['.b3dm', '.glb', 'tileset.json']]  开启 WebSocket 传输的文件类型        【optional】
 * @param {Number} [options.maxConnections=30]    最大连接数         【optional】
 * @param {Function} [options.calllFn]       回调函数，加载完执行     【optional】
 * @param {Boolean} [options.useWsMonitor=false]    是否开启 WebSocket 监控    【optional】
 * @param {Boolean} [options.useOpfsManager=false]      是否开启 opfs 缓存管理  【optional】
 */

// 4、全局对象：WebSocketPoolDispatcher，支持控制台调用

// 调用方法
WebSocketPoolDispatcher
    .initWebSocketMonitor()：调出加载任务监控控件
    .initOPFSCacheManager()：调出缓存管理控件
    .destroyOPFSCacheManager(): 销毁缓存管理控件
    .destroyWebSocketMonitor(): 销毁加载任务监控控件
```



---

## 📺模型加载效果

### ▶首次加载：

![](https://raw.github.com/ganggogo/assets/main/珠海工程地质模型首次加载.png)

▶️演示视频：

github：https://ganggogo.github.io/assets/1.html

内网：http://192.168.2.122:18889/modelWsD/html/1.html

### ▶二次加载：

![]( https://raw.github.com/ganggogo/assets/main/珠海工程地质模型二次加载.png)

▶️演示视频：

github：https://ganggogo.github.io/assets/2.html

内网：http://192.168.2.122:18889/modelWsD/html/2.html

------

## 🚀 功能新特性

- **🧩** 脱离`Cesium`源码，摆脱版本更新限制，插件安装使用。
- 🔁 `WebSocket` 多连接池请求调度（支持智能任务调度、重试、自动重连、并发加载、文件流传输、压缩传输···）
- 📦` OPFS`离线缓存，读写模型数据效率更高
- 📈 请求耗时统计、最小负载优先调度
- 🧠 `Worker `解压处理、读写缓存、减小客户端内存占用
- 👀 可视化监控界面（连接、耗时、任务量）
- 🧹 缓存文件管理 UI（查看、删除）

---

## **❎** 废除旧特性

- 废除模型数据缓存池，即用即销毁，减小客户端内存消耗
- 废除竞争加载机制，需要频繁进行数据监听，减小客户端内存消耗
- 废除Indexdb存储，换用OPFS存储，读写效率更高

------



## 后端服务部署

参考：https://doc.weixin.qq.com/doc/w3_AIAAGgbFAAYCNYuMzl17EQqOMiihx?scode=AL4AywcjAAoQZVhU0nAIAAGgbFAAY

## 🔄更新记录

`20250710`：

1、增加初始化插件进度条到三维视窗右下角显示。

2、增加模型加载加载进度条到三维视窗右下角显示，适配多模型加载任务数累计。

3、该表初始化调用方法，调用`patchCesium`返回初始化成功状态：`WebSocketPoolDispatcher.STATUS_CODE`，无须调用者手动判断是否初始化完。

```js
let readyMsg = await patchCesium({
  Cesium,
  serverUrl: 'ws://192.168.2.122:18888',
  maxConnections: 50,
  cesiumContainer: 'cesiumcontainer',
  calllFn
})
if (readyMsg.statuscode === 1)
  self.$message.success(readyMsg.message)
else
  self.$message.error(readyMsg.message)
```

4、修改`WebSocketMonitor`中对剩余任务的统计从`requestsMap.reduce`到读取`pendingRequestsCount`，优化性能。

`20250731`：

1、全局挂载patchCesium方法，支持script脚本嵌入使用。

`20250818`：

1、修改`pako.min`配置，支持全局配置和系统syscfg表配置

2、添加后端服务部署说明

3、修改说明文档结构

`20250819`：

1、添加`indexdb`缓存，适配http和https环境

`20250820`：

1、更新文档

2、修改modelWsLibPort外面传入

`20250929`：

1、更新文档，新增后端部署文档。

2、修改后端服务配置读取模型数据路径为外部配置文件可配置。