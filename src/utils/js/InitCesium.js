/**
 * 初始化cesium配置 20230403 xugang
 */
import SetFowLineMaterial from './SetFowLineMaterial'
import SetMapMask from './SetMapMask'
window.DataSourceCollection = []
class InitCesium
{
  constructor(opts)
  {
    this.viewer = null
    // this.mainview = (opts && opts.mainview )|| {"lon":111.86885791406675,"lat":28.62288118924098,"hei":1005295.5622382055,"heading":10.393969812947955,"pitch":-76.81156544286587,"roll":0.024425023608534404}
    // this.mainview = (opts && opts.mainview )|| {"lon":117.40295348250497,"lat":33.42003084919422,"hei":109150.73835214252,"heading":358.1954550558446,"pitch":-53.54374411406708,"roll":0.024425023608534404}
    // this.mainview = (opts && opts.mainview) || {
    //   "lon": 113.24576804197505,
    //   "lat": 22.284649540792437,
    //   "hei": 812.853119262539,
    //   "heading": 357.3445590296416,
    //   "pitch": -34.273492129539,
    //   "roll": 0.024425023608534404
    // }
    this.mainview = (opts && opts.mainview )|| {'lon':113.39004058684344, 'lat':22.19872095686686, 'hei':2232.6744807263017, 'heading':128.30639004914414, 'pitch':-14.191821590742787, 'roll':0.024425023608534404}
    this.ifShowGlobe = (opts && opts.hasOwnProperty('ifShowGlobe')) ? opts.ifShowGlobe : true // 是否展示地球
    this.ifFlytoDefViewPort = (opts && opts.hasOwnProperty('ifFlytoDefViewPort')) ? opts.ifFlytoDefViewPort : true
    this.targetY = 0
    this.modelprogress = 0
    this.hasErr = '无~'
    this.loadComplete = false
  }
  openGlobe(flag)
  {
    this.viewer.scene.globe.show = flag
  }
  // 初始化配置
  initviewer(callback)
  {
    // Cesium.Ion.defaultAccessToken =
    //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ZmE5ZGUxMC0xMDBhLTQyMzYtOTkxNi1kMzlmZTZmOTZiOGUiLCJpZCI6MzMwMzMsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTc5MDIxMzF9.4lZ1V_lUkJKANzONXRm1UEkFyhVJ5AMwKRCXbWwqIAA'
    // this.viewer = new Cesium.Viewer('cesiumcontainer', {
    //   animation: false, // 隐藏动画控件
    //   baseLayerPicker: false, // 隐藏图层选择控件
    //   fullscreenButton: false, // 隐藏全屏按钮
    //   vrButton: false, // 隐藏VR按钮，默认false
    //   geocoder: false, // 隐藏地名查找控件
    //   homeButton: false, // 隐藏Home按钮
    //   infoBox: false, // 隐藏点击要素之后显示的信息窗口
    //   sceneModePicker: false, // 隐藏场景模式选择控件
    //   selectionIndicator: true, // 显示实体对象选择框，默认true
    //   timeline: false, // 隐藏时间线控件
    //   navigationHelpButton: false, // 隐藏帮助按钮
    //   scene3DOnly: true, // 每个几何实例将只在3D中呈现，以节省GPU内存
    //   shouldAnimate: true, // 开启动画自动播放
    //   sceneMode: 3, // 初始场景模式 1：2D 2：2D循环 3：3D，默认3
    //   requestRenderMode: true, // 减少Cesium渲染新帧总时间并减少Cesium在应用程序中总体CPU使用率
    //   // 如场景中的元素没有随仿真时间变化，请考虑将设置maximumRenderTimeChange为较高的值，例如Infinity
    //   maximumRenderTimeChange: Infinity,
    //   /***************设置背景透明************/
    //   orderIndependentTranslucency: false,
    //   contextOptions: {
    //     webgl: {
    //       alpha: true,
    //     }
    //   }
    // })
    // // this.viewer.imageryLayers._layers.forEach(layer => {
    // //   layer.alpha = 0.2
    // // })


    // this.viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0.6)


    //  // 添加水印
    // //  let text = '武汉智博创享'
    // //  SetMapMask.addMask({ viewer: this.viewer, text })

    // //  setTimeout(() => {
    // //   SetMapMask.removeMask()
    // //  }, 4000)

    //  // 控制滚轮的缩放速度
    //  this.viewer.scene.screenSpaceCameraController._zoomFactor = 2


    // // 3dtiles监视器
    // // this.viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
    // // this.viewer.extend(Cesium.viewerCesiumInspectorMixin)


    // this.viewer.scene.skyBox.show = true
    // this.viewer.scene.sun.show = false;
    // this.viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0)
    // /****************设置背景透明******************/
    // this.viewer.cesiumWidget.creditContainer.style.display = "none" //隐藏logo
    // //加载影像
    // // this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(0))
    // // let imagery = this.viewer.imageryLayers.addImageryProvider(
    // //   Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    // //   {
    // //     baseLayerPicker : false
    // //   })
    // // )
    // // this.viewer.imageryLayers.addImageryProvider(imagery)
    // //加载注记
    // let label = new Cesium.WebMapTileServiceImageryProvider({
    //   url: "http://t0.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default.jpg" +
    //     "&tk=" + "19b72f6cde5c8b49cf21ea2bb4c5b21e",
    //   layer: "tdtAnnoLayer",
    //   style: "default",
    //   // maximumLevel: 18, //天地图的最大缩放级别
    //   format: "image/jpeg",
    //   tileMatrixSetID: "GoogleMapsCompatible",
    //   show: false,
    // })
    // // this.viewer.imageryLayers.addImageryProvider(label)


    this.viewer = new cxe.Viewer('cesiumcontainer', {
      contextOptions: {
        webgl: {
          alpha: true,
          depth: false,
          stencil: true,
          antialias: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: true
        },
        allowTextureFilterAnisotropic: true
      }
    })
    window.viewer = this.viewer


    let wms = { 'name': 'tdt_img', 'namec': '天地图影像', 'maptype': 'tdt', 'platform': '', 'url': '', 'layer': '', 'crs': '', 'format': 'img', 'params': { 'key': '6ac5ffa2361330cbbf535ba6d1b10f92' }, 'memo': '', 'visible': 1, 'disporder': 0, 'basemap': 1, 'thumbnail': '' }
    let baseLayer = new cxe.ImageryLayer('tdt', {
      style: wms.format,
      key: wms.params.key
    })
    this.viewer.layers.addImageryLayer(baseLayer)


    // 视角跳转
    if (this.ifFlytoDefViewPort) this.backPos()
    // 设置地球
    this.initGlobe()
    // 回调函数
    if (callback)
    {
      setTimeout(() =>
      {
        callback()
      }, 2000)
    }
    // 声明模型数据管理器
    let modelCollection = this.viewer.scene.primitives.add(new Cesium.PrimitiveCollection())
    window.modelCollection = modelCollection

    // 挂载方法
    window.viewer = this.viewer
    window.viewer.getState = this.getState
    window.viewer.flyTo = this.flyTo
    window.viewer.Car3ToLnglat = this.Car3ToLnglat

    window.viewer.scene.globe.translucency.enabled = true // 开启地球透明度
    window.viewer.scene.globe.translucency.frontFaceAlpha = 0.8  // 正面透明度
    window.viewer.scene.globe.translucency.backFaceAlpha = 0.2   // 背面透明度
    window.viewer.scene.globe.depthTestAgainstTerrain = false
    return this.viewer
  }

