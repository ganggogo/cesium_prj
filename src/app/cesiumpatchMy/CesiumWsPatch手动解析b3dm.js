// /**
//  * Cesium WebSocket 多连接补丁（增强版）
//  * 支持请求耗时统计、最小负载调度、超时重试、响应解压（Worker 处理）、自动重连
//  */
// import initWebSocketMonitor from './cesiumwspatch/WebSocketMonitor.js'
// import initOPFSCacheManager from './cesiumwspatch/OpfsManager.js'
// // import IdleRenderController from './cesiumwspatch/IdleRenderController.js'

// const REQUEST_TIMEOUT_MS = 300000
// const MAX_RETRY_COUNT = 5
// const MAX_SINGLE_REQ_QUES = 80
// const RECONNECT_INTERVAL_MS = 3000
// const MAX_RECONNECT_ATTEMPTS = 5

// /*********************** 1、解析b3dm文件worder初始化 ***********************/
// import ParseB3dmWorker from './cesiumwspatch/parseb3dm.worker.js'
// const parseB3dmWorker = new ParseB3dmWorker()
// parseB3dmWorker.onmessage = (e) => {
//   if (e.data.success) {
//     console.log(`[cesium-ws-patch] 解析b3dm文件成功`);
//   } else {
//     console.error(`[cesium-ws-patch] 解析b3dm文件失败: ${e.data.error}`);
//   }
// };

// // 监听 parseB3dmWorker 加载错误
// parseB3dmWorker.onerror = (e) => {
//   console.error('parseB3dmWorker 加载失败:', e);
// };
// function parseB3dmFn(key, buffer) {
//   return new Promise((resolve, reject) => {
//     parseB3dmWorker.postMessage({ key, buffer }, [buffer]);
//   })
// }
// /***********************************************************************/

// /************************* 2、InflateWorker 初始化 *************************/
// import InflateWorker from './cesiumwspatch/inflate.worker.js'
// const inflateWorker = new InflateWorker()
// const inflateCallbacks = new Map()
// inflateWorker.onmessage = function (e) {
//   const { id, buffer } = e.data
//   const callback = inflateCallbacks.get(id)
//   if (callback) {
//     inflateCallbacks.delete(id)
//     callback(buffer)
//   }
// }
// // 监听 InflateWorker 加载错误
// inflateWorker.onerror = (e) => {
//   console.error('inflateWorker 加载失败:', e);
// };
// /***********************************************************************/

// /************************* 3、CacheWorker 初始化 *************************/
// import CacheWorker from './cesiumwspatch/cache.worker.js'
// const cacheWorker = new CacheWorker()
// const cacheCallbacks = new Map();

// cacheWorker.onmessage = function (e) {
//   const { status, key, buffer, error } = e.data;
//   const cb = cacheCallbacks.get(key);
//   if (!cb) return;
//   cacheCallbacks.delete(key);

//   if (status === 'read') {
//     cb.resolve(buffer);
//     console.log(`[cesium-ws-patch] 缓存 ${status} 成功`);
//     // console.log(`[cesium-ws-patch] 缓存 ${key} ${status} 成功`);
//   } else if (status === 'written') {
//     cb.resolve(true);
//     // console.log(`[cesium-ws-patch] 缓存 ${key} ${status} 成功`);
//     console.log(`[cesium-ws-patch] 缓存 ${status} 成功`);
//   } else if (status === 'error') {
//     cb.reject(new Error(error));
//   }
// };

// function readCache(key) {
//   return new Promise((resolve, reject) => {
//     cacheCallbacks.set(key, { resolve, reject });
//     cacheWorker.postMessage({ type: 'read', key });
//   });
// }

// function writeCache(key, buffer) {
//   return new Promise((resolve, reject) => {
//     cacheCallbacks.set(key, { resolve, reject });
//     cacheWorker.postMessage({ type: 'write', key, buffer }, [buffer]);
//   });
// }
// // 监听 CacheWorker 加载错误
// cacheWorker.onerror = (e) => {
//   console.error('cacheWorker 加载失败:', e);
// };
// /***********************************************************************/

// function createConnection(serverUrl) {
//   const ws = new WebSocket(serverUrl)
//   ws.binaryType = 'arraybuffer'
//   return ws
// }

// let firstRequestTime = null
// let pendingRequestsCount = 0

// const WebSocketPoolDispatcher = (() => {
//   const connections = []
//   const requestsMap = []
//   const requestDurations = []
//   const connectionReadyResolvers = []
//   const connectionReadyPromises = []
//   const reconnectTimers = []
//   const reconnectAttempts = []
//   let allCostTime = []

//   let requestIdCounter = 1

