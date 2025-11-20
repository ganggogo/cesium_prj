<style lang="scss" scoped>
  .res-box, .error-box{height: 3rem;overflow-y: auto;border-top: 0.01rem dashed #ccc;margin-top: 0.5rem;}
</style>
<template>
  <el-button @click="connectWs">连接</el-button>
  <el-button @click="listAllFiles">查看所有文件</el-button>
  <el-button @click="deleteAllEntries">清空文件系统</el-button>
  <p>{{connectMessage}}</p>
  <el-input v-model="message" placeholder="请输入消息"></el-input><el-button @click="sendMsg" :disabled="!ifConnect || message === ''">发送</el-button>
  
  <div class="res-box">
    <p v-for="(item, index) in resList" :key="index">
      {{item.filetag}} {{ item.process === '100%' ? '----- 写入完成 ----' : item.process }}
      <el-button type="text" @click="downloadFile(item)">下载</el-button>
      <el-button type="text" @click="showText(item)">显示文本</el-button>
      <el-button type="text" @click="showBuffer(item)">显示Buffer</el-button>
    </p>
  </div>
  <div class="error-box">
    <p v-for="(item, index) in errorList" :key="index">{{item}}></p>
  </div>
  <div class="msg-box">
    <p v-for="(item, index) in msgList" :key="index">{{item}}></p>
  </div>
</template>
<script>
/**
 * 问题1：文件发送完成和写入完成之间的判断
 * 问题2：单个文件处理句柄创建的时机
 */
let wsconnectUrl  = 'ws://127.0.0.1:18879'            // ws连接地址
// let wsconnectUrl  = 'ws://192.168.2.122:18879'           // ws连接地址
import OpFsUtils from './OpFsUtils'
import OpfsZh from './OpfsZh.js'
import ModelWsZh from './ModelWsZh.js'
import pako from 'pako'
OpfsZh = Object.assign(OpfsZh, ModelWsZh)
window.OpFsUtils = OpFsUtils
export default {
  data()
  {
    return {
      wsconnector: null,                              // websocket连接器
      checkedOPFS: false,                             // OPFS是否可用
      ifConnect: false,                               // 是否已连接
      connectMessage: '暂未连接···',                   // 连接状态信息
      message: '工程地质模型.json',                    // 发送消息
      resList: [],
      errorList: [],
      msgList: []                                     
    }
  },
  mounted()
  {
    this.checkedOPFS = OpFsUtils.checkOPFS()
  },

  methods:
  {

    // 连接websocket
    connectWs()
    {
      let self = this;
      self.wsconnector = new WebSocket(wsconnectUrl);

      // 连接websocket
      self.wsconnector.onopen = function() {
        self.connectMessage = OpfsZh.hasConnected;
        self.ifConnect = true;
      };

      // 接收消息
      self.wsconnector.onmessage = function(event) {
        self.dealGetDatas(event);
      };

      // 处理错误情况
      self.wsconnector.onerror = function(error) {
        self.dealError(error);
      };

      // 关闭连接
      self.wsconnector.onclose = function(e) {
        console.log(OpfsZh.connectClosed, e);
        self.errorList.push(OpfsZh.connectClosed);
      };
    },

    // 发送消息
    async sendMsg()
    {
      let filetag = this.message
      // 发送消息前创建单个文件的处理句柄
      if (!OpFsUtils.opfsWriters.has(filetag))
      {
        try
        {
          console.log('创建文件写入器')
          let singleFileHandle = await OpFsUtils.createFileHandle(filetag, true, {receivedByteLen: 0})     // 创建单个文件的处理句柄
          OpFsUtils.opfsWriters.set(filetag, singleFileHandle)                                             // 保存写入器
          this.resList.push({filetag, process: '0%'});                                                     // 保存已经创建的文件的文件标识到列表中
        }
        catch(e)
        {
          console.error(OpfsZh.createFileError, e)
          return
        }
      }
      else
      {
        let handle = OpFsUtils.opfsWriters.get(filetag)
        handle.writable.seek(0);                   // 定位到文件开头
        handle.receivedByteLen = 0;                // 重置已接收的字节数
      }
      // 发送文件路径请求
      this.wsconnector.send(JSON.stringify({filetag, filepath: filetag}));
    },

    // 处理接收到的数据
    async dealGetDatas(event)
    {
      const eventdata = event.data;
      // 如果eventdata是字符串
      if (typeof eventdata ==='string')
      {
        const data = JSON.parse(eventdata);
        // 声明文件标识
        let filetag = data.filetag, fileSize = 0
        if (data.error)
        {
          // 出错情况
        }
        else if (data.fileSize)
        {
          // 接收到文件分块数据
          if (!fileSize) fileSize = data.fileSize

          let chunk = data.chunk, unCompressedData = pako.inflate(chunk)
          let unCompressedDataBuffer = unCompressedData.buffer
          // console.log(chunk)
          // console.log(pako.inflate)
          // console.log(unCompressedData)

          // let chunk = data.chunk, chunkData = chunk.data, binaryData = new Uint8Array(chunkData)
          // console.log(chunkData.length)
          // 接收到文件分块数据
          
          // 直接写入磁盘
          const writer = OpFsUtils.opfsWriters.get(filetag);
          await writer.writable.write(unCompressedDataBuffer);              // 执行写入
          writer.receivedByteLen += unCompressedDataBuffer.byteLength;           // 累计已接收的字节数
          let process = (writer.receivedByteLen / fileSize * 100).toFixed(2) + '%'
          console.log(`已接收并写入 ${(writer.receivedByteLen / 1024 / 1024).toFixed(4)} MB，进度：${process}%`);
          this.resList.find(item => item.filetag === filetag).process = `${process}`
          if (writer.receivedByteLen >= fileSize)               // 文件写入完成
          {
            console.log(OpfsZh.fileWriteComplete)
            OpFsUtils.fileWriteComplete(filetag)                // 文件写入完成后要及时关闭，不然文件系统里会有临时文件干扰
          }
        }
        else if (data.done)
        {
          // 文件接收完成
          // console.log('----------------- 文件发送完成 -----------------')
        }
      }
    },

    // 展示文件系统所有文件
    async listAllFiles()
    {
      await OpFsUtils.listAllFiles()
    },

    // 清空文件系统
    async deleteAllEntries()
    {
      await OpFsUtils.deleteAllEntries()
    },

    // 获取文件
    async getFile(fileObj)
    {
      let filetag = fileObj.filetag;
      let makefileHandle = await OpFsUtils.createFileHandle(filetag, false), fileHandle = makefileHandle.handle
      let file = await OpFsUtils.getFileByHandle(fileHandle)
      return file
    },

    // 显示文本
    async showText(fileObj)
    {
      let file = await this.getFile(fileObj)
      let textcontent = await OpFsUtils.getFileTextByFile(file)
      if (textcontent) this.msgList.push(textcontent)
    },

    // 显示二进制内容
    async showBuffer(fileObj)
    {
      let file = await this.getFile(fileObj)
      let buffrcontent = await OpFsUtils.getFileArrayBufferByFile(file)
      if (buffrcontent) this.msgList.push(buffrcontent)
    },

    /**
     * 下载文件
     * @method downloadFile
     * @param  {String} fileObj 文件对象
     */
    async downloadFile(fileObj)
    {
      try
      {
        let file = await this.getFile(fileObj)

        let filetag = fileObj.filetag
        let a = document.createElement('a')
        a.style.display = 'none'
        let url = URL.createObjectURL(file)
        a.href = url
        a.download = filetag
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        // 释放由 URL.createObjectURL() 创建的 URL 对象
        URL.revokeObjectURL(url)
      } catch (error)
      {
        console.error(`文件"${filetag}"下载失败:`, error)
      }
    },

    // 处理错误的情况
    dealError(event)
    {
      console.error(OpfsZh.connectError, event);
    }
  }
}
</script>
