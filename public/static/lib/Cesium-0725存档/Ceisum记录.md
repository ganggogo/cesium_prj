
{"filename":"06e2b805-af5f-4713-aebf-2e4493ddff54/工程地质模型/289E5FE5-690E-479d-A4B0-D02B0D308DFC.b3dm","bucketName":"model3d","type":2}

1、Cesium3DTile.prototype.updatePriority 更新tile的优先级

2、function requestTiles(tileset) 处理tiles请求

3、function requestContent(tileset, tile) 处理单个conten请求

4、const statistics2 = tileset._statistics;
    const statisticsLast = tileset._statisticsLast;
    const numberOfPendingRequests = statistics2.numberOfPendingRequests;
    const numberOfTilesProcessing = statistics2.numberOfTilesProcessing;
    const lastNumberOfPendingRequest = statisticsLast.numberOfPendingRequests;
    const lastNumberOfTilesProcessing = statisticsLast.numberOfTilesProcessing;
    Cesium3DTilesetStatistics_default.clone(statistics2, statisticsLast);

tileset.loadProgress.raiseEvent(
          numberOfPendingRequests, // 实际加载进度的值
          numberOfTilesProcessing
        );

var allrequestContent = window.allrequestContent = {}  //////// 所有待处理的！！！
  var allrequestContentCount = window.allrequestContentCount = []
  var allgetRequestContent = window.allgetRequestContent = []
	
5、 Cesium3DTileset.prototype.postPassesUpdate  时刻更新 里面含有raiseLoadProgressEvent方法

6、async function processArrayBuffer(

7、Cesium3DTile.prototype.requestContent

8、 Cesium3DTile_default.prototype._hookedRequestContent = Cesium3DTile_default.prototype.requestContent;
		Cesium3DTile原型链上的requestContent也挂在了Cesium3DTile_default的_hookedRequestContent方法上
		
		每次tile实例调用 requestContent方法时，先会走_hookedRequestContent方法！！！
		
9、 ifFromHeartbeatDetection 来自心跳检测   function checkAllPendingErrorTiles()  allPendingErrorTilesData  allrequestContent
		
10、function sortTilesByPriority(a3, b) {   对tiles排序

11、查询管理器   wsQueryManager   maxNumToUseAjax 剩余tiles阈值

12、update6里的if (passOptions2.requestTiles) {回一直调用

13、分解 makeRequestTilesToChunks

14、IndexDbModelDataInManager

15、 // 定义sokcet队列排队生成器
  class CyclicRandomIntegerGenerator {
	
16、记录tile的回滚情况 recordTileRollBack          记录当前待用ajax请求的tiles集合 currentUseAjaxQueryTiles

17、末尾Tiles加速器  WsQueryManager  queryTileByAjax

18、 模型 buffer _MODEL_WS_SOCKET.wsModelDataCollections

19、 构造请求  Resource.prototype._makeRequest  请求堆 var priorityHeapLength = 20;  if (request.url.indexOf("hasData") === -1) {

20、计算 sse  屏幕空间误差 Cesium3DTile.prototype.getScreenSpaceError