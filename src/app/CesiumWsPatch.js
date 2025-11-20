/**
 * Cesium WebSocket 多连接补丁
 * 支持请求耗时统计、最小负载调度、超时重试、响应解压（Worker 处理）、自动重连、opfs 缓存
 */
import {initWebSocketMonitor, destroyWebSocketMonitor} from './cesiumwspatch/WebSocketMonitor.js'
import {initOPFSCacheManager, destroyOPFSCacheManager} from './cesiumwspatch/OpfsManager.js'
import {showWebSocketConnectionProgress} from './cesiumwspatch/CesiumPatchUtils.js'

const REQUEST_TIMEOUT_MS = 400000       // 请求超时时间
const MAX_RETRY_COUNT = 5               // 最大重试次数
const MAX_SINGLE_REQ_QUES = 80          // 最大请求队列长度
const RECONNECT_INTERVAL_MS = 3000      // 重连间隔
const MAX_RECONNECT_ATTEMPTS = 5        // 最大重连次数
const PROGRESS_CONNECT = 'connect'      // 连接进度
const PROGRESS_LOADMODEL ='loadmodel'   // 模型加载进度


/** *********************** 2、InflateWorker 初始化 *************************/
let inflateWorker, inflateCallbacks = new Map()
import InflateWorker from './cesiumwspatch/inflate.worker.js'
function createInflateWorker(modelWsLibPort)
{
  inflateWorker = new InflateWorker()
  // 发送初始化配置
  inflateWorker.postMessage({id: 'init', modelWsLibPort})
  inflateWorker.onmessage = function(e)
  {
    const { id, buffer } = e.data
    const callback = inflateCallbacks.get(id)
    if (callback)
    {
      inflateCallbacks.delete(id)
      callback(buffer)
    }
  }
  // 监听 InflateWorker 加载错误
  inflateWorker.onerror = (e) =>
  {
    console.error('inflateWorker 加载失败:', e)
  }
}
/** *********************************************************************/

/** *********************** 3、CacheWorker 初始化 *************************/
import CacheWorker from './cesiumwspatch/db.worker.js'           // https
// import CacheWorker from './cesiumwspatch/cache.worker.js'     // http
const cacheWorker = new CacheWorker()
const cacheCallbacks = new Map()

cacheWorker.onmessage = function(e)
{
  const { type, key, buffer, error } = e.data
  const cb = cacheCallbacks.get(key)
  if (!cb) return
  cacheCallbacks.delete(key)

  if (type === 'read')
    cb.resolve(buffer)
  
  else if (type === 'written')
    cb.resolve(true)
  
  else if (type === 'error')
    cb.reject(new Error(error))
  
}

function readCache(key)
{
  return new Promise((resolve, reject) =>
  {
    cacheCallbacks.set(key, { resolve, reject })
    cacheWorker.postMessage({ type: 'read', key })
  })
}

function writeCache(key, buffer)
{
  return new Promise((resolve, reject) =>
  {
    cacheCallbacks.set(key, { resolve, reject })
    cacheWorker.postMessage({ type: 'write', key, buffer }, [buffer])
  })
}
// 监听 CacheWorker 加载错误
cacheWorker.onerror = (e) =>
{
  console.error('cacheWorker 加载失败:', e)
}
/** *********************************************************************/

function createConnection(serverUrl)
{
  const ws = new WebSocket(`ws://${serverUrl}`)
  ws.binaryType = 'arraybuffer'
  return ws
}

let firstRequestTime = null