  // 复位
  backPos()
  {
    this.flyTo(this.mainview)
  }
  // 设置地球
  initGlobe()
  {
    let globe = this.viewer.scene.globe
    globe.show = this.ifShowGlobe
    // globe.showGroundAtmosphere = false
    // globe.baseColor = new Cesium.Color(1 / 255, 19 / 255, 70 / 255, 0)
    // globe.translucency.enabled = true
    // globe.undergroundColor = new Cesium.Color(0, 0, 0, 1)
    // globe.translucency.backFaceAlpha = 0 // 避免撕裂
  }
  // 视角飞行
  flyTo(view, time, complete, cancle)
  {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(Number(view.lon), Number(view.lat), Number(view.hei)), // 设置位置
      orientation: {
        heading: Cesium.Math.toRadians(Number(view.heading)), // 方向
        pitch: Cesium.Math.toRadians(Number(view.pitch)), // 倾斜角度
        roll: view.roll
      },
      duration: 0, // 设置飞行持续时间，默认会根据距离来计算
      complete: complete, // 到达位置后执行的回调函数,
      cancle: cancle, // 如果取消飞行则会调用此函数
      // pitchAdjustHeight: -90, // 如果摄像机飞越高于该值，则调整俯仰俯仰的俯仰角度，并将地球保持在视口中。
      // maximumHeight: 5000, // 相机最大飞行高度
      // flyOverLongitude: 100 // 如果到达目的地有2种方式，设置具体值后会强制选择方向飞过这个经度(这个，很好用)
    })
  }
  // 笛卡尔3转经纬度
  Car3ToLnglat(point)
  {
    let ellipsoid = this.viewer.scene.globe.ellipsoid
    let cartographic = ellipsoid.cartesianToCartographic(point)
    let pnt = {}
    pnt.lng = Cesium.Math.toDegrees(cartographic.longitude) // 经度（longitude ）
    pnt.lat = Cesium.Math.toDegrees(cartographic.latitude) // 纬度 （latitude）
    pnt.alt = cartographic.height
    return pnt
  }
  // 获取当前相机姿态
  getState()
  {
    let view = {}
    let rectangle = this.Car3ToLnglat(this.viewer.camera.position)
    view.lon = rectangle.lng
    view.lat = rectangle.lat
    view.hei = rectangle.alt
    // 获取相机姿态
    view.heading = Cesium.Math.toDegrees(this.viewer.camera.heading)
    view.pitch = Cesium.Math.toDegrees(this.viewer.camera.pitch)
    // json.roll = Cesium.Math.toDegrees(this.viewer.camera.roll)
    view.roll = 0.024425023608534404
    return JSON.stringify(view)
    // return view
  }
  /**
   * 绘制边界
   * @param  {Object}  geoJson      LineString类型的geojson数据
   * @param  {String}  strokeColr   线或多边形的默认轮廓颜色，用css值创建的颜色类型，比如：'rgba(1,19,70,0)'
   * @param  {Number}  speed   流线的流动速度
   */
  async loadBJDataSouces(geoJson, strokeColr, speed)
  {
    let tmpDataSouce = Cesium.GeoJsonDataSource.load(geoJson, { // 这个方法加载geojson文件的路径和对象都可以
      stroke: Cesium.Color.fromCssColorString(strokeColr),
      name: 'InitDp'
    })
    await tmpDataSouce.then(async dataSource =>
    {
      let entities = dataSource.entities.values
      entities.forEach(item =>
      {
        item.polyline.material = new SetFowLineMaterial({}).getMaterial({
          gradient: 0.5,
          percent: 1.5,
          speed: speed || 5,
          lineColor: strokeColr
        })
        item.polyline.width = 4
      })
      window.DataSourceCollection.forEach(item =>
      {
        window.viewer.dataSources.remove(item)
      })
      window.DataSourceCollection.push(dataSource)
      await window.viewer.dataSources.add(dataSource)
    })
  }
  // 写入数据库
  addData(name, data)
  {
    let tmpdata = {
      accessDataMainKey: name,
      accessData: data
    }
    window.acessDataDB.addData(tmpdata).then((res) =>
    {
      console.log('写入 indexDB 数据库成功', res)
    }).catch((err) =>
    {
      console.log('写入 indexDB 数据库失败, because--', err)
    })
  }
  // 加载3dtiles
  async load3DTiles(url, params, flag, callback)
  {

    viewer.scene.globe.depthTestAgainstTerrain = true
    let self = this
    // -------------------------------------高版本1.107.1------------------------------------------
    try
    {
      let tileset = await Cesium.Cesium3DTileset.fromUrl(
        url, {
          // maximumScreenSpaceError: 16, // 数值加大，能让最终成像变模糊
          ...params
        }
      )
      tileset.allTilesLoaded.addEventListener(function()
      {
        console.log('All tiles are loaded')
      })
      window.tileset = tileset

      const startTime = performance.now()
      window.startLoadModelTime = startTime
      // tileset.allTilesLoaded.addEventListener(function() {
      //   // console.log('------------------加载完毕-----------------')
      //   const endTime = performance.now()
      //   const executionTime = endTime - startTime;
      //   tileset.loadFixTime = `总计耗时 ${(executionTime / 1000).toFixed(3) } 秒`
      //   // self.loadFixTime = `总计耗时 ${(executionTime / 1000).toFixed(3) } 秒`

      //   let boundingSphere = tileset.boundingSphere // 模型的包围球范围
      //   let radius = boundingSphere.radius // 长度\


      //   // if (flag)
      //   // {
      //   //   let modelPos =
      //   //   {
      //   //     'pos1': [112.5569600, 37.9061500],
      //   //     'pos2': [112.5575264, 37.8964737],
      //   //     'pos3': [112.5571215, 37.9017642],
      //   //   }
      //   //   // 更新模型的位置
      //   //   let pos = modelPos[flag], verpos = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 0)
      //   //   // 创建平移矩阵
      //   //   let translation = Cesium.Matrix4.fromTranslation(verpos);
      //   //   // 设置模型矩阵
      //   //   tileset.modelMatrix = translation;
      //   // }

      //   if (callback) callback(radius)
      // })
      tileset.loadProgress.addEventListener(function(progress)
      {
        // console.log('加载进度：', progress);
        self.modelprogress = progress
      })
      window.modelCollection.add(tileset)
      self.viewer.scene.globe.depthTestAgainstTerrain = true
      self.viewer.zoomTo(
        tileset,
        new Cesium.HeadingPitchRange(
          0.0,
          -0.5,
          tileset.boundingSphere.radius * 1.5
        ))
      // window.viewer.flyTo(tileset)
      if (callback) callback()
    }
    catch (error)
    {
      console.error(`Error creating tileset: ${error}`)
      self.hasErr = `Error creating tileset: ${error}`
    }

    // setTimeout(()=>
    // {
    //   self.setModelPos(window.tileset, flag, {longVal: '', offsetVal: ''})
    // }, 1100)

    // ----------------------------版本1.100以下---------------------------------

    // //请求倾斜摄影模型
    // let tileset = new Cesium.Cesium3DTileset({url: url})
    // tileset.readyPromise.then((tileset) =>
    // {
    //   // window.modelCollection.add(tileset)

    //   self.viewer.scene.primitives.add(tileset)
    //   window.viewer.flyTo(tileset)

    //   //存储模型
    //   // self.addData('accessDataMainKey1', {modeldata: tileset})

    //   // window.viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.0, -0.5, tileset.boundingSphere.radius * 1.5))
    //   if (callback) callback()
    // })
  }

  setModelPos(tileset, flag, {longVal, offsetVal})
  {
    let modelPos =
    {
      'pos1': [112.5569600, 37.9061500],
      'pos2': [112.5575264, 37.8964737],
      'pos3': [112.5571215, 37.9017642],
    }
    let modelHei =
    {
      'pos1': 817.5,
      'pos2': 814,
      'pos3': 818
    }
    let targetParam = modelPos[flag]
    let param =
    {
      // center: {lng: targetParam[0], lat: targetParam[1], height: -100},
      offset: offsetVal || {x: 10, y: 800, z: modelHei[flag]},
    }
    let mat
    // center中心点,格式：{"center":{"lng":119.18,"lat":34.57,"height":0}}，就做矩阵变换到目标中心点。
    if (param && param.center)
    {
      let initialPosition = Cesium.Cartesian3.fromDegrees(param.center.lng, param.center.lat, param.center.height)  // 经纬度坐标转化为笛卡尔坐标
      mat = Cesium.Transforms.eastNorthUpToFixedFrame(initialPosition)
    }

    // offset平移，格式为{"offset":{"x":1000,"y":0,"z":0}}
    if (param && param.offset)
    {
      let offset = param.offset
      let transition = Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(offset.x, offset.y, offset.z))
      if (!mat)
        mat = tileset._root.transform
      Cesium.Matrix4.multiply(mat, transition, mat)
    }

    // rotate旋转，格式为{"rotate":{"x":-90,"y":0,"z":0}}
    if (param && param.rotate)
    {
      if (!mat)
        mat = tileset._root.transform
      let rotate = param.rotate
      let rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(rotate.x)))  // 倾斜沿x轴翻转
      Cesium.Matrix4.multiply(mat, rotationX, mat)
      let rotationY = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(rotate.y)))  // 倾斜沿y轴翻转
      Cesium.Matrix4.multiply(mat, rotationY, mat)
      let rotationZ = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rotate.z)))  // 倾斜沿z轴翻转
      Cesium.Matrix4.multiply(mat, rotationZ, mat)
    }

    // scale缩放，格式为{"scale":{"x":-90,"y":0,"z":0}}
    if (param && param.scale)
    {
      if (!mat)
        mat = tileset._root.transform
      let scale = param.scale
      let scalem = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(scale.x, scale.y, scale.z))
      Cesium.Matrix4.multiply(param.root.transform, scalem, param.root.transform)
    }

    // 倾斜模型设置矩阵变化，放在正确位置
    if (mat)
      tileset._root.transform = mat
  }
}
export default InitCesium
