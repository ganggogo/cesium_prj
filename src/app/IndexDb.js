function IndexDb(opt)
{
  this.indexIns = null
  this.dataBaseName = (opt && opt.dataBaseName) || 'Cesium-3dTiles-DataBase',
  this.transactionName = opt && opt.transactionName || 'Cesium-3dTiles-Store',
  this.versionNum = opt && opt.versionNum || 1024,
  this.keyPath = opt && opt.keyPath || 'url'
  /**
   * @method
   * 初始化数据库
   * @param {String} dataBaseName 数据库名称
   * @param {String} transactionName 对象存储名称(类似于表名称)
   * @param {Number} versionNum 版本号
   * @param {String} keyPath 键路径 定义了如何从存储的对象中生成键
   */
  this.initIndexDB = function(dataBaseName, transactionName, versionNum, keyPath)
  {
    dataBaseName = dataBaseName || this.dataBaseName
    transactionName = transactionName || this.transactionName
    versionNum = versionNum || this.versionNum
    keyPath = keyPath || this.keyPath
    return new Promise((resolve2, reject) =>
    {
      // 当尝试打开一个数据库连接
      const request = window.indexedDB.open(dataBaseName, versionNum)
      // 打开出错时的回调
      request.onerror = function(event)
      {
        reject(event.target.error)
      }
      // 当传入的数据库版本号与当前数据库版本号高时，会触发此方法 （Indexdb使用版本号来管理数据库的生命周期，包括数据库的创建和升级）
      request.onupgradeneeded = function(event)
      {
        const db2 = event.target.result
        if (!db2.objectStoreNames.contains(transactionName))
        
          db2.createObjectStore(transactionName, { keyPath })
        
      }
      // 打开成功时的回调
      request.onsuccess = function(event)
      {
        this.indexIns = event.target.result
        console.log('app2数据库初始化完毕~')
        resolve2(this.indexIns)
      }
    })
  }

  /**
   * @method
   * 从数据库取数据
   * @param {String} url2 主键
   * @param {String} transactionName 表名
   */
  this.getArrayBufferFromIndexDB = function(url2, transactionName)
  {
    return new Promise(async(resolve2, reject) =>
    {
      try
      {
        transactionName = transactionName || this.transactionName
        // 创建一个只读事务
        const transaction = this.indexIns.transaction([transactionName], 'readonly')
        // 获取存储对象
        const objectStore = transaction.objectStore(transactionName)
        // 根据键名从数据库获取数据
        const getRequest = objectStore.get(url2)
        // 获取失败时的回调
        getRequest.onerror = function(event)
        {
          reject(event.target.error)
        }
        // 获取成果时的回调
        getRequest.onsuccess = function(event)
        {
          if (getRequest.result)
            resolve2(getRequest.result.data)
          else
            resolve2(null)
        }
      }
      catch (error)
      {
        reject(error)
      }
    })
  }

  /**
   * @method
   * 向数据库存入数据
   * @param {String} url2 主键
   * @param {String} transactionName 存储对象名称
   * @param {ArrayBuffer} arrayBuffer 要存储的数据
   */
  this.storeArrayBufferToIndexDB = function(url2, transactionName, arrayBuffer)
  {
    return new Promise(async(resolve2, reject) =>
    {
      try
      {
        transactionName = transactionName || this.transactionName
        // 创建一个可读写的事务，指定要操作的对象存储名称
        const transaction = this.indexIns.transaction([transactionName], 'readwrite')
        // 从事务中获取指定名称的对象存储
        const objectStore = transaction.objectStore(transactionName)
        // 设置put数据连接
        const putRequest = objectStore.put({ url: url2, data: arrayBuffer })
        // 存储失败的回调函数
        putRequest.onerror = function(event)
        {
          reject(event.target.error)
        }
        // 存储成功的回调函数
        putRequest.onsuccess = function(event)
        {
          resolve2(1)
        }
      }
      catch (error)
      {
        reject(error)
      }
    })
  }
}
export default IndexDb
