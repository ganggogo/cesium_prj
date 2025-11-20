
self.onmessage = async function(event) {
  const { msgObj, databaseName } = event.data, datagridName = 'modeldata'

  let db
  // 打开数据库的函数
  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);

      // 数据库升级时创建对象存储
      request.onupgradeneeded = (event) => {
        db = event.target.result;
        db.createObjectStore(datagridName, { keyPath: 'key' });
      };

      // 数据库打开成功
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      // 数据库打开失败
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  // 存储数据块的函数
  const storeChunk = (db, chunk) => {
    return new Promise((resolve, reject) => {
      // 开启事务，模式为读写
      let transaction = db.transaction([datagridName], 'readwrite')
      let store = transaction.objectStore(datagridName);

      // 事务成功完成
      transaction.oncomplete = () => resolve();
      // 事务失败
      transaction.onerror = (event) => reject(event.target.error);

      // 将数据块中的数据添加到对象存储
      try {
        store.add(chunk);
      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    // 如果数据库还未打开，打开数据库
    if (!db) db = await openDatabase();

    await storeChunk(db, msgObj)

    // 数据存储成功
    self.postMessage({ status: 'success' });
  } catch (error) {
    // 数据存储失败
    self.postMessage({ status: 'error', error: error.message });
  }
};
