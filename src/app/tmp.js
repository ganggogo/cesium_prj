/**
 * 创建一个IndexedDB的管理器类，用于管理IndexedDB的打开和操作
 */
class IndexedDBManager {
  constructor() {
    // 建立IndexedDB的名称和版本
    this.name = '3dtiles_db';
    this.version = 1;
    // 打开数据库连接
    this.openDB();
  }

  openDB() {
    // 打开IndexedDB的连接
    const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    const request = indexedDB.open(this.name, this.version);

    // 创建一个新的数据库或者升级旧版本的数据库
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // 创建一个名为'3dtiles_store'的对象仓库来存储模型数据
      db.createObjectStore('3dtiles_store', { keyPath: 'tileId' });
    };

    // 如果连接到了现有的数据库，则初始化完成
    request.onsuccess = (event) => {
      this.db = event.target.result;
    };

    request.onerror = (event) => {
      console.error(`IndexedDB error: ${event.target.errorCode}`);
    };
  }

  // 获取IndexedDB中指定tileId的模型数据
  get(tileId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('3dtiles_store', 'readonly');
      const objectStore = transaction.objectStore('3dtiles_store');
      const request = objectStore.get(tileId);

      request.onsuccess = (event) => {
        if (event.target.result) {
          resolve(event.target.result.data);
        } else {
          reject();
        }
      };

      request.onerror = (event) => {
        reject();
      };
    });
  }

  // 将模型数据存储到IndexedDB中
  put(tileId, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('3dtiles_store', 'readwrite');
      const objectStore = transaction.objectStore('3dtiles_store');
      const request = objectStore.put({ tileId, data });

      request.onsuccess = (event) => {
        resolve();
      };

      request.onerror = (event) => {
        reject();
      };
    });
  }
}

/**
 * 创建一个3D Tiles模型的管理器类，用于实现模型的增量加载和缓存
 */
class Tiles3DManager {
  constructor() {
    // 初始化模型管理器
    this.tileset = new Cesium.Cesium3DTileset({
      url: 'modelJson/static/model1/工程地质模型.json',
    });

    this.viewer = null;
    this.dbManager = new IndexedDBManager();
    this.cache = {};

    // 配置模型管理器的事件监听器
    this.tileset.tileLoad.addEventListener(this.onTileLoad.bind(this));
  }

  /**
   * 将Tile3D数据存储在IndexedDB缓存中
   * @param {Cesium.Cesium3DTile} tile - 加载的3D Tiles模型
   */
  async cacheTile(tile) {
    if (!this.cache[tile.tileset._url]) {
      this.cache[tile.tileset._url] = {};
    }

    // 将模型数据序列化并存储在IndexedDB中，可以使用不同的压缩算法进行优化
    const data = await tile.contentUrl.requestArrayBuffer();
    const compressedData = LZMA.compress(data);
    await this.dbManager.put(tile._header.tileId, compressedData);

    // 将模型数据存储在内存缓存中，以避免重复请求
    this.cache[tile.tileset._url][tile._header.tileId] = compressedData;
  }

  /**
   * 查询IndexedDB缓存并加载Tile3D数据
   * @param {Cesium.Cesium3DTile} tile - 加载的3D Tiles模型
   */
  async loadCachedTile(tile) {
    const cachedData = this.cache[tile.tileset._url][tile._header.tileId];
    if (cachedData) {
      // 从IndexedDB缓存中读取并解压缩模型数据，这里需要使用对应的解压缩算法
      const data = LZMA.decompress(cachedData);
      await tile.contentUrl.setArrayBuffer(data);
    }
  }

  /**
   * 3D Tiles模型加载完成时的回调函数，实现模型的增量加载和缓存
   * @param {Cesium.Cesium3DTile} tile - 加载的3D Tiles模型
   */
  async onTileLoad(tile) {
    const cachedData = this.cache[tile.tileset._url][tile._header.tileId];
    if (!cachedData) {
      // 如果当前Tile3D尚未缓存，则将其缓存到IndexedDB中
      await this.cacheTile(tile);
    } else {
      console.log(`从缓存加载Tile3D模型[${tile._header.tileId}]`);
    }

    // 加载模型数据
    await this.loadCachedTile(tile);
  }

  /**
   * 将Tile3D加载到场景中
   * @param {Cesium.Viewer} viewer - 场景管理器
   */
  loadTiles(viewer) {
    this.viewer = viewer;
    viewer.scene.primitives.add(this.tileset);
    this.viewer.flyTo(this.tileset)
  }
}

export default Tiles3DManager
