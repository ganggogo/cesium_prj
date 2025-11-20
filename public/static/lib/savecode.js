var _MODEL_INDEXDB_CFG = window._MODEL_INDEXDB_CFG = {
  dbName: 'Cesium-3dTiles-DataBase',
  storeName: '_save_model_data', // 一个模型一个存储对象，即一个模型存一个表
  version: 1024,
  keyPath: "b3dmName",
}
// indedb模型数据管理器
class IndexDbModelDataInManager {
  constructor(opt) {
    opt = opt || _MODEL_INDEXDB_CFG
    this.dbName = opt.dbName || undefined; // 数据库名称
    this.dbVersion = opt.version || undefined; // 数据库版本号
    this.storeName = opt.storeName || undefined; // 存储对象名称
    this.keyPath = opt.keyPath || undefined; // 读写属性
    this.db = undefined; // 数据库连接实例
    this.openDB()
  }
  // 打开数据库
  openDB() {
    if (!this.dbName || !this.dbVersion || !this.storeName || !this.keyPath) throw new Error('indexdb实例属性不完整')
    console.log('创建连接~')
    // 建立连接
    const request = indexedDB.open(this.dbName, this.dbVersion);
    request.onupgradeneeded = (event) => {
      this.db = event.target.result;
      this.makeStoreObj()
    };
    request.onsuccess = (event) => {
      this.db = event.target.result;
    };
    request.onerror = (event) => {
      console.error('Error opening database');
    };
  }
  // 创建存储对象
  makeStoreObj() {
    if (!this.db.objectStoreNames.contains(this.storeName)) {
      // 创建存储对象
      const objectStore = this.db.createObjectStore(this.storeName, { keyPath: this.keyPath });
      // 创建索引
      objectStore.createIndex('modelNameIndex', this.keyPath, { unique: true })
    }
  }

  // 添加数据
  addIndexdbData(data) {
    // 创建一个读写事务
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    // 获取存储对象
    const store = transaction.objectStore(this.storeName);
    const request = store.put({ [this.keyPath]: data.b3dmName, data: data.data });
    request.onsuccess = () => {
      console.log('添加成功');
    };
    request.onerror = () => {
      console.error('Error adding data');
    };
  }
  // 根据 ID 获取数据
  getIndedbData(b3dmName) {
    const transaction = this.db.transaction([this.storeName], "readonly");// 创建一个只读事务
    const store = transaction.objectStore(this.storeName);// 创建存储对象
    const index = store.index('modelNameIndex');
    const request = index.openCursor(IDBKeyRange.only(b3dmName));
    // const request = store.get(b3dmName); // 根据id获取数据
    request.onsuccess = (event) => {
      console.log('读取成功')
      // 将模型数据存入模型Buffer集合
      if (event.target.result)
        _MODEL_WS_SOCKET.wsModelDataCollections[b3dmName] = event.target.result.value.data
    };
    request.onerror = () => {
      console.error('Error retrieving data');
    };
  }
  // 删除数据
  deleteIndedbData(b3dmName) {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const request = store.delete(b3dmName);
    request.onsuccess = () => {
      console.log('Data deleted successfully');
    };
    request.onerror = () => {
      console.error('Error deleting data');
    };
  }
}

// 实例化所有indedb模型数据管理器
for (let i = 0; i < indexdb_max_connections; i++) {
  window[`modelIndedb${i + 1}`] = new IndexDbModelDataInManager()
}