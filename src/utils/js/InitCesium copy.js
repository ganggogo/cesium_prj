/**
 * 初始化cesium配置 20230403 xugang
 */
import SetFowLineMaterial from './SetFowLineMaterial'
window.DataSourceCollection = []
class InitCesium {
  constructor(opts) {
    this.viewer = null
    // this.mainview = (opts && opts.mainview )|| {"lon":111.86885791406675,"lat":28.62288118924098,"hei":1005295.5622382055,"heading":10.393969812947955,"pitch":-76.81156544286587,"roll":0.024425023608534404}
    // this.mainview = (opts && opts.mainview )|| {"lon":117.40295348250497,"lat":33.42003084919422,"hei":109150.73835214252,"heading":358.1954550558446,"pitch":-53.54374411406708,"roll":0.024425023608534404}
    this.mainview = (opts && opts.mainview) || {
      "lon": 113.24576804197505,
      "lat": 22.284649540792437,
      "hei": 812.853119262539,
      "heading": 357.3445590296416,
      "pitch": -34.273492129539,
      "roll": 0.024425023608534404
    }
    // this.mainview = (opts && opts.mainview )|| {"lon":116.49069575524048,"lat":34.04453535343167,"hei":38147.468045175425,"heading":59.55063253298673,"pitch":-32.208358406132895,"roll":0.024425023608534404}
    this.ifShowGlobe = (opts && opts.hasOwnProperty('ifShowGlobe')) ? opts.ifShowGlobe : false //是否展示地球
    this.ifFlytoDefViewPort = (opts && opts.hasOwnProperty('ifFlytoDefViewPort')) ? opts.ifFlytoDefViewPort : true
    this.targetY = 0
    this.modelprogress = 0
    this.hasErr = '无~'
    this.loadComplete = false
  }
  // 初始化配置
  initviewer(callback) {
    Cesium.Ion.defaultAccessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ZmE5ZGUxMC0xMDBhLTQyMzYtOTkxNi1kMzlmZTZmOTZiOGUiLCJpZCI6MzMwMzMsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTc5MDIxMzF9.4lZ1V_lUkJKANzONXRm1UEkFyhVJ5AMwKRCXbWwqIAA'
    this.viewer = new Cesium.Viewer('cesiumcontainer', {
      animation: false, // 隐藏动画控件
      baseLayerPicker: false, // 隐藏图层选择控件
      fullscreenButton: false, // 隐藏全屏按钮
      vrButton: false, // 隐藏VR按钮，默认false
      geocoder: false, // 隐藏地名查找控件
      homeButton: false, // 隐藏Home按钮
      infoBox: false, // 隐藏点击要素之后显示的信息窗口
      sceneModePicker: false, // 隐藏场景模式选择控件
      selectionIndicator: true, // 显示实体对象选择框，默认true
      timeline: false, // 隐藏时间线控件
      navigationHelpButton: false, // 隐藏帮助按钮
      scene3DOnly: true, // 每个几何实例将只在3D中呈现，以节省GPU内存
      shouldAnimate: true, // 开启动画自动播放
      sceneMode: 3, // 初始场景模式 1：2D 2：2D循环 3：3D，默认3
      requestRenderMode: true, // 减少Cesium渲染新帧总时间并减少Cesium在应用程序中总体CPU使用率
      // 如场景中的元素没有随仿真时间变化，请考虑将设置maximumRenderTimeChange为较高的值，例如Infinity
      maximumRenderTimeChange: Infinity,
      /***************设置背景透明************/
      orderIndependentTranslucency: false,
      contextOptions: {
        webgl: {
          alpha: true,
        }
      }
    })
    this.viewer.imageryLayers._layers.forEach(layer => {
      layer.alpha = 0.6
    })
    this.viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0.6)


