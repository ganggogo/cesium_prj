const dataArray = new Array(10000).fill().map(() => {
  // 创建一个ArrayBuffer示例
  const size = Math.floor(Math.random() * (1024 * 0.01 * 1024 - 1024 + 1)) + 1024
  return new ArrayBuffer(size);
});

const chunkSize = 100; // 每次写入的块大小

const worker = new Worker('worker.js');

worker.onmessage = (event) => {
  const { status, error } = event.data;

  if (status === 'success') {
    console.log('Data storage complete');
  } else {
    console.error('Error storing data:', error);
  }
};

worker.postMessage({ dataArray, chunkSize });
