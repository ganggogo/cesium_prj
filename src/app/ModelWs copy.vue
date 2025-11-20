<style lang="scss" scoped>
  .res-box{height: 3rem;overflow-y: auto;border-top: 0.01rem dashed #ccc;margin-top: 0.5rem;}
</style>
<template>
  <el-button @click="connectWs">连接</el-button>
  <p>{{connectMessage}}</p>
  <el-input v-model="message" placeholder="请输入消息"></el-input><el-button @click="sendMsg" :disabled="!ifConnect || message === ''">发送</el-button>
  
  <div class="res-box">
    <p v-for="(item, index) in resList" :key="index">{{item}}  ----- 传输完成 ---- <el-button type="text" @click="downloadFile(item)">下载</el-button></p>
  </div>
</template>
<script>
let getBufferDatas = {}
export default {
  data()
  {
    return {
      wsconnector: null,
      ifConnect: false,
      connectMessage: '暂未连接···',
      message: '工程地质模型.json',
      resList: []
    }
  },
  methods:
  {
    // 创建连接
    connectWs()
    {
      let self = this;
      self.wsconnector = new WebSocket('ws://127.0.0.1:17789');

      self.wsconnector.onopen = function() {
        self.connectMessage = '已连接···';
        self.ifConnect = true;
      };

      self.wsconnector.onmessage = function(event) {
        self.dealGetDatas(event);
      };

      self.wsconnector.onerror = function(error) {
        self.dealError(error);
      };

      self.wsconnector.onclose = function() {
        console.log('连接已关闭');
        // 文件接收完成，可以在这里处理文件Blob
        if (self.fileBlob) {
          // 创建一个临时的URL来下载文件
          const url = window.URL.createObjectURL(self.fileBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'downloaded-file'; // 替换为期望的文件名
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url); // 清理URL对象
        }
      };
    },

    // 发送消息
    sendMsg()
    {
      // 发送文件路径请求
      this.wsconnector.send(JSON.stringify({filetag: this.message, filepath: this.message}));
      // this.wsconnector.send(this.message);
    },

    // 处理接收到的数据
    dealGetDatas(event) {
      const data = event.data;
      if (typeof data === 'string') {
        // 如果数据是字符串，尝试解析为JSON
        const message = JSON.parse(data);
        const filetag = message.filetag;
        
        if (message.error) {
          console.error(message.error);
        } else if (message.chunk) {
          // // 存储接收到的文件块
          // if (!getBufferDatas[filetag]) {
          //   getBufferDatas[filetag] = [];
          // }
          // getBufferDatas[filetag].push(new Blob([message.chunk.data]));
          // console.log('已接收', getBufferDatas[filetag].length, '块');
          console.log('已收到--')
        } else if (message.done) {
          console.log('文件接收完成:', filetag);
          // 文件接收完成，合并所有Blob
          // const blob = new Blob(getBufferDatas[filetag]);
          // getBufferDatas[filetag] = null; // 清除内存中的数据

          // // 提供下载链接
          // const url = URL.createObjectURL(blob);
          // const a = document.createElement('a');
          // a.href = url;
          // a.download = filetag; // 使用文件标签作为下载文件名
          // document.body.appendChild(a);
          // a.click();
          // document.body.removeChild(a);
          // URL.revokeObjectURL(url); // 释放URL对象

          // 更新文件列表
          this.resList.push(filetag);
        }
      } else {
        // 如果数据是Blob，将其添加到累积的Blob对象中
        if (!this.fileBlob) {
          this.fileBlob = new Blob([data], { type: 'application/octet-stream' });
        } else {
          this.fileBlob = new Blob([this.fileBlob, data], { type: 'application/octet-stream' });
        }
        console.log('已接收', this.fileBlob);
      }
    },

    /**
     * 将文件下载下来
     * @method downloadFile
     * @param buffer Uint8Array
     */
    downloadFile(buffer) {
      if (typeof buffer === 'string') {
        buffer = getBufferDatas[buffer]
      }
      // 将Buffer转换为Blob
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      // 创建一个临时的URL指向Blob
      const url = window.URL.createObjectURL(blob);
      // 创建一个<a>元素并设置href属性为Blob的URL
      const a = document.createElement('a');
      a.href = url;
      a.download = '工程地质模型.json'; // 设置下载的文件名
      // 将<a>元素添加到文档中，并模拟点击以下载文件
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // 清理URL对象
    },

    // 处理错误的情况
    dealError(event) {
      console.error('WebSocket错误:', event);
    }
  }
}
</script>
