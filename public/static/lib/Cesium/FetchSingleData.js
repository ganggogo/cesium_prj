self.onmessage = async function(event) {
  const { databaseName, keys } = event.data;  // 支持多个 keys 以便批量处理
  const dataGridName = 'modeldata';
  
  let db;  // 将数据库对象声明在更高的作用域
  let store;  // 声明对象存储
  
  // 打开数据库的函数
  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);  // 如果数据库已打开，则直接返回
        return;
      }

      const request = indexedDB.open(databaseName, 1);

      request.onupgradeneeded = (event) => {
        // 数据库不存在时会触发这个事件，可以在这里创建对象存储
        db = event.target.result;
        if (!db.objectStoreNames.contains(dataGridName)) {
          db.createObjectStore(dataGridName, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  // 获取对象存储的函数
  const getObjectStore = (db, mode = 'readonly') => {
    if (!store || store.transaction.mode !== mode) {  // 如果未初始化或模式不同
      const transaction = db.transaction([dataGridName], mode);
      store = transaction.objectStore(dataGridName);
    }
    return store;
  };

  // 按 key 获取数据的函数
  const fetchDataByKey = (key) => {
    return new Promise((resolve, reject) => {
      const store = getObjectStore(db, 'readonly');  // 重用对象存储

      const request = store.get(key);
      request.onsuccess = (event) => {
        if (event.target.result) {
          resolve({ key, data: event.target.result.data });
        } else {
          resolve({ key, data: null, error: 'Key not found' });  // 未找到的key也返回
        }
      };

      request.onerror = (event) => {
        reject({ key, error: event.target.error.message });
      };
    });
  };

  // 打开数据库并批量获取数据
  try {
    await openDatabase();  // 打开数据库
    const results = await Promise.all(keys.map(fetchDataByKey));  // 批量获取数据
    self.postMessage({ status: 'success', data: results });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
};