    this.viewer.scene.skyBox.show = true
		this.viewer.scene.sun.show = false;
    this.viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0)
    /****************设置背景透明******************/
    this.viewer.cesiumWidget.creditContainer.style.display = "none" //隐藏logo
    //加载影像
    // this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(0))
    // let imagery = this.viewer.imageryLayers.addImageryProvider(
    //   Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    //   {
    //     baseLayerPicker : false
    //   })
    // )
    // this.viewer.imageryLayers.addImageryProvider(imagery)
    //加载注记
    let label = new Cesium.WebMapTileServiceImageryProvider({
      url: "http://t0.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default.jpg" +
        "&tk=" + "19b72f6cde5c8b49cf21ea2bb4c5b21e",
      layer: "tdtAnnoLayer",
      style: "default",
      // maximumLevel: 18, //天地图的最大缩放级别
      format: "image/jpeg",
      tileMatrixSetID: "GoogleMapsCompatible",
      show: false,
    })
    // this.viewer.imageryLayers.addImageryProvider(label)
    //视角跳转
    if (this.ifFlytoDefViewPort) this.backPos()
    //设置地球
    this.initGlobe()
    //回调函数
    if (callback) {
      setTimeout(() => {
        callback()
      }, 2000)
    }
    //声明模型数据管理器
    let modelCollection = this.viewer.scene.primitives.add(new Cesium.PrimitiveCollection())
    window.modelCollection = modelCollection

    // 挂载方法
    window.viewer = this.viewer
    window.viewer.getState = this.getState
    window.viewer.flyTo = this.flyTo
    return this.viewer
  }
  //复位
  backPos() {
    this.flyTo(this.mainview)
  }
  // 设置地球
  initGlobe() {
    let globe = this.viewer.scene.globe
    globe.show = this.ifShowGlobe
    // globe.showGroundAtmosphere = false
    // globe.baseColor = new Cesium.Color(1 / 255, 19 / 255, 70 / 255, 0)
    // globe.translucency.enabled = true
    // globe.undergroundColor = new Cesium.Color(0, 0, 0, 1)
    // globe.translucency.backFaceAlpha = 0 // 避免撕裂
  }
  // 视角飞行
  flyTo(view, time, complete, cancle) {
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
  Car3ToLnglat(point) {
    let ellipsoid = this.viewer.scene.globe.ellipsoid
    let cartographic = ellipsoid.cartesianToCartographic(point)
    let pnt = {}
    pnt.lng = Cesium.Math.toDegrees(cartographic.longitude) // 经度（longitude ）
    pnt.lat = Cesium.Math.toDegrees(cartographic.latitude) // 纬度 （latitude）
    pnt.alt = cartographic.height
    return pnt
  }
  // 获取当前相机姿态
  getState() {
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
  async loadBJDataSouces(geoJson, strokeColr, speed) {
    let tmpDataSouce = Cesium.GeoJsonDataSource.load(geoJson, { // 这个方法加载geojson文件的路径和对象都可以
      stroke: Cesium.Color.fromCssColorString(strokeColr),
      name: 'InitDp'
    })
    await tmpDataSouce.then(async dataSource => {
      let entities = dataSource.entities.values
      entities.forEach(item => {
        item.polyline.material = new SetFowLineMaterial({}).getMaterial({
          gradient: 0.5,
          percent: 1.5,
          speed: speed || 5,
          lineColor: strokeColr
        })
        item.polyline.width = 4
      })
      window.DataSourceCollection.forEach(item => {
        window.viewer.dataSources.remove(item)
      })
      window.DataSourceCollection.push(dataSource)
      await window.viewer.dataSources.add(dataSource)
    })
  }
  // 写入数据库
  addData(name, data) {
    let tmpdata = {
      accessDataMainKey: name,
      accessData: data
    }
    window.acessDataDB.addData(tmpdata).then((res) => {
      console.log('写入 indexDB 数据库成功', res)
    }).catch((err) => {
      console.log('写入 indexDB 数据库失败, because--', err)
    })
  }
  //加载3dtiles
  async load3DTiles(url, params, callback) {

    viewer.scene.globe.depthTestAgainstTerrain = true;
    let self = this

    // -------------------------------------高版本1.107.1------------------------------------------

    try {

      // 创建切面平面集合
      let clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 1, 0), 0), // 平面的方向 以及 平面到原点的距离(z轴)
        ],
        edgeColor: new Cesium.Color.fromCssColorString('#00E524'),
        edgeWidth: 5,
        unionClippingRegions: false
      })


      let tileset = await Cesium.Cesium3DTileset.fromUrl(
        url, {
          maximumScreenSpaceError: 0,
          // dynamicScreenSpaceError: true,
          // preferLeaves: false,
          // clippingPlanes: clippingPlanes,
          ...params
        }
      )


      function createPlaneUpdateFunction(plane) {

        // let primitives = window.viewer.scene._primitives._primitives[0]._primitives
        // for (let i = 0; i < primitives.length; i++)
        // {
        //   let curModelTileChildren = primitives[i].root.children
        //   for (let j = 0; j < curModelTileChildren.length; j++)
        //   {
        //     let curTile = curModelTileChildren[j]
        //     console.log(plane.distance)
        //     if (plane.distance !== 0)
        //     {
        //       let t = -plane.normal.y / plane.distance; // 交点的t值
        //       let position = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, curTile.boundingSphere.center);
        //       if (!position.x && !position.y) continue
        //       let endPoint = new Cesium.Cartesian2(position.x, position.y);
        //       // let direction = plane.normal._cartesian3.clone().constructor.multiplyByScalar(t);
        //       let direction = new Cesium.Cartesian3().constructor.multiplyByScalar(plane.normal._cartesian3.clone(), t, {});
        //       // let intersection = endPoint.constructor.subtract(direction); // 计算交点坐标
        //       let intersection = new Cesium.Cartesian2().constructor.subtract(endPoint, direction, {}); // 计算交点坐标
        //       console.log("横切面交点:", intersection);
        //     }
        //   }
        // }

        return function() {
          plane.distance = self.targetY;
          return plane;
        }
      }

      const startTime = performance.now()
			window.startLoadModelTime = startTime
      tileset.allTilesLoaded.addEventListener(function() {
        // console.log('------------------加载完毕-----------------')
        const endTime = performance.now()
        const executionTime = endTime - startTime;
        self.loadComplete = `加载完毕，总计耗时 ${(executionTime / 1000).toFixed(3) } 秒`

        let boundingSphere = tileset.boundingSphere // 模型的包围球范围
        let radius = boundingSphere.radius // 长度

        if (callback) callback(radius)

        function addPlane() {
          for (var i = 0; i < clippingPlanes.length; ++i) {
            let plane = clippingPlanes.get(i);
            console.log(plane)
            let planeEntity = viewer.entities.add({
              // 笛卡儿坐标系的原点位置为模型外接圆的圆心
              position: boundingSphere.center,
              plane: {
                // 范围
                dimensions: new Cesium.Cartesian2(
                  radius * 2,
                  radius
                ),
                //设置材质透明度
                material: Cesium.Color.WHITE.withAlpha(0.1),
                //使用回调函数，动态改变模型位置
                plane: new Cesium.CallbackProperty(
                  createPlaneUpdateFunction(plane),
                  false
                ),
                // 轮廓
                outline: true,
                //轮廓颜色
                outlineColor: Cesium.Color.WHITE,
              },
            })
          }
        }
        // 添加切面
        // addPlane()
      })
      tileset.loadProgress.addEventListener(function(progress) {
        // console.log('加载进度：', progress);
        self.modelprogress = progress
      });
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
    } catch (error) {
      console.error(`Error creating tileset: ${error}`);
      self.hasErr = `Error creating tileset: ${error}`
    }

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
}
export default InitCesium
