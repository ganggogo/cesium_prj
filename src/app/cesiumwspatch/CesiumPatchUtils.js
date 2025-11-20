/**
 * @method
 * @param {String} classtag    类别名称
 * @param {String} textTag     进度条文字
 * @param {Number} allTasksLen 总任务数
 */
function makeDiv(classtag, textTag = '初始化', allTasksLen)
{
  let id = `cesium-ws-patch-${classtag}-progress`
  // 如果有同样的进度条，先移除
  const oldDiv = document.getElementById(id)
  if (oldDiv) oldDiv.remove()
  // 创建新的进度条容器
  const progressWrapper = document.createElement('div')
  progressWrapper.id = id
  progressWrapper.style.position = 'absolute'
  progressWrapper.style.bottom = '10px'
  progressWrapper.style.right = '10px'
  progressWrapper.style.width = '160px'
  progressWrapper.style.padding = '6px'
  progressWrapper.style.background = 'rgba(0,0,0,0.6)'
  progressWrapper.style.borderRadius = '6px'
  progressWrapper.style.color = '#fff'
  progressWrapper.style.fontSize = '12px'
  progressWrapper.style.zIndex = 9999

  const progressText = document.createElement('div')
  progressText.innerText = `${textTag}进度：0 / ${allTasksLen}`
  progressWrapper.appendChild(progressText)

  const progressBar = document.createElement('div')
  progressBar.style.height = '8px'
  progressBar.style.marginTop = '6px'
  progressBar.style.background = '#444'
  progressBar.style.borderRadius = '4px'
  progressBar.style.overflow = 'hidden'

  const progressInner = document.createElement('div')
  progressInner.style.height = '100%'
  progressInner.style.width = '0%'
  progressInner.style.background = '#4caf50'
  progressInner.style.transition = 'width 0.3s ease'
  progressBar.appendChild(progressInner)

  progressWrapper.appendChild(progressBar)
  return {progressWrapper, progressInner, progressText}
}

/**
 * 连接状态监控
 * @method
 * @param {String} containerId 容器 ID
 * @param {String} classtag    类别名称
 * @param {String} textTag     进度条文字
 * @param {Number} allTasksLen 总任务数
 * @param {Boolean} ifAlwaysOnline 是否一直在线，不显示进度条
 */
export function showWebSocketConnectionProgress({containerId, classtag, textTag, allTasksLen, ifAlwaysOnline})
{
  const container = document.getElementById(containerId)
  if (!container)
  {
    console.error(`容器 #${containerId} 不存在`)
    return
  }

  container.style.position = 'relative'
  let {progressWrapper, progressInner, progressText} = makeDiv(classtag, textTag, allTasksLen || 0)

  if (classtag === 'loadmodel') progressWrapper.style.display = 'none'
  container.appendChild(progressWrapper)
  

  // 用定时器检查连接状态
  const timer = setInterval(() =>
  {
    let allToRequestCount = allTasksLen || window.WebSocketPoolDispatcher.allToRequestCount
    let percent = 0,
      connected = 0,
      conns = 0
    if (classtag === 'connect')
    {
      conns = window.WebSocketPoolDispatcher.connections
      connected = conns.filter(ws => ws && ws.readyState === WebSocket.OPEN).length
    }
    else if (classtag === 'loadmodel')
      connected = allToRequestCount - window.WebSocketPoolDispatcher.pendingRequestsCount
    percent = (connected / allToRequestCount) * 100

    progressInner.style.width = `${percent}%`
    progressText.innerText = `${textTag}进度：${connected} / ${allToRequestCount}`

    if (connected >= allToRequestCount)
    {
      if (!ifAlwaysOnline)
      {
        clearInterval(timer)
        progressWrapper.remove()
      }
      else
        progressWrapper.style.display = 'none'
    }
    else progressWrapper.style.display = 'block'
  }, 500)
  return true
}

