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


// ================== 内存优化后的 traverse --避免内存溢出 ==================
async function traverseTilesetNonRecursive(
  tileset,
  plane,
  {
    viewer,
    debug = false,
    ifFromSelfPlane = false,
    cuttingPlaneCorners = [], // [p0, p1, p1Bottom, p0Bottom]
    tmpSegamaArr = [],
    clippedSegments,
    dcClippedSegments
  }
)
{
  // let bottomDir
  // // console.log('底边：', Cesium.Cartographic.fromCartesian(bottomStart), Cesium.Cartographic.fromCartesian(bottomEnd))
  // const bottomStart = cuttingPlaneCorners[2] // p1Bottom
  // const bottomEnd = cuttingPlaneCorners[3]   // p0Bottom
  // if (ifFromSelfPlane)
  // {
  //   // 底边方向向量（单位向量）
  //   bottomDir = Cesium.Cartesian3.normalize(
  //     Cesium.Cartesian3.subtract(bottomEnd, bottomStart, new Cesium.Cartesian3()),
  //     new Cesium.Cartesian3()
  //   )
  // }

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
    if (obb && !intersectsPlaneOBB(obb, plane)) continue

    const model = tile.content._model
    const rootMatrix = tile.content._computedModelMatrix || tile.content._modelMatrix || tile.computedTransform || Cesium.Matrix4.IDENTITY
    const nodes = model._sceneGraph._runtimeNodes

    let lineSegments = []
    let bottomHits = [] // 用于收集底边 hit 点

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

          // // ======== 底边 × 三角形 ========
          // if (ifFromSelfPlane)
          // {
          //   const hit = Cesium.IntersectionTests.lineSegmentTriangle(bottomStart, bottomEnd, p0, p1, p2)
          //   if (hit)
          //   {
          //     console.log('底边交点：', Cesium.Cartographic.fromCartesian(hit))
          //     // lineSegments.push([bottomStart, hit])
          //     bottomHits.push(hit)
          //     // if (debug)
          //     // {
          //     viewer.entities.add({
          //       position: hit,
          //       point: {
          //         pixelSize: 15,
          //         color: Cesium.Color.RED,
          //       },
          //     })
          //   // }
          //   }
          // }

        } // end triangle loop

        data.positions = null
        data.indices = null
      } // end runtimePrimitives
    } // end nodes
    

    // console.log(dcxx, isPointInsideTileOBB(tile, bottomStart), isPointInsideTileOBB(tile, bottomEnd))

    // ======== 对底边 hit 点排序并成对连接 ========
    // if (bottomHits.length > 1)
    // {
    //   bottomHits.sort((a, b) =>
    //   {
    //     const va = Cesium.Cartesian3.subtract(a, bottomStart, new Cesium.Cartesian3())
    //     const vb = Cesium.Cartesian3.subtract(b, bottomStart, new Cesium.Cartesian3())
    //     return Cesium.Cartesian3.dot(va, bottomDir) - Cesium.Cartesian3.dot(vb, bottomDir)
    //   })

    //   // 两两连接
    //   for (let i = 0; i + 1 < bottomHits.length; i += 2)
    //   {
    //     const seg = [bottomHits[i], bottomHits[i + 1]]
    //     lineSegments.push(seg)

    //     if (debug)
    //     {
    //       viewer.entities.add({
    //         polyline: {
    //           positions: seg,
    //           width: 5,
    //           material: Cesium.Color.GREEN,
    //         },
    //       })
    //     }
    //   }
    // }

    // ======== 剪裁到矩形 ========
    clippedSegments = ifFromSelfPlane
      ? clipSegmentsToRectangleOnPlane(lineSegments, cuttingPlaneCorners)
      : lineSegments


    if (clippedSegments.length)
    {
      tmpSegamaArr.push([dcxx.join('-'), clippedSegments])
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

    // const polygons = connectSegmentsToPolygonsRobust(clippedSegments, viewer, {})
    // for (const polygon of polygons) allPolygonsWithDcmc.push({ polygon, dcxx })

    lineSegments.length = 0
    // bottomHits.length = 0

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
  const tmpSegamaArr = []
  const clippedSegments = []
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
    tmpSegamaArr,
    clippedSegments,
    dcClippedSegments
  })

  // let allDcClipPoints = []
  // let allDcHei = []
  // console.log(tmpSegamaArr)

  // allDcClipPoints = tmpSegamaArr.map(_ => [_[0], _[1].flat().map(_ => Cesium.Cartographic.fromCartesian(_).height)]).reverse()
  // console.log('allDcClipPoints：', allDcClipPoints)

  // for (let i of allDcClipPoints)
  // {
  //   const allZ = i[1]
  //   let minZ = Math.min(...allZ)
  //   let maxZ = Math.max(...allZ)
  //   allDcHei.push([i[0], [minZ, maxZ]])
  // }
  // console.log('地层高度范围：', allDcHei)

  // if (ifFromSelfPlane)
  // {
  //   const bottomStart = Cesium.Cartographic.fromCartesian(cuttingPlaneCorners[2]) // p1Bottom
  //   const bottomEnd = Cesium.Cartographic.fromCartesian(cuttingPlaneCorners[3])   // p0Bottom
  //   console.log('底边：', bottomStart, bottomEnd)

  //   let bottomStartres = allDcHei.filter(_ => Math.abs(bottomStart.height - _[1][0]) < 0.02 || Math.abs(bottomStart.height - _[1][1]) < 0.02)
  //   let bottomEndres = allDcHei.filter(_ => Math.abs(bottomEnd.height - _[1][0]) < 0.02 || Math.abs(bottomEnd.height - _[1][1]) < 0.02)
  //   console.log('bottomStartres属于：', bottomStartres)
  //   console.log('bottomEndres属于：', bottomEndres)
  // }

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

  drawPolygonsWithTexturePrimitive(viewer, allPolygonsWithDcmc, legends)
  return { allPolygonsWithDcmcLen: allPolygonsWithDcmc.length, costtime, tmpSegamaArr }
}

// ================== runPolygonClips ==================
export async function runPolygonClips({ tileset, viewer, legends, xPosition, vue_this, axis })
{
  const res = createClippingPlaneAndSurface({ position: xPosition, tileset, viewer, axis })
  const { plane, corners, worldCenter, worldNormal } = res
  await computeAndDrawCutPolygons({ tileset, plane, viewer, vue_this, legends })
}
