import extractPrimitiveVertexData from './ExtractPrimitiveVertexData.js'

//  射线与三角形相交（双面）
function rayTriangleIntersection(rayOrigin, rayDir, p0, p1, p2)
{
  const ray = new Cesium.Ray(rayOrigin, rayDir)
  return (
    Cesium.IntersectionTests.rayTriangle(ray, p0, p1, p2) ||
    Cesium.IntersectionTests.rayTriangle(ray, p0, p2, p1)
  )
}

//  射线与 AABB 相交判断
function rayIntersectsAABB(rayOrigin, rayDir, aabbMin, aabbMax)
{
  let tmin = -Infinity
  let tmax = Infinity

  const components = ['x', 'y', 'z']

  for (let k = 0; k < 3; k++)
  {
    const axis = components[k]
    const originVal = rayOrigin[axis]
    const dirVal = rayDir[axis]

    if (Math.abs(dirVal) < Cesium.Math.EPSILON7)
    {
      // 射线平行该轴
      if (originVal < aabbMin[axis] || originVal > aabbMax[axis])
      
        return false // 在包围盒外
      
    }
    else
    {
      const invD = 1.0 / dirVal
      let t0 = (aabbMin[axis] - originVal) * invD
      let t1 = (aabbMax[axis] - originVal) * invD

      if (invD < 0.0)
      {
        const temp = t0
        t0 = t1
        t1 = temp
      }

      tmin = Math.max(tmin, t0)
      tmax = Math.min(tmax, t1)

      if (tmax < tmin) return false
    }
  }

  return true
}


//  异步遍历 tile
async function traverseFromChildren(tileset, callback)
{
  async function traverse(tile)
  {
    if (tile.content && tile.content._model && tile.content._model._sceneGraph)
    
      await callback(tile)
    
    if (tile.children)
    {
      for (const child of tile.children)
      
        await traverse(child)
      
    }
  }
  if (tileset.root) await traverse(tileset.root)
}

//  获取 tile 的矩阵
function getTileModelMatrix(tile)
{
  return (
    tile.content._computedModelMatrix ||
    tile.content._modelMatrix ||
    tile.computedTransform ||
    Cesium.Matrix4.IDENTITY
  )
}

//  绘制蓝色调试三角形
function drawDebugTriangles(triangles, viewer)
{
  const instances = []
  for (let i = 0; i < triangles.length && i < 500; i++)
  {
    const [p0, p1, p2] = triangles[i]
    const positions = [p0, p1, p2, p0]

    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({ positions, width: 1.0 }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLUE),
        },
      })
    )
  }

  const primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PolylineColorAppearance(),
    asynchronous: false
  })

  viewer.scene.primitives.add(primitive)
}

function getPositionAttribute(primitive)
{
  const attrs = primitive.attributes
  if (!attrs) return null

  for (const key in attrs)
  {
    const attr = attrs[key]
    if (attr && attr.name === 'POSITION')
    
      return attr
    
  }

  return null
}

//  主检测逻辑（加入 AABB 剔除）
async function findRayModelIntersections(ray, tileset, viewer)
{
  const intersections = []

  await traverseFromChildren(tileset, async(tile) =>
  {
    const model = tile.content._model
    const rootMatrix = getTileModelMatrix(tile)
    const nodes = model._sceneGraph._runtimeNodes

    const debugTriangles = []

    for (const node of nodes)
    {
      for (const rp of node.runtimePrimitives)
      {
        const primitive = rp.primitive
        const data = extractPrimitiveVertexData(primitive)
        if (!data) continue

        const { positions, indices } = data

        // ✅ 获取 POSITION 属性中的 min/max
        const attr = getPositionAttribute(primitive)
        if (!attr || !attr.min || !attr.max) continue

        const localMin = attr.min
        const localMax = attr.max

        const corners = [
          new Cesium.Cartesian3(localMin.x, localMin.y, localMin.z),
          new Cesium.Cartesian3(localMax.x, localMin.y, localMin.z),
          new Cesium.Cartesian3(localMin.x, localMax.y, localMin.z),
          new Cesium.Cartesian3(localMin.x, localMin.y, localMax.z),
          new Cesium.Cartesian3(localMax.x, localMax.y, localMin.z),
          new Cesium.Cartesian3(localMax.x, localMin.y, localMax.z),
          new Cesium.Cartesian3(localMin.x, localMax.y, localMax.z),
          new Cesium.Cartesian3(localMax.x, localMax.y, localMax.z),
        ]

        let worldMin = new Cesium.Cartesian3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
        let worldMax = new Cesium.Cartesian3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)

        for (const corner of corners)
        {
          const worldCorner = Cesium.Matrix4.multiplyByPoint(rootMatrix, corner, new Cesium.Cartesian3())
          Cesium.Cartesian3.minimumByComponent(worldMin, worldCorner, worldMin)
          Cesium.Cartesian3.maximumByComponent(worldMax, worldCorner, worldMax)
        }

        if (!rayIntersectsAABB(ray.origin, ray.direction, worldMin, worldMax))
        {
          console.log('❌ AABB 剔除')
          continue
        }

        for (let i = 0; i < indices.length; i += 3)
        {
          // console.log('🚀 三角面检测')
          const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2]

          const p0 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i0 * 3), new Cesium.Cartesian3())
          const p1 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i1 * 3), new Cesium.Cartesian3())
          const p2 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i2 * 3), new Cesium.Cartesian3())

          const hit = rayTriangleIntersection(ray.origin, ray.direction, p0, p1, p2)
          if (hit)
          
            intersections.push({ point: hit, triangle: [p0, p1, p2], tile })
          

          if (i < 500) debugTriangles.push([p0, p1, p2])
        }
      }
    }

    drawDebugTriangles(debugTriangles, viewer)
  })

  return intersections
}


