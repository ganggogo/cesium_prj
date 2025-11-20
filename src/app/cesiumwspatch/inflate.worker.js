
// eslint-disable-next-line no-undef
let curModelWsLibPort
self.onmessage = function(e)
{
  if (!e?.data?.id)
    return
  
  
  const { id, payload, modelWsLibPort } = e.data
  try
  {
    if (id === 'init')
    {
      curModelWsLibPort = modelWsLibPort
      importScripts(`http://${curModelWsLibPort}/modelWsD/libs/pako.min.js`)
      return
    }
    // eslint-disable-next-line no-undef
    const inflated = pako.inflate(new Uint8Array(payload)).buffer
    self.postMessage({ id, buffer: inflated }, [inflated])
  }
  catch (error)
  {
    console.error('inflate.worker.js 解压失败', error)
    self.postMessage({ id, error: error.message })
  }
}

// 添加错误处理
self.onerror = function(e)
{
  console.error('Worker error:', e)
}
