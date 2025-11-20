const objectStoreName = 'models'
const dbName ='B3dmCache'
export default function GetB3dmCache(key)
{
  return new Promise((resolve, reject) =>
  {
    const request = indexedDB.open(dbName, 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () =>
    {
      const db = request.result
      const tx = db.transaction(objectStoreName, 'readonly')
      const store = tx.objectStore(objectStoreName)
      const getRequest = store.get(key)

      getRequest.onsuccess = () =>
      {
        const data = getRequest.result
        if (!data)
        
          return resolve(null) // 没有这个 key
        

        // 还原为 TypedArray
        const positions = new Float32Array(data.positions)
        const indices =
          data.indices.length > 0 && data.indices[0] > 65535
            ? new Uint32Array(data.indices)
            : new Uint16Array(data.indices)

        resolve({ positions, indices })
      }

      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}
