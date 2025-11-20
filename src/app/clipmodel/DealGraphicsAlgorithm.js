// 共面裁剪算法
export function clipSegmentsToRectangleOnPlane(segments, planeCorners)
{
  // 建立坐标系
  const origin = planeCorners[0]
  const uDir = Cesium.Cartesian3.subtract(planeCorners[1], origin, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(uDir, uDir)

  const vDir = Cesium.Cartesian3.subtract(planeCorners[3], origin, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(vDir, vDir)

  const width = Cesium.Cartesian3.distance(planeCorners[0], planeCorners[1])
  const height = Cesium.Cartesian3.distance(planeCorners[0], planeCorners[3])

  // 将三维坐标投影到二维
  function projectToPlane2D(point)
  {
    const offset = Cesium.Cartesian3.subtract(point, origin, new Cesium.Cartesian3())
    const u = Cesium.Cartesian3.dot(offset, uDir)
    const v = Cesium.Cartesian3.dot(offset, vDir)
    return { u, v, original: point }
  }

  // 判断点是否在矩形内
  function isInside(p2d)
  {
    return p2d.u >= 0 && p2d.u <= width && p2d.v >= 0 && p2d.v <= height
  }

  const result = []
  const edgePointsA = [] // u = 0
  const edgePointsB = [] // u = width

  // 辅助函数：计算交点并收集
  function intersectAndCollect(p1, p2, edgeAxis, edgeValue, edgeId)
  {
    const t = (edgeValue - p1[edgeAxis]) / (p2[edgeAxis] - p1[edgeAxis])
    if (t < 0 || t > 1) return null
    const u = p1.u + (p2.u - p1.u) * t
    const v = p1.v + (p2.v - p1.v) * t
    // 精度问题，可能出现 u,v 超出边界
    if (u < -1e-6 || u > width + 1e-6 || v < -1e-6 || v > height + 1e-6) return null
    const p3d = Cesium.Cartesian3.lerp(p1.original, p2.original, t, new Cesium.Cartesian3())
    if (edgeId === 'a') edgePointsA.push(p3d)
    if (edgeId === 'b') edgePointsB.push(p3d)
    return p3d
  }

  for (const [p0, p1] of segments)
  {
    const p0_2d = projectToPlane2D(p0)
    const p1_2d = projectToPlane2D(p1)
    const inside0 = isInside(p0_2d)
    const inside1 = isInside(p1_2d)
    if (inside0 && inside1)
      result.push([p0, p1])
    else
    {
      const newPoints = []
      if (inside0) newPoints.push(p0)
      if (inside1) newPoints.push(p1)
      // 注意方向
      const intersections = [
        intersectAndCollect(p0_2d, p1_2d, 'u', 0, 'a'),       // a边: u = 0
        intersectAndCollect(p0_2d, p1_2d, 'u', width, 'b'),   // b边: u = width
        intersectAndCollect(p0_2d, p1_2d, 'v', -height, null),      // bottom
        intersectAndCollect(p0_2d, p1_2d, 'v', 0, null), // top
      ].filter(Boolean) // 移除非法值
      for (const ip of intersections)
      {
        // 避免重复和自交
        if (!newPoints.some(p => Cesium.Cartesian3.distance(p, ip) < 1e-6))
          newPoints.push(ip)
      }
      if (newPoints.length === 2)
        result.push([newPoints[0], newPoints[1]])
    }
  }

  // 辅助函数：按 vDir 方向排序交点
  function sortAlongDir(points, dir)
  {
    return points.sort((a, b) =>
    {
      const da = Cesium.Cartesian3.dot(Cesium.Cartesian3.subtract(a, origin, new Cesium.Cartesian3()), dir)
      const db = Cesium.Cartesian3.dot(Cesium.Cartesian3.subtract(b, origin, new Cesium.Cartesian3()), dir)
      return da - db
    })
  }
  const sortedA = sortAlongDir(edgePointsA, vDir)
  const sortedB = sortAlongDir(edgePointsB, vDir)

  for (let i = 0; i < sortedA.length - 1; i++)
    result.push([sortedA[i], sortedA[i + 1]])
  for (let i = 0; i < sortedB.length - 1; i++)
    result.push([sortedB[i], sortedB[i + 1]])
  return result
}


// 构建多边形
export function connectSegmentsToPolygonsRobust(segments, viewer, {
  tolerance = 1e-5,
  autoCloseDistance = 10.0,
  debug = false
} = {})
{
  const toKey = (p) => `${p.x.toFixed(10)}_${p.y.toFixed(10)}_${p.z.toFixed(10)}`
  const endpointMap = new Map()

  // 构建端点Map
  for (const seg of segments)
  {
    const [p1, p2] = seg
    const k1 = toKey(p1)
    const k2 = toKey(p2)

    if (!endpointMap.has(k1)) endpointMap.set(k1, [])
    if (!endpointMap.has(k2)) endpointMap.set(k2, [])
    endpointMap.get(k1).push(seg)
    endpointMap.get(k2).push(seg)
  }

  const used = new Set()
  const polygons = []

  for (const seg of segments)
  {
    if (used.has(seg)) continue
    const loop = [seg[0], seg[1]]
    used.add(seg)

    let extended = true
    while (extended)
    {
      extended = false
      const headKey = toKey(loop[0])
      const tailKey = toKey(loop[loop.length - 1])

      for (const key of [headKey, tailKey])
      {
        const candidates = endpointMap.get(key) || []
        for (const candidate of candidates)
        {
          if (used.has(candidate)) continue
          const [s, e] = candidate

          if (Cesium.Cartesian3.distance(e, loop[0]) <= tolerance)
          {
            loop.unshift(s)
            used.add(candidate)
            extended = true
            break
          }
          else if (Cesium.Cartesian3.distance(s, loop[0]) <= tolerance)
          {
            loop.unshift(e)
            used.add(candidate)
            extended = true
            break
          }
          else if (Cesium.Cartesian3.distance(s, loop[loop.length - 1]) <= tolerance)
          {
            loop.push(e)
            used.add(candidate)
            extended = true
            break
          }
          else if (Cesium.Cartesian3.distance(e, loop[loop.length - 1]) <= tolerance)
          {
            loop.push(s)
            used.add(candidate)
            extended = true
            break
          }
        }
        if (extended) break
      }
    }

    // 判断闭合
    if (loop.length >= 3)
    {
      const first = loop[0], last = loop[loop.length - 1]
      const dist = Cesium.Cartesian3.distance(first, last)
      if (dist <= tolerance)
      
        polygons.push(loop)
      
      else if (dist <= autoCloseDistance)
      {
        if (debug)
        {
          viewer.entities.add({
            polyline: {
              positions: [last, first],
              width: 2,
              material: Cesium.Color.PURPLE,
            },
          })
          loop.push(Cesium.Cartesian3.clone(first))
          polygons.push(loop)

          viewer.entities.add({
            position: first,
            point: {
              pixelSize: 15,
              color: Cesium.Color.PURPLE,
            },
          })
          viewer.entities.add({
            position: last,
            point: {
              pixelSize: 15,
              color: Cesium.Color.PURPLE,
            },
          })
        }
      }
      else
      {
        if (debug)
        {
          viewer.entities.add({
            polyline: {
              positions: loop,
              width: 1,
              material: Cesium.Color.PINK,
            },
          })

          viewer.entities.add({
            position: first,
            point: {
              pixelSize: 15,
              color: Cesium.Color.WHITE,
            },
          })
          viewer.entities.add({
            position: last,
            point: {
              pixelSize: 15,
              color: Cesium.Color.WHITE,
            },
          })
        }
      }
    }
  }

  return polygons
}


// 计算并画裁剪多边形
export function makePlaneAndCorners({debug, viewer, doublePoints, kwSdVal})
{
  let upHei = 250   // 地表抬升高度
  // 抬高点位坐标
  let [p0, p1] = doublePoints
  let height = kwSdVal + upHei // 切面高度
  // 计算宽度方向
  const widthDir = Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(widthDir, widthDir)
  // 计算中心点
  const center = Cesium.Cartesian3.lerp(p0, p1, 0.5, new Cesium.Cartesian3())
  // 获取中心点的局部坐标系变换矩阵
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center)
  // 提取局部坐标系的up方向（垂直于地面向上）
  const localUp = Cesium.Cartesian3.fromCartesian4(
    Cesium.Matrix4.getColumn(transform, 2, new Cesium.Cartesian4()),
    new Cesium.Cartesian3()
  )
  Cesium.Cartesian3.normalize(localUp, localUp)
  // 计算垂直方向（垂直于xy平面，向下延伸）
  // 这里使用宽度方向和局部up方向的叉积来确保垂直于地面
  const verticalDir = Cesium.Cartesian3.cross(widthDir, localUp, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(verticalDir, verticalDir)
  // 计算向下延伸的两个点（p0p1作为上边，向下延伸）
  const p0Bottom = Cesium.Cartesian3.add(
    p0,
    Cesium.Cartesian3.multiplyByScalar(localUp, -height, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  )
  const p1Bottom = Cesium.Cartesian3.add(
    p1,
    Cesium.Cartesian3.multiplyByScalar(localUp, -height, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  )
  // console.log('p0:', Cesium.Cartographic.fromCartesian(p0))
  // console.log('p1:', Cesium.Cartographic.fromCartesian(p1))
  // 构成矩形：p0 → p1 → p1Bottom → p0Bottom
  // p0p1是上边，p0Bottom p1Bottom是下边
  const corners = [p0, p1, p1Bottom, p0Bottom]
  // 画出边框
  if (debug)
  {
    viewer.entities.add({
      polyline: {
        positions: [
          p0,
          p1,
          p1Bottom,
          p0Bottom,
          p0,
        ],
        width: 0.5,
        material: Cesium.Color.GOLD,
      },
    })
  }
  
  // 构造剖切平面
  const v1 = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3())
  const v2 = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3())
  const planeNormal = Cesium.Cartesian3.cross(v1, v2, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(planeNormal, planeNormal)
  const planeDistance = -Cesium.Cartesian3.dot(planeNormal, corners[0])
  // console.log('planeDistance:', planeDistance)
  const plane = new Cesium.Plane(planeNormal, planeDistance)

  // 画出剖切平面
  if (debug)
  {
    viewer.entities.add({
      name: 'Plane Normal',
      polyline: {
        positions: [
          corners[0],
          Cesium.Cartesian3.add(corners[0], Cesium.Cartesian3.multiplyByScalar(planeNormal, 100, new Cesium.Cartesian3()), new Cesium.Cartesian3())
        ],
        width: 4,
        material: Cesium.Color.YELLOW
      }
    })
  }
  

  return {
    planeNormal,
    plane,
    corners,
  }
}

/**
 * 将世界坐标下定义的平面（由法线和点定义）转换为 tileset 局部坐标下的 ClippingPlane
 * @param {Cesium.Cartesian3} worldNormal - 世界坐标下的平面法线
 * @param {Cesium.Cartesian3} worldPoint - 世界坐标下的平面上一点
 * @param {Cesium.Matrix4} tilesetTransform - tileset.root.transform
 * @returns {Cesium.ClippingPlane}
 */
export function makeLocalClippingPlane(worldNormal, worldPoint, tilesetTransform)
{
  // 1. 求 transform 的逆矩阵（世界→模型）
  const inverseTransform = Cesium.Matrix4.inverseTransformation(
    tilesetTransform,
    new Cesium.Matrix4()
  )

  // 2. 法线要用旋转部分（3x3矩阵）变换
  const normalMatrix = Cesium.Matrix4.getMatrix3(inverseTransform, new Cesium.Matrix3())
  const localNormal = Cesium.Matrix3.multiplyByVector(
    normalMatrix,
    worldNormal,
    new Cesium.Cartesian3()
  )
  Cesium.Cartesian3.normalize(localNormal, localNormal)

  // 3. 点用完整的逆矩阵变换
  const localPoint = Cesium.Matrix4.multiplyByPoint(
    inverseTransform,
    worldPoint,
    new Cesium.Cartesian3()
  )

  // 4. 重新计算局部平面距离
  const localDistance = -Cesium.Cartesian3.dot(localNormal, localPoint)
  // console.log('localDistance', localDistance)

  // 5. 构造局部剖切平面
  return new Cesium.ClippingPlane(localNormal, localDistance)
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/**
 * 将三维多边形顶点投影到平面上
 * @param {Array<{x,y,z}>} polygon - 三维多边形顶点数组
 * @param {{normal:{x,y,z}, origin:{x,y,z}}} plane - 平面信息
 * @returns {Array<{x,y, ref:{x,y,z}}>} - 投影到平面上的二维坐标和原始点映射
 */
export function projectPolygonToPlane(polygon, plane)
{
  const normal = plane.normal
  const origin = plane.origin

  // 构造平面局部坐标系 u,v
  const arbitrary = Math.abs(normal.x) > 0.9
    ? {x:0, y:1, z:0}
    : {x:1, y:0, z:0}

  function cross(a, b)
  {
    return {
      x: a.y*b.z - a.z*b.y,
      y: a.z*b.x - a.x*b.z,
      z: a.x*b.y - a.y*b.x
    }
  }

  function normalize(v)
  {
    const mag = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
    return {x:v.x/mag, y:v.y/mag, z:v.z/mag}
  }

  function subtract(a, b)
  {
    return {x:a.x-b.x, y:a.y-b.y, z:a.z-b.z}
  }
  function dot(a, b)
  {
    return a.x*b.x + a.y*b.y + a.z*b.z
  }

  const u = normalize(cross(normal, arbitrary))
  const v = normalize(cross(normal, u))

  // 投影函数
  return polygon.map(p=>
  {
    const diff = subtract(p, origin)
    return {
      x: dot(diff, u),
      y: dot(diff, v),
      ref: p   // 保留原始三维坐标
    }
  })
}

/**
 * 将二维投影点还原到三维平面坐标
 * @param {Array<{x,y}>} projectedPoints - 投影后的二维点数组
 * @param {{normal:{x,y,z}, origin:{x,y,z}}} plane - 平面信息
 * @returns {Array<{x,y,z}>} - 三维坐标点
 */
export function unprojectPolygonFromPlane(projectedPoints, plane)
{
  const normal = plane.normal
  const origin = plane.origin

  const arbitrary = Math.abs(normal.x) > 0.9
    ? {x:0, y:1, z:0}
    : {x:1, y:0, z:0}

  function cross(a, b)
  {
    return {
      x: a.y*b.z - a.z*b.y,
      y: a.z*b.x - a.x*b.z,
      z: a.x*b.y - a.y*b.x
    }
  }

  function normalize(v)
  {
    const mag = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
    return {x:v.x/mag, y:v.y/mag, z:v.z/mag}
  }

  function multiplyScalar(v, s)
  {
    return {x:v.x*s, y:v.y*s, z:v.z*s}
  }

  function add(a, b)
  {
    return {x:a.x+b.x, y:a.y+b.y, z:a.z+b.z}
  }

  const u = normalize(cross(normal, arbitrary))
  const v = normalize(cross(normal, u))

  return projectedPoints.map(p2=>
  {
    return add(origin, add(multiplyScalar(u, p2[0]), multiplyScalar(v, p2[1])))
  })
}


