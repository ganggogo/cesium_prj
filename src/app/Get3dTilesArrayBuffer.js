// worker.js

self.onmessage = function(event) {
  // 处理接收到的消息
  let data = event.data;
  // 执行耗时操作
  let result = doSomeHeavyTask(data);
  // 发送处理结果给主线程
  self.postMessage(result);
};

function doSomeHeavyTask(data) {
  // 执行耗时操作
  // ...
  let result = data.map(item => item + 1)
  return result;
}
