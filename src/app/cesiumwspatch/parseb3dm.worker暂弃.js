
importScripts('http://192.168.2.122:18889/modelWsD/libs/three.min.js')
importScripts('http://192.168.2.122:18889/modelWsD/libs/GLTFLoader.min.js')
const objectStoreName = 'models'
const dbName ='B3dmCache'
self.onmessage = async(e) =>
{
  const { key, buffer } = e.data

  try
  {
    const glbBuffer = extractGlbFromB3dm(buffer)
    const { positions, indices } = await parseGlbBuffer(glbBuffer)
    await saveToIndexedDB(key, positions, indices)
    self.postMessage({ success: true, key })
  }
  catch (err)
  {
    self.postMessage({ success: false, error: err.message })
  }
}

function extractGlbFromB3dm(arrayBuffer)
{
  const view = new DataView(arrayBuffer)
  const uint8 = new Uint8Array(arrayBuffer)
  const textDecoder = new TextDecoder()

  const magic = textDecoder.decode(uint8.slice(0, 4))
  if (magic !== 'b3dm') throw new Error('Invalid b3dm')

  const ftJSON = view.getUint32(12, true)
  const ftBIN = view.getUint32(16, true)
  const btJSON = view.getUint32(20, true)
  const btBIN = view.getUint32(24, true)
  const glbStart = 28 + ftJSON + ftBIN + btJSON + btBIN

  return arrayBuffer.slice(glbStart)
}

function parseGlbBuffer(glbBuffer)
{
  return new Promise((resolve, reject) =>
  {
    const loader = new THREE.GLTFLoader()
    loader.parse(glbBuffer, '', (gltf) =>
    {
      gltf.scene.traverse((child) =>
      {
        if (child.isMesh)
        {
          const posAttr = child.geometry.attributes.position
          const idxAttr = child.geometry.index
          if (posAttr && idxAttr)
          {
            resolve({
              positions: posAttr.array,
              indices: idxAttr.array
            })
          }
        }
      })
    }, reject)
  })
}

function saveToIndexedDB(key, positions, indices)
{
  return new Promise((resolve, reject) =>
  {
    const request = indexedDB.open(dbName, 1)
    request.onupgradeneeded = () =>
    {
      const db = request.result
      if (!db.objectStoreNames.contains(objectStoreName))
      
        db.createObjectStore(objectStoreName)
      
    }

    request.onsuccess = () =>
    {
      const db = request.result
      const tx = db.transaction(objectStoreName, 'readwrite')
      const store = tx.objectStore(objectStoreName)
      const data = {
        key,
        positions: Array.from(positions),
        indices: Array.from(indices),
      }
      store.put(data, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }

    request.onerror = () => reject(request.error)
  })
}
