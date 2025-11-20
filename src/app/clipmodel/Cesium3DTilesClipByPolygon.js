import extractPrimitiveVertexData from './ExtractPrimitiveVertexData.js'
import { getTileFeatureDcmc, intersectsPlaneOBB, intersectsPlaneAABB, getPositionAttribute, createClippingPlaneAndSurface, isPointInsideTileOBB } from '../utils/ModelOps.js'
import { drawPolygonsWithTexturePrimitive, drawPolygonsWithPrimitive } from './DealTexures.js'
import { clipSegmentsToRectangleOnPlane, connectSegmentsToPolygonsRobust } from './DealGraphicsAlgorithm.js'

function getCutSegment(cut)
{
  if (cut.positions.length < 5)
    console.log('和三角形交点少于5个：', cut.positions)
  if (!cut || cut.positions.length < 5) return null
  return [cut.positions[3], cut.positions[4]]
}

const scratchP0 = new Cesium.Cartesian3()
const scratchP1 = new Cesium.Cartesian3()
const scratchP2 = new Cesium.Cartesian3()

// 获取模型所有点位
export async function getModelAllVec()
{
  const queue = tileset.root.children.length ? [...tileset.root.children] : [tileset.root]
  let stepCounter = 0

  while (queue.length > 0)
  {
    const tile = queue.shift()
    if (tile.children && tile.children.length > 0) queue.push(...tile.children)


    if (!tile.content || !tile.content._model || !tile.content._model._sceneGraph) continue

    const obb = tile._boundingVolume?.boundingVolume?.orientedBoundingBox || tile._boundingVolume?._orientedBoundingBox

    const model = tile.content._model
    const rootMatrix = tile.content._computedModelMatrix || tile.content._modelMatrix || tile.computedTransform || Cesium.Matrix4.IDENTITY
    const nodes = model._sceneGraph._runtimeNodes

    let lineSegments = []

    for (const node of nodes)
    {
      for (const rp of node.runtimePrimitives)
      {
        const primitive = rp.primitive


        const data = extractPrimitiveVertexData(primitive)
        const { positions, indices } = data
        const center = tile.boundingSphere.center // ECEF 世界坐标

        for (let i = 0; i < positions.length; i += 3)
        {
          const p_local = new Cesium.Cartesian3(
            positions[i],
            positions[i+1],
            positions[i+2]
          )

          // 直接加上 OBB / boundingVolume 中心
          const p_world = Cesium.Cartesian3.add(p_local, center, new Cesium.Cartesian3())

          const p_geo = Cesium.Cartographic.fromCartesian(p_world) // 经度、纬度、高度

          viewer.entities.add({
            position: p_world,
            point: {
              pixelSize: 15,
              color: Cesium.Color.WHITE,
            },
          })
        }

        data.positions = null
        data.indices = null
      }
    }

    stepCounter++
    if (stepCounter % 20 === 0) await Promise.resolve()
  }
}


