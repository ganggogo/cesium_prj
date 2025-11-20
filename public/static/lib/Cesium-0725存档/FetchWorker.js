self.onmessage = async function(event) {
  const { action, databaseName } = event.data, dataGridName = 'modeldata'

  // 打开数据库的函数
  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);

      request.onupgradeneeded = (event) => {
        // 数据库不存在时会触发这个事件，可以在这里创建对象存储
        let db = event.target.result;
        if (!db.objectStoreNames.contains(dataGridName)) {
          db.createObjectStore(dataGridName, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  // 获取所有数据的函数
  const fetchAllData = (db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([dataGridName], 'readonly');
      const store = transaction.objectStore(dataGridName);
      const data = {};

      let cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          data[cursor.value.key] = cursor.value.data;
          cursor.continue();
        } else {
          resolve(data);
        }
      };

      cursorRequest.onerror = (event) => {
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        console.log('事务完成');
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  if (action === 'fetchAll') {
    try {
      let db = await openDatabase();
      // 获取所有数据
      const allData = await fetchAllData(db);
      self.postMessage({ status: 'success', data: allData });
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  }
};