export default function runClips({viewer, tileset})
{
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)

  handler.setInputAction(async function(movement)
  {
    viewer.entities.removeAll()

    const scene = viewer.scene
    const clickPosition = scene.pickPosition(movement.position)
    if (!clickPosition)
    {
      console.warn('❌ 无效点击点')
      return
    }

    const pick = scene.pick(movement.position)
    if (!pick || !pick._content)
    {
      console.warn('❌ 未命中模型 tile')
      return
    }

    const tile = pick._content.tile
    const model = pick._content._model
    const rootMatrix = getTileModelMatrix(tile)
    const nodes = model._sceneGraph._runtimeNodes

    let selectedNormal = null
    let clickedTriangle = null

    for (const node of nodes)
    {
      for (const rp of node.runtimePrimitives)
      {
        const primitive = rp.primitive
        const data = extractPrimitiveVertexData(primitive)
        if (!data) continue

        const { positions, indices } = data

        for (let i = 0; i < indices.length; i += 3)
        {
          const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2]
          const p0 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i0 * 3), new Cesium.Cartesian3())
          const p1 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i1 * 3), new Cesium.Cartesian3())
          const p2 = Cesium.Matrix4.multiplyByPoint(rootMatrix, Cesium.Cartesian3.fromArray(positions, i2 * 3), new Cesium.Cartesian3())

          const normal = Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.cross(
              Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3()),
              Cesium.Cartesian3.subtract(p2, p0, new Cesium.Cartesian3()),
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          )

          const plane = Cesium.Plane.fromPointNormal(p0, normal)
          const distance = Math.abs(Cesium.Plane.getPointDistance(plane, clickPosition))

          if (distance < 0.01)
          {
            selectedNormal = normal
            clickedTriangle = { triangle: [p0, p1, p2], point: clickPosition, tile }
            break
          }
        }

        if (selectedNormal) break
      }
      if (selectedNormal) break
    }

    if (!selectedNormal || !clickedTriangle)
    {
      console.warn('❌ 未找到点击点附近的三角面法线')
      return
    }

    // ✅ 添加点击三角面命中点（绿色点）
    viewer.entities.add({
      position: clickPosition,
      point: { pixelSize: 10, color: Cesium.Color.GREEN }
    })

    // ✅ 添加点击三角形调试线框
    viewer.entities.add({
      polyline: {
        positions: [...clickedTriangle.triangle, clickedTriangle.triangle[0]],
        width: 2,
        material: Cesium.Color.CYAN
      }
    })

    // ✅ 发射射线（沿法线反向）
    const rayOrigin = clickPosition
    const rayDirection = Cesium.Cartesian3.negate(selectedNormal, new Cesium.Cartesian3())
    const ray = new Cesium.Ray(rayOrigin, rayDirection)
    const rayEnd = Cesium.Cartesian3.add(
      rayOrigin,
      Cesium.Cartesian3.multiplyByScalar(rayDirection, 1000, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    )

    viewer.entities.add({
      polyline: {
        positions: [rayOrigin, rayEnd],
        width: 2,
        material: Cesium.Color.YELLOW
      }
    })

    // ✅ 查找后续命中点
    const hits = await findRayModelIntersections(ray, tileset, viewer)

    // 添加点击面为第一个命中点
    hits.unshift(clickedTriangle)

    for (const hit of hits)
    {
      viewer.entities.add({
        position: hit.point,
        point: { pixelSize: 5, color: Cesium.Color.RED }
      })
    }

    console.log('命中数量:', hits.length)
    console.log('命中点:', hits)
    viewer.scene.requestRender()
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}