//   function setupWebSocket(index, serverUrl) {
//     const ws = createConnection(serverUrl)
//     connections[index] = ws
//     requestsMap[index] = requestsMap[index] || new Map()
//     requestDurations[index] = requestDurations[index] || []
//     reconnectAttempts[index] = reconnectAttempts[index] || 0

//     connectionReadyPromises[index] = new Promise(resolve => {
//       connectionReadyResolvers[index] = resolve
//     })

//     ws.onopen = () => {
//       reconnectAttempts[index] = 0
//       connectionReadyResolvers[index]()
//     }

//     ws.onerror = () => {
//       const map = requestsMap[index]
//       for (const { reject, timer } of map.values()) {
//         clearTimeout(timer)
//         reject(new Error('[cesium-ws-patch] 连接错误'))
//       }
//       map.clear()
//     }

//     ws.onclose = () => {
//       if (reconnectAttempts[index] < MAX_RECONNECT_ATTEMPTS) {
//         reconnectTimers[index] = setTimeout(() => {
//           reconnectAttempts[index]++
//           console.warn(`[cesium-ws-patch] 连接 ${index} 关闭，尝试重连（第 ${reconnectAttempts[index]} 次）`)
//           setupWebSocket(index, serverUrl)
//         }, RECONNECT_INTERVAL_MS)
//       } else {
//         console.warn(`[cesium-ws-patch] 连接 ${index} 达到最大重连次数，放弃重连`)
//       }
//     }

//     ws.onmessage = (event) => {
//       const now = performance.now()
//       const map = requestsMap[index]
//       try {
//         if (event.data instanceof ArrayBuffer) {
//           const dataView = new DataView(event.data)
//           const id = dataView.getUint32(0, true)
//           const payloadBuffer = event.data.slice(4)
//           const req = map.get(id)
//           if (!req) return
//           clearTimeout(req.timer)
//           let cacheKey = req.url
//           map.delete(id)

//           inflateCallbacks.set(id, (resultBuffer) => {
//             // 调用writeCache写入缓存
//             req.resolve(resultBuffer)
//             curModelTaskCompleted(cacheKey, resultBuffer.slice(0))
//             // 耗时统计
//             if (req.__startTime) {
//               const duration = now - req.__startTime
//               requestDurations[index].push(duration)
//               if (requestDurations[index].length > MAX_SINGLE_REQ_QUES) requestDurations[index].shift()
//             }
//           })
//           inflateWorker.postMessage({ id, payload: payloadBuffer }, [payloadBuffer])

//         } else if (typeof event.data === 'string') {
//           const msg = JSON.parse(event.data)
//           const { id, error, payload } = msg
//           const req = map.get(id)
//           if (!req) return
//           clearTimeout(req.timer)
//           map.delete(id)
//           if (error) {
//             req.reject(new Error(error))
//           } else {
//             const buffer = Uint8Array.from(atob(payload), c => c.charCodeAt(0)).buffer
//             req.resolve(buffer)
//           }
//           if (req.__startTime) {
//             const duration = now - req.__startTime
//             requestDurations[index].push(duration)
//             if (requestDurations[index].length > MAX_SINGLE_REQ_QUES) requestDurations[index].shift()
//           }
//           curModelTaskCompleted()
//         }

//       } catch (err) {
//         console.error('[cesium-ws-patch] 解析响应失败:', err)
//       }
//     }
//   }

//   function curModelTaskCompleted(cacheKey, cached)
//   {
//     pendingRequestsCount--
//     if (pendingRequestsCount === 0) {
//       const totalTime = (performance.now() - firstRequestTime).toFixed(2)
//       allCostTime[0] = (totalTime / 1000).toFixed(2)
//       console.log(`[cesium-ws-patch] 加载完成，总耗时：${allCostTime[0]} 秒`)
//       let msgTip = `耗时：${allCostTime[0]} 秒`
//       if (WebSocketPoolDispatcher.calllFn && typeof WebSocketPoolDispatcher.calllFn === 'function') WebSocketPoolDispatcher.calllFn(msgTip)
//         firstRequestTime = null
//     }
//     if (cacheKey && cached) parseB3dmFn(cacheKey, cached.slice(0))
//   }

//   async function initConnections(serverUrl, maxConnections) {
//     for (let i = 0; i < maxConnections; i++) {
//       setupWebSocket(i, serverUrl)
//     }
//   }

//   function getScore(index) {
//     const ws = connections[index]
//     if (!ws || ws.readyState !== WebSocket.OPEN) return Infinity
//     const load = requestsMap[index].size
//     const durations = requestDurations[index]
//     const avgTime = durations.length === 0 ? 1 : durations.reduce((a, b) => a + b, 0) / durations.length
//     return load * avgTime
//   }

