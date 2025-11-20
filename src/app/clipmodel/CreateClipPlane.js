import { getTileFeatureDcmc } from '../utils/ModelOps.js'
import {computeAndDrawCutPolygons} from './Cesium3DTilesClipByPolygon.js'
import {makePlaneAndCorners, makeLocalClippingPlane, projectPolygonToPlane, unprojectPolygonFromPlane} from './DealGraphicsAlgorithm.js'
import { drawPolygonsWithTexturePrimitive, drawPolygonsWithPrimitive } from './DealTexures.js'

const turf = require('@turf/turf')

let clickHandler1 = null // 点击要素专用句柄
let clickHandler2 = null // 绘制剖面线专用句柄
let clickHandlers = [] // 全局点击事件句柄集合

export function applySideClipping({ xPosition, tileset, axis = 'z' })
{
  let fxfx = null
  if (axis === 'x') fxfx = new Cesium.Cartesian3(1.0, 0.0, 0.0)
  if (axis === 'y') fxfx = new Cesium.Cartesian3(0.0, 1.0, 0.0)
  if (axis === 'z') fxfx = new Cesium.Cartesian3(0.0, 0.0, 1.0)
  let clippingPlane = new Cesium.ClippingPlane(
    // new Cesium.Cartesian3(1.0, 0.0, 0.0),
    fxfx,
    -xPosition
  )

  tileset.clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: [clippingPlane],
    enabled: true
  })

  return clippingPlane
}

