import OpfsZh from './OpfsZh.js'
class OpFsUtils 
{
  // 静态属性
  static rootHandle = null                     // 根目录句柄
  static opfsWriters = null                     // OPFS写入器集合

  /**
   * 创建OPFS文件读取器
   * @returns {Boolean} checkedOPFS 是否成功创建OPFS文件读取器
   */
  static async checkOPFS()
  {
    let checkedOPFS = false;
    if ('storage' in navigator && 'persisted' in navigator.storage)
    {
      // 检查OPFS是否可用
      await navigator.storage.persist().then(granted =>
      {
        if (granted)
        {
          this.opfsWriters = new Map()
          console.log(OpfsZh.grantedOPFS)
          checkedOPFS = true
        }
        else console.error(OpfsZh.unGrantedOPFS)
      })
    }
    else
    {
      console.error(OpfsZh.browserNotSupportOPFS)
    }
    return checkedOPFS
  }

  /**
   * 获取根目录句柄
   * @method       getRootHandle
   * @returns      {Directory}      rootHandle       根目录句柄
   */
  static getRootHandle()
  {
    if (this.rootHandle) return Promise.resolve(this.rootHandle)
    return navigator.storage.getDirectory().then(handle => {
      this.rootHandle = handle
      return handle
    })
  }

  /**
   * 创建单个文件的处理句柄
   * @method        createFileHandle
   * @param         {String}       filetag           文件标识
   * @param         {Bollean}      create            是否创建文件
   * @param         {Object}       additionalObj     额外属性
   * @returns       {Object}
   */
  static async createFileHandle(filetag, create, additionalObj = {})
  {
    const root = await this.getRootHandle()                                         // 获取存储根目录的句柄
    const handle = await root.getFileHandle(filetag, { create })                    // 针对每个文件需要单独的句柄来处理
    const writable = await handle.createWritable()                                  // 创建写入器
    return Object.assign({ handle, writable }, additionalObj)                       // 加入额外属性
  }

  /**
   * 文件写入完成
   * @method        fileWriteComplete
   * @param         {String}       filetag             文件标识
   */
  static async fileWriteComplete(filetag)
  {
    const writer = this.opfsWriters.get(filetag)                     // 获取文件写入器
    await writer.writable.close()                                    // 关闭写入器
    this.opfsWriters.delete(filetag)                                 // 移除文件写入器
  }

  /**
   * 清空文件系统
   * @method        deleteAllEntries
   */
  static async deleteAllEntries()
  {
    try
    {
      // 获取存储根目录的句柄
      const root = await this.getRootHandle();

      // 文件处理
      let fileCallback = async (name, root) =>
      {
        await root.removeEntry(name, { recursive: false })
        console.log(`${OpfsZh.deleteFile}${name}`);
      }
      // 目录处理
      let directoryCallback = async (name, handle, root) =>
      {
        // 如果是目录，则先递归删除其内容，然后删除该目录
        await recursiveRemove(handle);
        await root.removeEntry(name, { recursive: false });
        console.log(`${OpfsZh.deleteDirectory}${name}`);
      }
      await this.traverseDirectory(root, fileCallback, directoryCallback)
      console.log(OpfsZh.allItemsDeleted);
    }
    catch (error)
    {
      console.error(OpfsZh.delFileError, error);
    }
  }

  /**
   * 展示文件系统所有文件
   * @method        showAllEntries
   */
  static async listAllFiles()
  {
    try
    {
      // 获取存储根目录的句柄
      const root = await this.getRootHandle()
      // 调用递归函数遍历目录
      await this.traverseDirectory(root)
    }
    catch (error)
    {
      console.error(OpfsZh.traverseDirectoryError, error);
    }
  }

  /**
   * 递归遍历目录
   * @method        traverseDirectory
   * @param         {Directory}    dirHandle           目录句柄
   * @param         {Function}     fileCallback        文件回调函数
   * @param         {Function}     directoryCallback   目录回调函数
   */
  static async traverseDirectory(
    dirHandle,
    fileCallback = (name) => console.log('文件名:', name),
    directoryCallback = (name) => console.log('目录名:', name))
  {
    for await (const [name, handle] of dirHandle.entries())
    {
      if (handle.kind === 'file') await fileCallback(name, dirHandle)
      else if (handle.kind === 'directory')
      {
        // 递归进入子目录
        await this.traverseDirectory(dirHandle, fileCallback, directoryCallback)
        await directoryCallback(name, handle, dirHandle)
      }
    }
  }

  /**
   * 获取文件
   * @method        getFile
   * @param         {FileHandle}   fileHandle          文件句柄
   * @returns       {Promise}
   */
  static async getFileByHandle(fileHandle)
  {
    return fileHandle.getFile()
  }

  /**
   * 获取文件的文本格式
   * @method        getFileTextByFile
   * @param         {File}          file                文件对象
   * @returns       {Promise}
   */
  static getFileTextByFile(file)
  {
    return file.text()
  }

  /**
   * 获取文件的二进制格式
   * @method        getFileArrayBufferByFile
   * @param         {File}          file                文件对象
   * @returns       {Promise}
   */
  static getFileArrayBufferByFile(file)
  {
    return file.arrayBuffer()
  }
}
export default OpFsUtils
