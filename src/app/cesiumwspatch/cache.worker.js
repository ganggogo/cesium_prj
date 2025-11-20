// 缓存 worker
self.onmessage = async(e) =>
{
  const { type, key, buffer } = e.data
  const root = await navigator.storage.getDirectory()
  const safeKey = key.replace(/[^\w.-]/g, '_') // 防止非法字符

  try
  {
    const fileHandle = await root.getFileHandle(safeKey, { create: type === 'write' })

    if (type === 'write')
    {
      const writable = await fileHandle.createWritable()
      await writable.write(buffer)
      await writable.close()
      self.postMessage({ type: 'written', key })
    }
    else if (type === 'read')
    {
      const file = await fileHandle.getFile()
      const arrayBuffer = await file.arrayBuffer()
      self.postMessage({ type: 'read', key, buffer: arrayBuffer }, [arrayBuffer])
    }
  }
  catch (err)
  {
    self.postMessage({ type: 'error', key, error: err.message })
  }
}

self.onerror = function(e)
{
  console.error('CacheWorker error:', e)
}
