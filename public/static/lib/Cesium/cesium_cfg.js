/**
 * 
 * Cesium-ws请求加载模型 相关配置
 * 
 * 注：
 * 1、服务里的root路径配置： model3d
 * 2、Cesium_RunTimeError_To_Outer 由Cesium_RunTimeError_To_Outer接收错误消息
 * 3、解压借助 pakoTool
 */

// 需要在系统初始化的时候定义
window.request_model_type = 'ws'                                   // http/ws
window.data_model_type = 0                                         // 数据类型  0 资源管理器 1 MongoDB 2 minio
window.maxMultiple = 5                                             // 执行ws最大倍数
window.ws_max_connections = 10                                     // 最大ws连接数
window._defaultModleBucketName = 'model3d'                         // 默认buckName
window.ws_model_location = 'ws://192.168.2.122:17899/zgis/WsModel' // 模型服务地址
window._model_nginx_name = 'modelUrlFrom2249900'                   // 模型数据代理名称（本地代理）
window._model_wsService_name = 'exclusive3DTilesModelAgent'        // 模型ws服务代理地址名称（本地代理）
window.modelLoadMsgs = []                                          // 模型加载情况记录



/**
 * 模型节点配置
 * Cesium.Cesium3DTileset.fromUrl(url, {maximumScreenSpaceError: 0, ...params})
 * params
 * 
 * @param {Boolean} ifOpenWsConnect      是否开启ws连接
 * @param {Boolean} ifUseIndexDb         是否开启indexdb缓存
 * 
 * 
 *  modelLoadMsgs wsModelDataCollections
 */








