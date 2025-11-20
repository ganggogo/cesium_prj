// OpfsManager.js
import OpfsWorker from './opfs.worker.js'

const OPFS_PANEL_ID = 'opfs-cache-panel'
const OPFS_BUTTON_ID = 'opfs-toggle-button'
const OPFS_WORKER = new OpfsWorker()

let fileList = []
let quotaInfo = { usage: 0, quota: 0, free: 0 }
let panelVisible = false

function formatBytes(bytes)
{
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function renderPanel(container)
{
  let panel = document.getElementById(OPFS_PANEL_ID)
  if (!panel)
  {
    panel = document.createElement('div')
    panel.id = OPFS_PANEL_ID
    panel.style.cssText = `
      position: absolute;
      top: 80px;
      right: 10px;
      width: 320px;
      max-height: 60%;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 10px;
      font-size: 13px;
      border-radius: 8px;
      z-index: 9999;
      display: none;
    `
    container.appendChild(panel)
  }

  const totalSize = fileList.reduce((sum, file) => sum + file.size, 0)
  const totalSizeFormatted = formatBytes(totalSize)

  const html = [`
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong>OPFS 缓存管理</strong>
      <div>
        <button id="opfs-refresh" style="margin-right: 5px;">刷新</button>
        <button id="opfs-clear">清空</button>
      </div>
    </div>
    <div style="margin-top: 6px; font-size: 12px; color: #ccc;">
      缓存总大小：${totalSizeFormatted}
    </div>
    <div style="margin-top: 4px; font-size: 12px; color: #ccc;">
      已用空间：${formatBytes(quotaInfo.usage)} / 可用空间：${formatBytes(quotaInfo.quota)}
    </div>
    <div style="margin-top: 2px; font-size: 12px; color: #888;">
      剩余空间：${formatBytes(quotaInfo.free)}
    </div>
    <ul style="margin-top: 10px; list-style: none; padding-left: 0;">
      ${fileList?.length
    ? fileList.map(file => `
            <li style="margin-bottom: 6px;">
              ${file.name} (${formatBytes(file.size)})
              <button data-del="${file.name}" style="float: right;">删除</button>
            </li>
          `).join('')
    : '<li style="color:#888;">暂无缓存文件</li>'
}
    </ul>
  `]

  panel.innerHTML = html.join('')

  panel.querySelectorAll('button[data-del]').forEach(btn =>
  {
    btn.onclick = () =>
    {
      const key = btn.dataset.del
      OPFS_WORKER.postMessage({ type: 'delete', key })
    }
  })

  panel.querySelector('#opfs-refresh').onclick = () =>
  {
    OPFS_WORKER.postMessage({ type: 'list' })
    OPFS_WORKER.postMessage({ type: 'quota' })
  }

  panel.querySelector('#opfs-clear').onclick = () =>
  {
    OPFS_WORKER.postMessage({ type: 'clear' })
  }
}

function togglePanel(container)
{
  const panel = document.getElementById(OPFS_PANEL_ID)
  if (!panel) return
  panelVisible = !panelVisible
  panel.style.display = panelVisible ? 'block' : 'none'
}

function createToggleButton(container)
{
  let btn = document.getElementById(OPFS_BUTTON_ID)
  if (!btn)
  {
    btn = document.createElement('button')
    btn.id = OPFS_BUTTON_ID
    btn.textContent = '📦 缓存管理'
    btn.style.cssText = `
      position: absolute;
      top: 40px;
      right: 10px;
      z-index: 9999;
      background: #007aff;
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: 5px 10px;
      cursor: pointer;
    `
    container.appendChild(btn)
  }
  btn.onclick = () => togglePanel(container)
}

export function initOPFSCacheManager(containerId)
{
  const container = typeof containerId === 'string'
    ? document.getElementById(containerId)
    : document.getElementById(WebSocketPoolDispatcher.cesiumContainer)

  if (!container)
  {
    console.warn(`[OpfsManager] 容器未找到: ${containerId}`)
    return
  }
  if (document.getElementById(OPFS_PANEL_ID) || document.getElementById(OPFS_BUTTON_ID)) return console.error('不可重复初始化')

  createToggleButton(container)
  renderPanel(container)

  OPFS_WORKER.onmessage = (e) =>
  {
    const { type, key, list, success, usage, quota, free } = e.data

    switch (type)
    {
    case 'list':
      fileList = list
      renderPanel(container)
      break
    case 'quota':
      quotaInfo = { usage, quota, free }
      renderPanel(container)
      break
    case 'delete':
    case 'clear':
      OPFS_WORKER.postMessage({ type: 'list' })
      OPFS_WORKER.postMessage({ type: 'quota' })
      break
    case 'error':
      console.warn(`[OPFSWorker] 错误: ${key} -> ${e.data.error}`)
      break
    default:
      if (success) console.log(`[OPFSWorker] ${type} ${key} 操作成功`)
    }
  }

  // 初始化拉取
  OPFS_WORKER.postMessage({ type: 'list' })
  OPFS_WORKER.postMessage({ type: 'quota' })
}

// 销毁 OpfsManager 面板
export function destroyOPFSCacheManager()
{
  const panel = document.getElementById(OPFS_PANEL_ID)
  if (panel) panel.remove()
  const btn = document.getElementById(OPFS_BUTTON_ID)
  if (btn) btn.remove()
  OPFS_WORKER.terminate()
}