//   function getMinLoadIndex() {
//     let minIdx = 0
//     let minScore = getScore(0)
//     for (let i = 1; i < requestsMap.length; i++) {
//       const score = getScore(i)
//       if (score < minScore) {
//         minScore = score
//         minIdx = i
//       }
//     }
//     return minIdx
//   }

//   async function request(url, serverUrl, maxConnections, retryCount = 0) {
//     // 记录开始时间（用于耗时统计）
//     if (firstRequestTime === null) {
//       firstRequestTime = performance.now();
//     }
//     pendingRequestsCount++;
//     const cacheKey = url;

//     // 第一步：尝试读取缓存
//     try {
//       const cached = await readCache(cacheKey);
//       if (cached && cached.byteLength > 0) {
//         curModelTaskCompleted(cacheKey, cached);
//         return cached;
//       }
//     } catch (e) {
//       console.warn(`[cache] 读取失败（或无缓存）: ${cacheKey}`);
//     }

//     // 第二步：初始化连接池（二次校验ws连接状态）
//     if (connections.length === 0) {
//       await initConnections(serverUrl, maxConnections);
//     }
//     await Promise.all(connectionReadyPromises);

//     // 第三步：选择负载最小的连接
//     const index = getMinLoadIndex();
//     const ws = connections[index];
//     const map = requestsMap[index];

//     if (!ws || ws.readyState !== WebSocket.OPEN) {
//       return Promise.reject(new Error('[cesium-ws-patch] WebSocket未连接'));
//     }

//     const id = requestIdCounter++;
//     const start = performance.now();
//     return new Promise((resolve, reject) => {
//       const timer = setTimeout(() => {
//         map.delete(id);
//         if (retryCount < MAX_RETRY_COUNT) {
//           console.warn(`[cesium-ws-patch] 请求超时，重试第 ${retryCount + 1} 次：${url}`);
//           request(url, serverUrl, maxConnections, retryCount + 1).then(resolve).catch(reject);
//         } else {
//           reject(new Error('[cesium-ws-patch] 请求超时，已达最大重试次数'));
//         }
//       }, REQUEST_TIMEOUT_MS);

//       // 第四步：注册请求处理逻辑
//       map.set(id, {
//         url,
//         resolve: async (buffer) => {
//           try {
//            writeCache(cacheKey, buffer.slice(0)); // 拷贝 buffer 传入 Worker
//           } catch (e) {
//             console.warn(`[cache] 写入失败: ${cacheKey}`, e);
//           }
//           resolve(buffer);
//         },
//         reject,
//         timer,
//         __startTime: start
//       });

//       // 第五步：发送请求
//       const payload = JSON.stringify({ id, filepath: url });
//       ws.send(payload);
//     });
//   }


//   return {
//     connections,
//     requestsMap,
//     requestDurations,
//     connectionReadyPromises,
//     allCostTime,
//     initWebSocketMonitor,
//     initOPFSCacheManager,
//     initConnections,
//     request
//   }
// })()

// window.WebSocketPoolDispatcher = WebSocketPoolDispatcher

// export default async function patchCesium({ Cesium, serverUrl, filetypes = ['.b3dm', '.glb', 'tileset.json'], maxConnections = 8, cesiumContainer, calllFn }) {
//   if (!Cesium || !Cesium.Resource || !Cesium.Resource.prototype) {
//     console.warn('[cesium-ws-patch] Cesium.Resource 未找到，补丁未应用')
//     return
//   }
//   if (WebSocketPoolDispatcher.connections.length === 0) await WebSocketPoolDispatcher.initConnections(serverUrl, maxConnections)
//   await Promise.all(WebSocketPoolDispatcher.connectionReadyPromises)
//   initWebSocketMonitor({cesiumContainer, serverUrl})
//   initOPFSCacheManager(cesiumContainer)

//   // const idlePlugin = new IdleRenderController(window.viewer, {
//   //   idleTimeout: 5000, // 5秒内无操作则暂停渲染
//   //   debug: true        // 控制台输出状态
//   // });
//   WebSocketPoolDispatcher.calllFn = calllFn
//   const originalFetch = Cesium.Resource.prototype.fetchArrayBuffer
//   Cesium.Resource.prototype.fetchArrayBuffer = function () {
//     const url = this.url
//     const useWebSocket = filetypes.some(type => url.endsWith(type) || url.includes(type))
//     if (!useWebSocket) return originalFetch.call(this)
//       return WebSocketPoolDispatcher.request(url, serverUrl, maxConnections)
//   }
//   console.log('[cesium-ws-patch] 已接管 fetchArrayBuffer，通过多连接 WebSocket 并发请求资源')

// }
