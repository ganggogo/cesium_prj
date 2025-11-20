/**
 * db.worker.js
 * 数据库操作 worker 线程
 */

let dbPromise = null, db

function openDB()
{
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) =>
  {
    const request = indexedDB.open('CesiumCacheDB', 1)
    request.onupgradeneeded = (event) =>
    {
      const db = event.target.result
      if (!db.objectStoreNames.contains('files'))
        db.createObjectStore('files')
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
  return dbPromise
}

async function idbPut(key, value)
{
  if (!db)
    db = await openDB()
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

async function idbGet(key)
{
  if (!db)
    db = await openDB()
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction('files', 'readonly')
    const req = tx.objectStore('files').get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = (e) => reject(e.target.error)
  })
}

async function idbDelete(key)
{
  if (!db)
    db = await openDB()
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

async function idbList()
{
  if (!db)
    db = await openDB()
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction('files', 'readonly')
    const store = tx.objectStore('files')
    const result = []
    const cursorReq = store.openCursor()
    cursorReq.onsuccess = (event) =>
    {
      const cursor = event.target.result
      if (cursor)
      {
        result.push({ name: cursor.key, size: cursor.value.byteLength })
        cursor.continue()
      }
      else
        resolve(result)
      
    }
    cursorReq.onerror = (e) => reject(e.target.error)
  })
}

async function idbClear()
{
  if (!db)
    db = await openDB()
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').clear()
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

self.onmessage = async(e) =>
{
  const { type, key, buffer } = e.data
  const safeKey = key.replace(/[^\w.-]/g, '_') // 防止非法字符, 替换为下划线,写的时候许适配
  try
  {
    switch (type)
    {
    case 'write':
      await idbPut(safeKey, buffer)
      self.postMessage({ type, key, success: true })
      break
    case 'read': {
      const value = await idbGet(safeKey)
      if (value)
        self.postMessage({ type, key, buffer: value }, [value])
      else
        self.postMessage({ type, key, buffer: null })
      break
    }
    case 'delete':
      await idbDelete(safeKey)
      self.postMessage({ type, key, success: true })
      break
    case 'list': {
      const list = await idbList()
      self.postMessage({ type, list })
      break
    }
    case 'clear':
      await idbClear()
      self.postMessage({ type, success: true })
      break
    case 'quota': {
      const { usage, quota } = await navigator.storage.estimate()
      self.postMessage({ type, usage, quota, free: quota - usage })
      break
    }
    default:
      throw new Error(`Unsupported type: ${type}`)
    }
  }
  catch (err)
  {
    console.error(`[IDBWorker] Error in ${type}:`, err)
    self.postMessage({ type: 'error', key, error: err.message })
  }
}