export function addClick1ListenEvent({ viewer, vue_this })
{
  destroyClickHandler()
  // 创建新的点击事件处理器
  clickHandler1 = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandlers.push(clickHandler1)
  // 监听左键点击事件
  clickHandler1.setInputAction(function(click)
  {
    let pick = viewer.scene.pick(click.position)
    if (!pick)
    {
      console.log('没有拾取到模型！')
      return
    }
    console.log(pick)
    if (pick && pick._content)
      vue_this.$message.success(`${getTileFeatureDcmc(pick)[0][0]}${getTileFeatureDcmc(pick)[0][1]}`)
    if (pick && !pick._content && typeof pick.id === 'string')
      vue_this.$message.success(`${pick.id}`)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}


// 销毁句柄
export function destroyClickHandler()
{
  for (let i = 0; i < clickHandlers.length; i++)
  {
    if (clickHandlers[i] && !clickHandlers[i].isDestroyed())
      clickHandlers[i].destroy()
  }
}

// -----------------------------start --处理剖切面线----------------------------------


// 存储点的集合
let pointsCollection = []
let pointEntities = []
let lineEntities = []
export function addClick2ListenEvent({viewer })
{
  // 如果已存在点击事件处理器，先销毁它
  destroyClickHandler()
  // 点击事件处理函数
  clickHandler2 = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandlers.push(clickHandler2)
  clickHandler2.setInputAction(function(click)
  {
    // 获取点击位置的3D坐标
    // const ray = viewer.camera.getPickRay(click.position)
    // const position = viewer.scene.globe.pick(ray, viewer.scene)

    // // 获取点击位置的3D坐标
    const ray = viewer.camera.getPickRay(click.position)
    const position = viewer.scene.pickPosition(click.position)  // 这个方法会考虑深度缓冲
      
    if (!position) return
      
    // 将点添加到集合中
    pointsCollection.push(position)
      
    // 清除之前的点和线
    clearEntities(viewer)
      
    // 绘制所有点
    pointsCollection.forEach((point, index) =>
    {
      const pointEntity = viewer.entities.add({
        position: point,
        point: {
          pixelSize: 10,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: (index + 1).toString(),
          font: '14pt sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })
      pointEntities.push(pointEntity)
    })
      
    // 如果有多于一个点，绘制连线
    if (pointsCollection.length > 1)
    {
      let lineEntity = viewer.entities.add({
        polyline: {
          positions: pointsCollection,
          width: 3,
          material: Cesium.Color.BLUE,
          clampToGround: true
        }
      })
      lineEntities.push(lineEntity)
    }
      
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

// 清除所有绘制的实体
function clearEntities(viewer)
{
  pointEntities.forEach(entity => viewer.entities.remove(entity))
  pointEntities = []
  lineEntities.forEach(entity => viewer.entities.remove(entity))
  lineEntities = []
}

// 清除所有点和线（可用于重置）
export function clearAllLine(viewer)
{
  clearEntities(viewer)
  pointsCollection = []
}

// 结束绘制-主要针对封闭绘制
export function endDrawLine(viewer, cliptype)
{
  if (cliptype === 'kw')
  {
    // 将点的首尾连接起来
    pointsCollection.push(pointsCollection[0])
    // 绘制封闭剖切线
    let lineEntity = viewer.entities.add({
      polyline: {
        positions: pointsCollection,
        width: 3,
        material: Cesium.Color.BLUE,
        clampToGround: true
      }
    })
    lineEntities.push(lineEntity)
  }
}

// -----------------------------end --处理剖切面线----------------------------------


function setSameHeight(points)
{
  // 获取三个点中的最大高度值
  let maxHeight = 0
  let allRadiansPoints = []
  let allCartesian3Points = []
  points.forEach(_ =>
  {
    allRadiansPoints.push(Cesium.Cartographic.fromCartesian(_))
  })
  maxHeight = Math.max(...allRadiansPoints.map(_ => _.height))
  // 设置所有点的高度为最大高度
  allRadiansPoints.forEach(_ =>
  {
    _.height = maxHeight + 250
  })
  console.log(allRadiansPoints)
  allCartesian3Points = allRadiansPoints.map(_ => Cesium.Cartesian3.fromRadians(_.longitude, _.latitude, _.height))
  return allCartesian3Points
}

// 典型问题测试坐标点  -- 横琴模型开挖
let keyPointsRec1 =
[
  {x: -2357368.6384874354, y: 5424519.420367973, z: 2379088.1081548063},
  {x: -2357405.3345937715, y: 5424825.701593009, z: 2378359.7083913307},
  {x: -2357859.0349651705, y: 5424677.986268467, z: 2378248.563408807},
  {x: -2357368.6384874354, y: 5424519.420367973, z: 2379088.1081548063}
]

// 典型问题测试坐标点  -- 珠海工程地质开挖/剖面
let keyPointsRec2 =
[
  // {x: -2341926.9052013564, y: 5425445.762883688, z: 2392805.1652575745},
  {x: -2343118.2203583373, y: 5428027.360243472, z: 2385799.7518120375},
  {x: -2347093.680798724, y: 5426396.485072677, z: 2385541.363180437},
  // {x: -2346100.223925212, y: 5424028.219303437, z: 2391963.1924311556},
  // {x: -2341926.9052013564, y: 5425445.762883688, z: 2392805.1652575745}
]

// 绘制剖切线-剖切模型
/**
 * @method startClipModel
 * @param {Object} options
 * @param {Object} options.viewer - Cesium.Viewer对象
 * @param {Object} options.tileset - Cesium.Cesium3DTileset对象
 * @param {Object} options.legends - 图例对象
 * @param {Boolean} [options.debug=false] - 是否开启调试模式
 * @param {Function} [options.calllFn] - 剖切完成后的回调函数
 * @param {Number} [options.kwSdVal] - 剖切面厚度
 */
export async function startClipModel({viewer, vue_this, tileset, legends, debug = false, calllFn, kwSdVal})
{
  // pointsCollection = keyPointsRec2
  if (!pointsCollection?.length || pointsCollection.length < 2)
  {
    vue_this.$message.error('请先绘制剖切线！')
    return
  }

  // 对三个点设置相同最大高度
  pointsCollection = setSameHeight(pointsCollection)
  let doublePoints = []
  // 按顺序连线
  for (let i = 0; i < pointsCollection.length - 1; i++)
    doublePoints.push([pointsCollection[i], pointsCollection[i + 1]])

  let planeAndCorners = doublePoints.map(points => makePlaneAndCorners({debug, viewer, doublePoints: points, kwSdVal}))
  console.log(planeAndCorners)


  let allPolygonsWithDcmcLen= 0
  let dcArrCollect = {}
  let costtimeCollect = 0

  let clippingPlanes = []
  // 遍历剖切面
  for (let i = 0; i < planeAndCorners.length; i++)
  {
    const { plane, corners, planeNormal } = planeAndCorners[i]
    let clippingPlane = makeLocalClippingPlane(
      planeNormal,
      corners[0],
      tileset.root.transform
    )
    clippingPlanes.push(clippingPlane)
    let { allPolygonsWithDcmc, costtime } = await computeAndDrawCutPolygons(
      {
        tileset,
        plane,
        viewer,
        vue_this,
        legends,
        cuttingPlaneCorners: corners,
        debug: false,
        ifFromSelfPlane: true
      }
    )

    // 取交集

    function pointPlaneDistance(p, normal)
    {
      const diff = Cesium.Cartesian3.subtract(p, corners[0], new Cesium.Cartesian3())
      return Cesium.Cartesian3.dot(diff, normal)
    }

    console.log(allPolygonsWithDcmc)
    let customPolygon = [...corners, corners[0]]

    let newAllPolygonsWithDcmc = []

    allPolygonsWithDcmc.forEach(_ =>
    {
      let dcxx = _.dcxx
      let polygons = _.polygon

      let transcoor1 = projectPolygonToPlane(customPolygon, {
        normal: planeNormal,
        origin: corners[0]
      })
      // console.log(transcoor1)
      let transcoor11 = turf.polygon([transcoor1.map(_ => [_.x, _.y])])
      polygons.forEach(_ =>
      {
        let transcoor2 = projectPolygonToPlane(_, {
          normal: planeNormal,
          origin: corners[0]
        })
        // console.log(transcoor2)
        let transcoor21 = turf.polygon([transcoor2.map(_ => [_.x, _.y])])

        let intersectRes = turf.intersect(turf.featureCollection([transcoor11, transcoor21]))
        // console.log(dcxx, intersectRes)

        if (intersectRes?.geometry.coordinates[0].length > 0)
        {
          let coordinates = intersectRes.geometry.coordinates
          coordinates.forEach(_ =>
          {
            let d3dcoord = unprojectPolygonFromPlane(intersectRes.geometry.type === 'MultiPolygon' ? _[0] : _, {
              normal: planeNormal,
              origin: corners[0]
            })
            console.log(dcxx, '------', d3dcoord)


            // let lineEntity = viewer.entities.add({
            //   polyline: {
            //     positions: d3dcoord,
            //     width: 5,
            //     material: Cesium.Color.WHITE
            //   }
            // })
            // lineEntities.push(lineEntity)
            if (newAllPolygonsWithDcmc.find(_ => _.dcxx === dcxx))
              newAllPolygonsWithDcmc.find(_ => _.dcxx === dcxx).polygon.push(d3dcoord)
            else
              newAllPolygonsWithDcmc.push({ dcxx, polygon: [d3dcoord] })
          })
        }
      })
    })

    drawPolygonsWithTexturePrimitive(viewer, newAllPolygonsWithDcmc, legends)
    

    allPolygonsWithDcmc.forEach(_ =>
    {
      allPolygonsWithDcmcLen += _.polygon.length
      if (dcArrCollect.hasOwnProperty(_.dcxx))
        dcArrCollect[_.dcxx].push(_.polygon.flat())
      else
        dcArrCollect[_.dcxx] = [_.polygon.flat()]
    })
    costtimeCollect += costtime

    vue_this.$message.success(`第 ${i + 1} 剖切完成，剩余 ${planeAndCorners.length - i - 1} 个剖切面`)
  }

  console.log(clippingPlanes)

  const segamaArrCollectResult = Object.entries(dcArrCollect)
  // 供给外部读取地层数据
  window.segamaArrCollectResult = segamaArrCollectResult

  console.log(`生成封边面数: ${allPolygonsWithDcmcLen}`)
  console.log(`总耗时: ${costtimeCollect.toFixed(2)} 秒`)

  vue_this.$message.success(`生成封边面数: ${allPolygonsWithDcmcLen}, 总耗时: ${costtimeCollect.toFixed(2)} 秒`)
  
  // 剖切模型
  tileset.clippingPlanes = new Cesium.ClippingPlaneCollection({
    // planes: [clippingPlanes[1]],
    planes: clippingPlanes,
    enabled: true,
    unionClippingRegions: true,
    modelMatrix: Cesium.Matrix4.IDENTITY
  })
  // 执行回调
  if (calllFn) calllFn()
}


