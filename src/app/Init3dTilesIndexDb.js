class Init3dTilesIndexDb
{
  /**
   * @method
   * 初始化 IndexDB
   * @param {String} databasename 数据库名
   * @param {String} transactionName 存储空间名
   * @param {Number} versionnum 版本号
   * @param {String} keypath keypath
   */
  static initIndexDB(dataBaseName,transactionName, versionNum, keyPath) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dataBaseName, versionNum);
      // 错误处理
      request.onerror = function(event) {
        console.log('打开数据库失败: ', event.target.error);
        reject(event.target.error);
      };
      // 创建存储空间
      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(transactionName)) {
          db.createObjectStore(transactionName, { keyPath: keyPath });
        }
      };
      // 数据库打开成功并resolve数据库对象
      request.onsuccess = function(event) {
        // 赋值全局对象
        db = event.target.result
        console.log('indexdb数据库初始化成功--', event.target.result)
        resolve(event.target.result);
      };
    });
  }
  //----------修改: 定义getArrayBufferFromIndexDB函数----------
  /**
   * @method
   * 从 IndexDB 获取 ArrayBuffer
   * @param {String} url b3dm请求网址url
   * @param {String} transactionName 存储空间名
   */
  static getArrayBufferFromIndexDB(url, transactionName) {
    return new Promise(async (resolve, reject) => {
      try {
        // 初始化indexdb数据库
        if (!db) {await initIndexDB('Cesium-3dTiles-DataBase', 'Cesium-3dTiles-Store', 1124, 'url');}
        // 创建一个只读事务，模型arraybuffer数据禁止改动
        const transaction = db.transaction([transactionName], 'readonly');
        // 获取存储空间
        const objectStore = transaction.objectStore(transactionName);
        // 获取存储在indexdb的数据
        const getRequest = objectStore.get(url);
        // 处理错误
        getRequest.onerror = function(event) {
          console.log('获取数据失败: ', event.target.error);
          reject(event.target.error);
        };
        // 成功获取数据
        getRequest.onsuccess = function(event) {
          if (getRequest.result) {
            console.log('数据获取成功--', event.target.result)
            resolve(getRequest.result.data);
          } else {
            resolve(null);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  //----------修改: 定义storeArrayBufferToIndexDB函数----------
  /**
   * @method
   * 存储 ArrayBuffer 到 IndexDB
   * @param {String} url b3dm请求网址url
   * @param {String} transactionName 存储空间名
   * @param {ArrayBuffer} arrayBuffer b3dm二进制数据
   */
  static storeArrayBufferToIndexDB(url, transactionName, arrayBuffer) {
    return new Promise(async (resolve, reject) => {
      try {
        // 初始化数据库
        if (!db) {await initIndexDB();}
        // 创建一个可读写事务
        const transaction = db.transaction([transactionName], 'readwrite');
        // 获取存储空间
        const objectStore = transaction.objectStore(transactionName);
        // 存储模型arraybuffer数据到indexdb
        const putRequest = objectStore.put({ url, data: arrayBuffer });
        // 处理错误
        putRequest.onerror = function(event) {
          console.log('存储数据失败: ', event.target.error);
          reject(event.target.error);
        };
        // 成功存储并resolve一个状态
        putRequest.onsuccess = function(event) {
          console.log('数据存储成功--', event.target.result)
          resolve(1);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}
export default Init3dTilesIndexDb