const WebSocketPoolDispatcher = (() =>
{
  const connections = []
  const requestsMap = []
  const requestDurations = []
  const connectionReadyResolvers = []
  const connectionReadyPromises = []
  const reconnectTimers = []
  const reconnectAttempts = []
  let allCostTime = []

  let requestIdCounter = 1

  function setupWebSocket(index, serverUrl)
  {
    const ws = createConnection(serverUrl)
    connections[index] = ws
    requestsMap[index] = requestsMap[index] || new Map()
    requestDurations[index] = requestDurations[index] || []
    reconnectAttempts[index] = reconnectAttempts[index] || 0

    connectionReadyPromises[index] = new Promise(resolve =>
    {
      connectionReadyResolvers[index] = resolve
    })

    ws.onopen = () =>
    {
      reconnectAttempts[index] = 0
      connectionReadyResolvers[index]()
    }

    ws.onerror = () =>
    {
      const map = requestsMap[index]
      for (const { reject, timer } of map.values())
      {
        clearTimeout(timer)
        reject(new Error('[cesium-ws-patch] 连接错误'))
      }
      map.clear()
    }

    ws.onclose = () =>
    {
      if (reconnectAttempts[index] < MAX_RECONNECT_ATTEMPTS)
      {
        reconnectTimers[index] = setTimeout(() =>
        {
          reconnectAttempts[index]++
          console.warn(`[cesium-ws-patch] 连接 ${index} 关闭，尝试重连（第 ${reconnectAttempts[index]} 次）`)
          setupWebSocket(index, serverUrl)
        }, RECONNECT_INTERVAL_MS)
      }
      else
        console.warn(`[cesium-ws-patch] 连接 ${index} 达到最大重连次数，放弃重连`)
      
    }

    ws.onmessage = (event) =>
    {
      const now = performance.now()
      const map = requestsMap[index]
      try
      {
        if (event.data instanceof ArrayBuffer)
        {
          const dataView = new DataView(event.data)
          const id = dataView.getUint32(0, true)
          const payloadBuffer = event.data.slice(4)
          const req = map.get(id)
          if (!req) return
          clearTimeout(req.timer)
          map.delete(id)

          inflateCallbacks.set(id, (resultBuffer) =>
          {
            // 调用writeCache写入缓存
            req.resolve(resultBuffer)
            curModelTaskCompleted()
            // 耗时统计
            if (req.__startTime)
            {
              const duration = now - req.__startTime
              requestDurations[index].push(duration)
              if (requestDurations[index].length > MAX_SINGLE_REQ_QUES) requestDurations[index].shift()
            }
          })
          inflateWorker.postMessage({ id, payload: payloadBuffer }, [payloadBuffer])

        }
        else if (typeof event.data === 'string')
        {
          const msg = JSON.parse(event.data)
          const { id, error, payload } = msg
          const req = map.get(id)
          if (!req) return
          clearTimeout(req.timer)
          map.delete(id)
          if (error)
            req.reject(new Error(error))
          
          else
          {
            const buffer = Uint8Array.from(atob(payload), c => c.charCodeAt(0)).buffer
            req.resolve(buffer)
          }
          if (req.__startTime)
          {
            const duration = now - req.__startTime
            requestDurations[index].push(duration)
            if (requestDurations[index].length > MAX_SINGLE_REQ_QUES) requestDurations[index].shift()
          }
          curModelTaskCompleted()
        }

      }
      catch (err)
      {
        console.error('[cesium-ws-patch] 解析响应失败:', err)
      }
    }
  }

  function curModelTaskCompleted()
  {
    WebSocketPoolDispatcher.pendingRequestsCount--
    if (WebSocketPoolDispatcher.pendingRequestsCount === 0)
    {
      const totalTime = (performance.now() - firstRequestTime).toFixed(2)
      allCostTime[0] = (totalTime / 1000).toFixed(2)
      console.log(`[cesium-ws-patch] 加载完成，总耗时：${allCostTime[0]} 秒`)
      let msgTip = `耗时：${allCostTime[0]} 秒`
      if (WebSocketPoolDispatcher.calllFn && typeof WebSocketPoolDispatcher.calllFn === 'function') WebSocketPoolDispatcher.calllFn(msgTip)
      firstRequestTime = null
    }
  }

  async function initConnections(serverUrl, maxConnections)
  {
    for (let i = 0; i < maxConnections; i++)
      setupWebSocket(i, serverUrl)
  }

  function getScore(index)
  {
    const ws = connections[index]
    if (!ws || ws.readyState !== WebSocket.OPEN) return Infinity
    const load = requestsMap[index].size
    const durations = requestDurations[index]
    const avgTime = durations.length === 0 ? 1 : durations.reduce((a, b) => a + b, 0) / durations.length
    return load * avgTime
  }

  function getMinLoadIndex()
  {
    let minIdx = 0
    let minScore = getScore(0)
    for (let i = 1; i < requestsMap.length; i++)
    {
      const score = getScore(i)
      if (score < minScore)
      {
        minScore = score
        minIdx = i
      }
    }
    return minIdx
  }

  async function request(url, serverUrl, maxConnections, retryCount = 0)
  {

    // 记录开始时间（用于耗时统计）
    if (firstRequestTime === null)
      firstRequestTime = performance.now()
    
    WebSocketPoolDispatcher.pendingRequestsCount++
    WebSocketPoolDispatcher.allToRequestCount++
    const cacheKey = url

    // 第一步：尝试读取缓存
    try
    {
      const cached = await readCache(cacheKey)
      if (cached && cached.byteLength > 0)
      {
        curModelTaskCompleted()
        return cached
      }
    }
    catch (e)
    {}

    // 第二步：初始化连接池（二次校验ws连接状态）/ 待优化：应改为继续初始化完所有连接池的连接器
    if (connections.length === 0)
      await initConnections(serverUrl, maxConnections)
    
    await Promise.all(connectionReadyPromises)

    // 第三步：选择负载最小的连接
    const index = getMinLoadIndex()
    const ws = connections[index]
    const map = requestsMap[index]

    if (!ws || ws.readyState !== WebSocket.OPEN)
      return Promise.reject(new Error('[cesium-ws-patch] WebSocket未连接'))
    

    const id = requestIdCounter++
    const start = performance.now()
    return new Promise((resolve, reject) =>
    {
      const timer = setTimeout(() =>
      {
        // map.delete(id)
        // if (retryCount < MAX_RETRY_COUNT)
        // {
        //   console.warn(`[cesium-ws-patch] 请求超时，重试第 ${retryCount + 1} 次：${url}`)
        //   request(url, serverUrl, maxConnections, retryCount + 1).then(resolve).catch(reject)
        // }
        // else
        //   reject(new Error('[cesium-ws-patch] 请求超时，已达最大重试次数'))


        // // 更新机制，如果ws请求超时，则采用原生ajax请求
        // console.warn(`[cesium-ws-patch] ws首次请求超时，尝试用原生ajax请求：${url}`)
        // const xhr = new XMLHttpRequest()
        // xhr.open('GET', url)
        // xhr.responseType = 'arraybuffer'
        // xhr.onload = () =>
        // {
        //   if (xhr.status === 200)
        //   {
        //     const buffer = xhr.response
        //     resolve(buffer)
        //     curModelTaskCompleted()
        //   }
        //   else
        //     reject(new Error(`[cesium-ws-patch] 请求失败，状态码：${xhr.status}`))
        // }
        // xhr.onerror = () =>
        // {
        //   reject(new Error('[cesium-ws-patch] 请求失败'))
        // }
        // xhr.send()
        
      }, REQUEST_TIMEOUT_MS)

      // 第四步：注册请求处理逻辑
      map.set(id, {
        url,
        resolve: async(buffer) =>
        {
          try
          {
            writeCache(cacheKey, buffer.slice(0)) // 拷贝buffer传入 Worker，避免影响缓存!
          }
          catch (e)
          {
            console.warn(`[cache] 写入失败: ${cacheKey}`, e)
          }
          resolve(buffer)
        },
        reject,
        timer,
        __startTime: start
      })

      // 第五步：发送请求
      const payload = JSON.stringify({ id, filepath: url })
      ws.send(payload)
    })
  }


  return {
    connections,                     // WebSocket 连接池
    requestsMap,                     // 请求队列映射表
    requestDurations,                // 请求耗时统计
    connectionReadyPromises,         // 连接就绪 Promise 集合
    allCostTime,                     // 总耗时
    pendingRequestsCount: 0,         // 等待中的请求数量
    allToRequestCount: 0,            // 总请求数量
    initConnections,                 // 初始化连接池
    request,                         // 请求函数
    initWebSocketMonitor,            // 初始化 WebSocket 监控
    initOPFSCacheManager,            // 初始化 opfs 缓存管理
    destroyWebSocketMonitor,         // 销毁 WebSocket 监控
    destroyOPFSCacheManager          // 销毁 opfs 缓存管理
  }
})()

