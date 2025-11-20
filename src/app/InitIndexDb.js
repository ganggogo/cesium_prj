/**
 * 初始化indexDB 0920 xugang
 */

class InitClassDB
{
  constructor(opts)
  {
    this._opts = opts || undefined
    this._db = null //数据库
    this._transaction = null //事务
    this._request = null
    this._dbName = (opts && opts.dbName) || 'accessDataDb' //数据库名
    this._cacheTableName = (opts && opts.cacheTableName) || 'accessData' //表名
    this._dbversion = 999 //数据库版本
    this._mainKey = (opts && opts.mainKey) || 'accessDataMainKey'
    this._indexDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB
  }

  /**
   * 初始化数据库
   */
  initDB()
  {
    let self = this
    return new Promise((resolve, reject) =>
    {
      self._request = self._indexDB.open(self._dbName, self._dbversion) // 打开数据库
      // 数据库初始化成功
      self._request.onsuccess = (event) =>
      {
        self._db = self._request.result
        resolve(event)
      }
      // 数据库初始化失败
      self._request.onerror = (event) =>
      {
        reject(event)
      }
      // 数据库初次创建或更新时会触发
      self._request.onupgradeneeded = (event) =>
      {
        let db = self._request.result
        if (!db.objectStoreNames.contains(self._cacheTableName))
        {
          db.createObjectStore(self._cacheTableName, {
            keyPath: self._mainKey // 设置主键
          })
        }
        resolve(event)
      }
    })
  }

  /**
   * 关闭数据库
   */
  closeDB()
  {
    this._db.close()
    console.log(`关闭数据库`)
  }

  /**新增数据
   * @param {Object} params 添加到数据库中的数据 { accessDataMainKey: 文件名, accessData: 数据 }
   */
  addData(params)
  {
    let self = this
    return new Promise((resolve, reject) =>
    {
      let transaction = self._db.transaction(self._cacheTableName, 'readwrite') //可读可写
      let store = transaction.objectStore(self._cacheTableName)
      let response = store.add(params)
      // 操作成功
      response.onsuccess = (event) =>
      {
        resolve(event)
      }
      // 操作失败
      response.onerror = (event) =>
      {
        reject(event)
      }
    })
  }

  /**
   * 删除数据
   */
  deleteData()
  {
    let self = this
    if (self._db)
    {
      let transaction = self._db.transaction(self._cacheTableName, 'readwrite')
      let objectStore = transaction.objectStore(self._cacheTableName)
      // objectStore.delete(0)
      // objectStore.delete(1)
      // objectStore.delete(2)
      // objectStore.delete(2)
      objectStore.clear()
    }
  }

  /**从数据库获取数据
   * @param {String} key 主键名
   */
  getDataByKey(key)
  {
    let self = this
    return new Promise((resolve, reject) =>
    {
      if (!self._db) resolve(0) //解决清除缓存后（indexDb也会删除），无法读到当前indexDb实例 resolve（0） 出去做异常处理
      let transaction = self._db.transaction(self._cacheTableName)
      let objectStore = transaction.objectStore(self._cacheTableName)
      // 通过主键读取数据
      let request = objectStore.get(key)
      request.onsuccess = () =>
      {
        resolve(request.result)
      }
      request.onerror = (event) =>
      {
        reject(event)
      }
    })
  }

  /**
   * 清空数据库数据
   */
  clearDB()
  {
    let self = this
    return new Promise((resolve, reject) =>
    {
      let transaction = self._db.transaction(self._cacheTableName, 'readwrite')
      let store = transaction.objectStore(self._cacheTableName)
      let response = store.clear()
      // 操作成功
      response.onsuccss = (event) =>
      {
        resolve(event)
      }
      // 操作失败
      response.onerror = (event) =>
      {
        reject(event)
      }
    })
  }

  // 删除数据库
  deleteDB()
  {
    let self = this
    let DBDeleteRequest = self._indexDB.deleteDatabase(self._dbName)
    DBDeleteRequest.onsuccess = function(event)
    {
      console.log(`${self._dbName}数据库删除成功`)
    }
    DBDeleteRequest.onerror = function(event)
    {
      console.log(`${self._dbName}数据库删除失败`)
    }
  }
}
export default InitClassDB
