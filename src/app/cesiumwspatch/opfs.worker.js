// opfs.worker.js

self.onmessage = async(e) =>
{
  const { type, key, data } = e.data
  const root = await navigator.storage.getDirectory()

  try
  {
    switch (type)
    {
    case 'list': {
      const result = []
      for await (const [name, handle] of root.entries())
      {
        if (handle.kind === 'file')
        {
          const file = await handle.getFile()
          result.push({ name, size: file.size })
        }
      }
      self.postMessage({ type: 'list', list: result })
      break
    }

    case 'read': {
      const handle = await root.getFileHandle(key)
      const file = await handle.getFile()
      const buffer = await file.arrayBuffer()
      self.postMessage({ type: 'read', key, buffer }, [buffer])
      break
    }

    case 'write': {
      const handle = await root.getFileHandle(key, { create: true })
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
      self.postMessage({ type: 'write', key, success: true })
      break
    }

    case 'delete': {
      await root.removeEntry(key)
      self.postMessage({ type: 'delete', key, success: true })
      break
    }

    case 'clear': {
      for await (const [name] of root.entries())
      
        await root.removeEntry(name)
      
      self.postMessage({ type: 'clear', success: true })
      break
    }

    case 'quota': {
      const { usage, quota } = await navigator.storage.estimate()
      self.postMessage({
        type: 'quota',
        usage,
        quota,
        free: quota - usage,
      })
      break
    }

    default:
      throw new Error(`Unsupported operation type: ${type}`)
    }
  }
  catch (err)
  {
    console.error(`[OPFSWorker] 处理 ${type} 时出错：`, err)
    self.postMessage({ type: 'error', key, error: err.message })
  }
}
