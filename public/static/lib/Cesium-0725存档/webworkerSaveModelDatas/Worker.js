self.onmessage = async function(event) {
  const { dataArray, chunkSize } = event.data;

  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MyDatabase', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('MyStore')) {
          db.createObjectStore('MyStore', { keyPath: 'id', autoIncrement: true });
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

  const storeChunk = (db, chunk) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['MyStore'], 'readwrite');
      const store = transaction.objectStore('MyStore');

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);

      for (const data of chunk) {
        store.add({ buffer: data });
      }
    });
  };

  try {
    const db = await openDatabase();

    for (let i = 0; i < dataArray.length; i += chunkSize) {
      const chunk = dataArray.slice(i, i + chunkSize);
      await storeChunk(db, chunk);
    }

    self.postMessage({ status: 'success' });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
};
