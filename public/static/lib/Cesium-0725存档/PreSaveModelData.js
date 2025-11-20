/**
 * 预加载模型数据线程
 */
self.onmessage = async function(event) {
  const { action, databaseName, filedatas, _model_nginx_name, pathname, allSavedDatas } = event.data, dataGridName = 'modeldata';

  // 打开数据库的函数
  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);

      // 数据库升级时创建对象存储
      request.onupgradeneeded = (event) => {
        let db = event.target.result;
        db.createObjectStore(dataGridName, { keyPath: 'key' });
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

  // 根据属性值分类
  const rankObjects = (objects, attribute, ascending = true) => {
    // 复制对象数组以避免修改原数组
    const sortedObjects = [...objects];
    
    // 按属性值排序
    sortedObjects.sort((a, b) => {
      if (a[attribute] < b[attribute]) {
        return ascending ? -1 : 1;
      }
      if (a[attribute] > b[attribute]) {
        return ascending ? 1 : -1;
      }
      return 0;
    });
    
    return sortedObjects;
  };

  // 存储数据块的函数
  const storeChunk = (db, chunk) => {
    return new Promise((resolve, reject) => {
      // 开启事务，模式为读写
      let transaction = db.transaction([dataGridName], 'readwrite');
      let store = transaction.objectStore(dataGridName);
      // 事务成功完成
      transaction.oncomplete = () => resolve();
      // 事务失败
      transaction.onerror = (event) => reject(event.target.error);

      // 将数据块中的数据添加到对象存储
      try {
        for (const data of chunk) {
          store.put(data);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // 请求和处理数据的函数
  const fetchDataAndStore = async () => {
    let resArr = rankObjects(filedatas, 'length', false);
    // 打开数据库
    let db = await openDatabase();
    let queue = [];
    let maxConcurrent = 20;
    
    const processQueue = async () => {
      while (queue.length > 0) {
        await Promise.all(queue.splice(0, maxConcurrent).map(task => task()));
      }
    };

    for (let i = 0; i < resArr.length; i++) {
      let cuI = resArr[i].name;
      // 判断全局已读取的缓存数据是否存在当前模型数据
      if (!allSavedDatas[cuI]) {
        queue.push(() => fetchData(db, `${_model_nginx_name}/${pathname}${cuI}`, cuI));
      } else {
        console.log(`已存在~`);
      }

      // console.log(i)
      if (queue.length >= maxConcurrent) {
        await processQueue();
      }
    }

    // 处理剩余的任务
    await processQueue();
  };

  const fetchData = (db, url, name) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `http://127.0.0.1:8123/${url}`, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            await storeChunk(db, [{ key: name, data: xhr.response }]);
            self.postMessage({ status: 'success' });
            resolve(1);
          } catch (error) {
            self.postMessage({ status: 'error' });
            reject(error);
          }
        } else {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = (error) => {
        self.postMessage({ status: 'error', error });
        reject(new Error(error));
      };
      xhr.send();
    });
  };

  if (action === 'start') {
    try {
      await fetchDataAndStore();
    } catch (error) {
      // 通知主线程数据存储失败
      self.postMessage({ status: 'error', error: error });
    }
  }
};
