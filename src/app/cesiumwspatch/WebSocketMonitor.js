let timer,
  MONITOR_ID = 'ws-monitor-panel',
  BTN_ID = 'ws-monitor-btn'
function createMonitoringPanel(containerId)
{
  const container = document.getElementById(containerId)
  if (!container) return console.warn(`[cesium-ws-ui] 容器 #${containerId} 不存在`)

  // 按钮：打开/关闭面板
  const toggleBtn = document.createElement('button')
  toggleBtn.id = BTN_ID
  toggleBtn.innerText = '📊 模型加载监控'
  toggleBtn.style = `
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10000;
    padding: 5px 10px;
    font-size: 12px;
    border: none;
    border-radius: 4px;
    background: #007aff;
    color: white;
    cursor: pointer;
  `
  toggleBtn.onclick = () =>
  {
    const panel = document.getElementById(MONITOR_ID)
    if (panel)
    
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
    
  }

  // 面板容器
  const panel = document.createElement('div')
  panel.id = MONITOR_ID
  panel.style = `
    position: absolute;
    top: 50px;
    right: 10px;
    width: 280px;
    max-height: 80%;
    overflow-y: auto;
    background: rgba(0,0,0,0.8);
    color: white;
    font-size: 12px;
    padding: 10px;
    border-radius: 8px;
    z-index: 9999;
    display: none;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
    scrollbar-width: thin;
  `

  const summaryBlock = document.createElement('div')
  summaryBlock.id = 'ws-summary'
  summaryBlock.innerHTML = `
    <div style="font-size: 18px;"><b>总连接数:</b> <span id="ws-conn-count">-</span></div>
    <div style="font-size: 18px;"><b>当前剩余任务:</b> <span id="ws-task-count">-</span></div>
    <div style="font-size: 18px;"><b>总耗时:</b> <span id="ws-total-time">-</span> 秒</div>
    <hr>
  `
  panel.appendChild(summaryBlock)

  // 动态内容区域（连接详情）
  const contentBlock = document.createElement('div')
  contentBlock.id = 'ws-monitor-content'
  panel.appendChild(contentBlock)

  // 插入到页面
  container.style.position = 'relative'
  container.appendChild(toggleBtn)
  container.appendChild(panel)
}

function startMonitoringUpdate(intervalMs = 1000)
{
  function updateText(id, val)
  {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }

  // 动态刷新任务状态
  timer = setInterval(() =>
  {
    const content = document.getElementById('ws-monitor-content')
    if (!content || content.parentElement.style.display === 'none') return

    const { connections, requestsMap, pendingRequestsCount, requestDurations, allCostTime } = window.WebSocketPoolDispatcher || {}
    if (!connections) return

    updateText('ws-conn-count', connections.length)
    // updateText('ws-task-count', requestsMap.reduce((sum, map) => sum + map.size, 0))
    updateText('ws-task-count', pendingRequestsCount)
    updateText('ws-total-time', allCostTime[0] || '-')

    let html = ''
    connections.forEach((conn, i) =>
    {
      const state = ['🟥关闭', '🟡连接中', '🟢已连接', '🟣关闭中'][conn.readyState] || '❓未知'
      const pending = requestsMap[i]?.size || 0
      const durations = requestDurations[i] || []
      const avgTime = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '-'

      html += `
        <div><b>连接 ${i + 1}</b> ${state}</div>
        <div> ➤ 剩余任务: ${pending}</div>
        <div> ➤ 平均耗时: ${avgTime}ms</div>
        <hr>
      `
    })

    content.innerHTML = html
  }, intervalMs)
}

export function initWebSocketMonitor(param = {})
{
  let { containerId = 'cesiumcontainer', intervalMs = 1000 } = param
  const container = typeof containerId === 'string'
    ? document.getElementById(containerId)
    : document.getElementById(window.WebSocketPoolDispatcher.cesiumContainer)

  if (!container)
  {
    console.warn(`[WebSocketMonitor] 容器未找到: ${containerId}`)
    return
  }
  if (document.getElementById(MONITOR_ID) || document.getElementById(BTN_ID)) return console.error('不可重复初始化')
  createMonitoringPanel(containerId || window.WebSocketPoolDispatcher.cesiumContainer)
  startMonitoringUpdate(intervalMs)
}

// 销毁监控面板
export function destroyWebSocketMonitor()
{
  const panel = document.getElementById(MONITOR_ID)
  if (panel) panel.remove()
  const btn = document.getElementById(BTN_ID)
  if (btn) btn.remove()
  if (timer) clearInterval(timer)
}