window.WebSocketPoolDispatcher = WebSocketPoolDispatcher


/**
 * @method
 * @param {Object} options
 * @param {String} options.cesiumContainer                               Cesium 容器 ID                      【required】
 * @param {String} options.serverUrl                                     WebSocket 服务地址                  【required】
 * @param {Number} options.modelWsLibPort                                模型传输端口                        【required】
 * @param {Object} options.Cesium                                        Cesium 对象                         【optional】
 * @param {Array} [options.filetypes=['.b3dm', '.glb', 'tileset.json']]  开启 WebSocket 传输的文件类型        【optional】
 * @param {Number} [options.maxConnections=30]                           最大连接数                          【optional】
 * @param {Function} [options.calllFn]                                   回调函数，用于提示加载完成信息        【optional】
 * @param {Boolean} [options.useWsMonitor=false]                          是否开启 WebSocket 监控              【optional】
 * @param {Boolean} [options.useOpfsManager=false]                        是否开启 opfs 缓存管理               【optional】
 */
export default async function patchCesium(
  {
    cesiumContainer,
    serverUrl,
    modelWsLibPort,
    Cesium,
    filetypes = ['.b3dm', '.glb', 'tileset.json', '.pnts'],
    maxConnections = 30,
    calllFn,
    useWsMonitor = false,
    useOpfsManager = false
  })
{
  if (!Cesium || !Cesium.Resource || !Cesium.Resource.prototype)
  {
    console.warn('[cesium-ws-patch] Cesium.Resource 未找到，初始化失败')
    return
  }
  try
  {
    if (WebSocketPoolDispatcher.connections.length === 0) await WebSocketPoolDispatcher.initConnections(serverUrl, maxConnections)
    showWebSocketConnectionProgress({containerId:cesiumContainer, classtag: PROGRESS_CONNECT, textTag:'初始化', allTasksLen: maxConnections})
    if (useOpfsManager) initOPFSCacheManager(cesiumContainer)
    await Promise.all(WebSocketPoolDispatcher.connectionReadyPromises)
    WebSocketPoolDispatcher.STATUS_CODE = 1
    WebSocketPoolDispatcher.cesiumContainer = cesiumContainer
    showWebSocketConnectionProgress({
      containerId:WebSocketPoolDispatcher.cesiumContainer, classtag: PROGRESS_LOADMODEL, textTag:'加载', ifAlwaysOnline: true
    })
    if (useWsMonitor) initWebSocketMonitor({cesiumContainer})
    WebSocketPoolDispatcher.calllFn = calllFn
    const originalFetch = Cesium.Resource.prototype.fetchArrayBuffer
    Cesium.Resource.prototype.fetchArrayBuffer = function()
    {
      const url = this.url
      const useWebSocket = filetypes.some(type => url.endsWith(type) || url.includes(type))
      if (!useWebSocket) return originalFetch.call(this)
      return WebSocketPoolDispatcher.request(url, serverUrl, maxConnections)
    }
    // 初始化
    createInflateWorker(modelWsLibPort)
    return { statuscode: WebSocketPoolDispatcher.STATUS_CODE, message: '初始化成功' }
  }
  catch (e)
  {
    WebSocketPoolDispatcher.STATUS_CODE = 0
    return { statuscode: 0, message: '初始化失败', errormessage: e.message }
  }
}
window.patchCesium = patchCesium
