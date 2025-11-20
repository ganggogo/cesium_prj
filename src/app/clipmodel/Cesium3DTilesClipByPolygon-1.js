import extractPrimitiveVertexData from './ExtractPrimitiveVertexData.js'
import { getTileFeatureDcmc, intersectsPlaneOBB, intersectsPlaneAABB, getPositionAttribute, createClippingPlaneAndSurface } from '../utils/ModelOps.js'
import {drawPolygonsWithTexturePrimitive, drawPolygonsWithPrimitive} from './DealTexures.js'
import {clipSegmentsToRectangleOnPlane, connectSegmentsToPolygonsRobust} from './DealGraphicsAlgorithm.js'

function getCutSegment(cut)
{
  if (!cut || cut.positions.length < 5) return null
  return [cut.positions[3], cut.positions[4]]
}


const scratchP0 = new Cesium.Cartesian3()
const scratchP1 = new Cesium.Cartesian3()
const scratchP2 = new Cesium.Cartesian3()

async function traverseTilesetNonRecursive(tileset, plane, {
  viewer,
  debug = false,
  ifFromSelfPlane = false,
  cuttingPlaneCorners = [],
  tmpSegamaArr = [],
  allPolygonsWithDcmc = [],
})
{
  // 1.队列式遍历 tileset
  // const queue = [...[...tileset.root.children].splice(0, 20)]
  const queue = [...tileset.root.children]
  while (queue.length > 0)
  {
    const tile = queue.shift()
    if (!tile.content || !tile.content._model || !tile.content._model._sceneGraph) continue

    const dcxxs = getTileFeatureDcmc(tile)
    if (!dcxxs || dcxxs.length === 0) continue
    const dcxx = dcxxs[0]

    // 2.剔除不在剖切面上的tile
    const obb = tile._boundingVolume?.boundingVolume?.orientedBoundingBox || tile._boundingVolume?._orientedBoundingBox
    if (obb && !intersectsPlaneOBB(obb, plane))
    {
      console.log('tile 不相交')
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
        let positonAtts = getPositionAttribute(primitive)
        if (!positonAtts || !positonAtts.min || !positonAtts.max) continue
        let returnFalse = intersectsPlaneAABB(positonAtts.min, positonAtts.max, rootMatrix, plane)
        if (!returnFalse)
        {
          console.log('primitive 不相交')
          continue
        }
        // 3.剔除不在剖切面上的primitive
        const data = extractPrimitiveVertexData(primitive)
        if (!data) continue

        const { positions, indices } = data

        for (let i = 0; i < indices.length; i += 3)
        {
          const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2]

          const p0 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i0 * 3), scratchP0)
          const p1 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i1 * 3), scratchP1)
          const p2 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i2 * 3), scratchP2)

          // 4.得到剖切面和模型三角面的2个交点
          const cut = Cesium.IntersectionTests.trianglePlaneIntersection(p0, p1, p2, plane)
          if (cut)
          {
            const segment = getCutSegment(cut)
            if (segment) lineSegments.push(segment)
          }
        }
      }
    }

    // 5.收集剖切面和模型三角面的交点（包含面内裁切）
    const clippedSegments = ifFromSelfPlane
      ? clipSegmentsToRectangleOnPlane(lineSegments, cuttingPlaneCorners)
      : lineSegments

    if (clippedSegments.length)
    
      tmpSegamaArr.push([dcxx.join('-'), clippedSegments])
    

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
        segment.forEach(point =>
        {
          viewer.entities.add({
            position: point,
            point: {
              pixelSize: 5,
              color: Cesium.Color.BLUE,
            },
          })
        })
      })
    }

    // console.log(clippedSegments)

    // 6.线段拼接成多边形
    const polygons = connectSegmentsToPolygonsRobust(clippedSegments, viewer, {})
    for (const polygon of polygons)
      allPolygonsWithDcmc.push({ polygon, dcxx })

    // 推入子 tile
    if (tile.children && tile.children.length > 0)
      queue.push(...tile.children)
  }
}


export async function computeAndDrawCutPolygons({ tileset, plane, viewer, legends, debug = false, ifFromSelfPlane = false, cuttingPlaneCorners, })
{
  const allPolygonsWithDcmc = []
  let allPolygonsWithDcmcLen = 0
  const tmpSegamaArr = []
  let costtime = 0

  // 统计耗时
  const start = Date.now()
  await traverseTilesetNonRecursive(tileset, plane, {
    viewer,
    debug,
    ifFromSelfPlane,
    cuttingPlaneCorners,
    tmpSegamaArr,
    allPolygonsWithDcmc,
  })
  const end = Date.now()
  costtime = (end - start) / 1000
  console.log(`⏰单面耗时: ${costtime} 秒`)

  allPolygonsWithDcmcLen = allPolygonsWithDcmc.length

  if (debug)
  {
    allPolygonsWithDcmc.forEach(p =>
    {
      p.polygon.forEach(p2 =>
      {
        viewer.entities.add({
          position: p2,
          point: {
            pixelSize: 15,
            color: Cesium.Color.BLUE,
          },
        })
      })
    })
  }


  // 带材质
  drawPolygonsWithTexturePrimitive(viewer, allPolygonsWithDcmc, legends)

  
  // 纯色
  // drawPolygonsWithPrimitive(viewer, allPolygonsWithDcmc.map(p => p.polygon));
  return { allPolygonsWithDcmcLen, costtime, tmpSegamaArr }
}


export async function runPolygonClips({ tileset, viewer, legends, xPosition, vue_this })
{
  const plane = createClippingPlaneAndSurface({ xPosition, tileset, viewer })
  await computeAndDrawCutPolygons({ tileset, plane, viewer, vue_this, legends })
}