// ================== 内存优化后的 traverse --避免内存溢出 ==================
async function traverseTilesetNonRecursive(
  tileset,
  plane,
  {
    viewer,
    debug = false,
    ifFromSelfPlane = false,
    cuttingPlaneCorners = [], // [p0, p1, p1Bottom, p0Bottom]
    dcClippedSegments
  }
)
{
  const queue = [...tileset.root.children]
  let stepCounter = 0

  while (queue.length > 0)
  {
    const tile = queue.shift()

    if (!tile.content || !tile.content._model || !tile.content._model._sceneGraph) continue

    const dcxxs = getTileFeatureDcmc(tile)
    if (!dcxxs || dcxxs.length === 0) continue
    const dcxx = dcxxs[0]

    const obb = tile._boundingVolume?.boundingVolume?.orientedBoundingBox || tile._boundingVolume?._orientedBoundingBox
    if (obb && !intersectsPlaneOBB(obb, plane))
    {
      console.log('step tile')
      continue
    }

    const model = tile.content._model
    const rootMatrix = tile.content._computedModelMatrix || tile.content._modelMatrix || tile.computedTransform || Cesium.Matrix4.IDENTITY
    const nodes = model._sceneGraph._runtimeNodes

    let lineSegments = []

    for (const node of nodes)
    {
      for (const rp of node.runtimePrimitives)
      {
        const primitive = rp.primitive

        const posAtt = getPositionAttribute(primitive)
        if (!posAtt || !posAtt.min || !posAtt.max) continue
        if (!intersectsPlaneAABB(posAtt.min, posAtt.max, rootMatrix, plane)) continue

        const data = extractPrimitiveVertexData(primitive)
        if (!data) continue
        const { positions, indices } = data

        for (let i = 0; i < indices.length; i += 3)
        {
          const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2]

          const p0 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i0 * 3), scratchP0)
          const p1 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i1 * 3), scratchP1)
          const p2 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i2 * 3), scratchP2)

          // ======== 平面 × 三角形 ========
          const cut = Cesium.IntersectionTests.trianglePlaneIntersection(p0, p1, p2, plane)
          if (cut)
          {
            const segment = getCutSegment(cut)
            if (segment) lineSegments.push(segment)
          }
        }

        data.positions = null
        data.indices = null
      }
    }

    // ======== 剪裁到矩形 ========
    // let clippedSegments = ifFromSelfPlane
    //   ? clipSegmentsToRectangleOnPlane(lineSegments, cuttingPlaneCorners)
    //   : lineSegments

    let clippedSegments = lineSegments
    if (clippedSegments.length)
    {
      if (dcClippedSegments[dcxx]) dcClippedSegments[dcxx].push(...clippedSegments)
      else dcClippedSegments[dcxx] = clippedSegments
    }

    if (debug)
    {
      clippedSegments.forEach(segment =>
      {
        viewer.entities.add({
          polyline: {
            positions: segment,
            width: 3,
            material: Cesium.Color.RED,
          },
        })
      })
    }
    if (tile.children && tile.children.length > 0) queue.push(...tile.children)
    stepCounter++
    if (stepCounter % 20 === 0) await Promise.resolve()
  }
}


// ================== computeAndDrawCutPolygons ==================
export async function computeAndDrawCutPolygons({
  tileset, plane, viewer, legends,
  debug = false, ifFromSelfPlane = false, cuttingPlaneCorners,
})
{
  const allPolygonsWithDcmc = []
  const dcClippedSegments = {}
  let costtime = 0

  const start = Date.now()
  // 存储每个地层的坐标点集合
  // 获取allPolygonsWithDcmc数据
  await traverseTilesetNonRecursive(tileset, plane, {
    viewer,
    debug,
    ifFromSelfPlane,
    cuttingPlaneCorners,
    dcClippedSegments
  })

  console.log(dcClippedSegments)

  for (let dcxx in dcClippedSegments)
  {
    let polygon = connectSegmentsToPolygonsRobust(dcClippedSegments[dcxx], viewer, {})
    allPolygonsWithDcmc.push({ polygon, dcxx })
  }

  console.log(allPolygonsWithDcmc)

  const end = Date.now()
  costtime = (end - start) / 1000
  console.log(`⏰单面耗时: ${costtime} 秒`)

  if (debug)
  {
    allPolygonsWithDcmc.forEach(p =>
    {
      p.polygon.forEach(p2 =>
      {
        p2.forEach(p3 =>
        {
          viewer.entities.add({
            position: p3,
            point: {
              pixelSize: 15,
              color: Cesium.Color.BLUE,
            },
          })
        })
      })
    })
  }

  // drawPolygonsWithTexturePrimitive(viewer, allPolygonsWithDcmc, legends)
  return { allPolygonsWithDcmc, costtime }
}

// ================== runPolygonClips ==================
export async function runPolygonClips({ tileset, viewer, legends, xPosition, vue_this, axis })
{
  const res = createClippingPlaneAndSurface({ position: xPosition, tileset, viewer, axis })
  // const res = createClippingPlaneAndSurface({ xPosition, tileset, viewer, axis })
  const { plane, corners, worldCenter, worldNormal } = res
  await computeAndDrawCutPolygons({ tileset, plane, viewer, vue_this, legends })
}
