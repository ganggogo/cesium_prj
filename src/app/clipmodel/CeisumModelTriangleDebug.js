// CesiumModelTriangleDebugChunks.js
import extractPrimitiveVertexData from './ExtractPrimitiveVertexData.js'

let debugWirePrimitives = [] // 存放所有 chunk 的 Primitive（便于清理）

/**
 * 打开 wireframe（分块安全版）
 * @param {Object} options
 * @param {Cesium.Cesium3DTileset} options.tileset
 * @param {Cesium.Viewer} options.viewer
 * @param {Cesium.Color} [options.color=Cesium.Color.RED]
 * @param {number} [options.maxEdgesPerChunk=100000] 每个 chunk 最多多少条边（可调）
 */
export async function openDebugWireframe({
  tileset,
  viewer,
  color = Cesium.Color.RED,
  maxEdgesPerChunk = 100000
})
{
  // 先清理旧的
  closeDebugWireframe(viewer)

  if (!tileset || !viewer)
  {
    console.warn('openDebugWireframe: missing tileset or viewer')
    return
  }

  const queue = [tileset.root]
  const globalEdgeSet = new Set()
  const allFloats = [] // 全部边的 float 数值 (x1,y1,z1,x2,y2,z2,...)

  const hashEdge = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`)

  // reusable temps to reduce GC
  const tmpLocal = new Cesium.Cartesian3()
  const tmpP1 = new Cesium.Cartesian3()
  const tmpP2 = new Cesium.Cartesian3()

  let stepCounter = 0

  while (queue.length > 0)
  {
    const tile = queue.shift()

    // 保证继续遍历所有子节点
    if (tile.children && tile.children.length > 0)
    
      queue.push(...tile.children)
    

    if (!tile.content || !tile.content._model || !tile.content._model._sceneGraph)
    
      continue
    

    const model = tile.content._model
    const rootMatrix = tile.content._computedModelMatrix || tile.content._modelMatrix || tile.computedTransform || Cesium.Matrix4.IDENTITY
    const nodes = model._sceneGraph._runtimeNodes || []

    for (const node of nodes)
    {
      for (const rp of node.runtimePrimitives || [])
      {
        const primitive = rp.primitive
        if (!primitive) continue

        const data = extractPrimitiveVertexData(primitive)
        if (!data) continue

        const { positions, indices } = data
        if (!positions || !indices || indices.length < 3 || positions.length < 3)
        {
          data.positions = null; data.indices = null
          continue
        }
        if (positions.length % 3 !== 0)
        {
          console.warn('[wireframe] positions length not multiple of 3, skip primitive', primitive)
          data.positions = null; data.indices = null
          continue
        }

        for (let i = 0; i + 2 < indices.length; i += 3)
        {
          const ia = indices[i], ib = indices[i + 1], ic = indices[i + 2]
          if (ia == null || ib == null || ic == null) continue

          const edges = [[ia, ib], [ib, ic], [ic, ia]]
          for (let e = 0; e < 3; e++)
          {
            const v1 = edges[e][0], v2 = edges[e][1]
            if (v1 == null || v2 == null) continue
            const key = hashEdge(v1, v2)
            if (globalEdgeSet.has(key)) continue
            globalEdgeSet.add(key)

            const off1 = v1 * 3
            const off2 = v2 * 3
            if (off1 + 2 >= positions.length || off2 + 2 >= positions.length)
            {
              // 忽略越界索引
              continue
            }

            // 读局部顶点并变换为世界坐标
            tmpLocal.x = positions[off1]
            tmpLocal.y = positions[off1 + 1]
            tmpLocal.z = positions[off1 + 2]
            Cesium.Matrix4.multiplyByPoint(rootMatrix, tmpLocal, tmpP1)

            tmpLocal.x = positions[off2]
            tmpLocal.y = positions[off2 + 1]
            tmpLocal.z = positions[off2 + 2]
            Cesium.Matrix4.multiplyByPoint(rootMatrix, tmpLocal, tmpP2)

            // 验证数值有效性
            if (!isFinite(tmpP1.x) || !isFinite(tmpP1.y) || !isFinite(tmpP1.z) ||
                !isFinite(tmpP2.x) || !isFinite(tmpP2.y) || !isFinite(tmpP2.z))
            
              continue
            

            allFloats.push(tmpP1.x, tmpP1.y, tmpP1.z, tmpP2.x, tmpP2.y, tmpP2.z)
          }
        }

        data.positions = null
        data.indices = null
      }
    }

    stepCounter++
    if (stepCounter % 20 === 0) await Promise.resolve() // 让出事件循环
  } // end while

  if (allFloats.length === 0)
  {
    console.warn('[wireframe] no edges found')
    return null
  }

  // 分块创建 Primitive，避免单个超大几何
  const floatsPerChunk = Math.max(6, Math.floor(maxEdgesPerChunk * 6)) // 每条边 6 floats
  for (let offset = 0; offset < allFloats.length; offset += floatsPerChunk)
  {
    const len = Math.min(floatsPerChunk, allFloats.length - offset)
    const chunk = new Float32Array(len)
    for (let i = 0; i < len; i++) chunk[i] = allFloats[offset + i]

    // 计算包围球（先尝试 fromVertices，失败则后备用 AABB->球）
    let boundingSphere = null
    try
    {
      boundingSphere = Cesium.BoundingSphere.fromVertices(chunk)
    }
    catch (e)
    {
      boundingSphere = null
    }

    if (!boundingSphere || !isFinite(boundingSphere.radius))
    {
      // 后备：包围盒法
      let minX = Infinity, minY = Infinity, minZ = Infinity
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
      for (let i = 0; i < chunk.length; i += 3)
      {
        const x = chunk[i], y = chunk[i + 1], z = chunk[i + 2]
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue
        if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z
        if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z
      }
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const cz = (minZ + maxZ) / 2
      let r2 = 0
      for (let i = 0; i < chunk.length; i += 3)
      {
        const dx = chunk[i] - cx, dy = chunk[i + 1] - cy, dz = chunk[i + 2] - cz
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 > r2) r2 = d2
      }
      const radius = Math.sqrt(r2 || 0.0)
      boundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(cx, cy, cz), radius)
    }

    // 构造 Geometry（每个 chunk 一个）
    const geometry = new Cesium.Geometry({
      attributes: {
        position: new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: chunk,
        }),
      },
      primitiveType: Cesium.PrimitiveType.LINES,
      boundingSphere,
    })

    const instance = new Cesium.GeometryInstance({
      geometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      }
    })

    const prim = viewer.scene.primitives.add(new Cesium.Primitive({
      geometryInstances: [instance],
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true,
        translucent: false,
        renderState: { depthTest: { enabled: true } },
      }),
      asynchronous: false,
    }))

    debugWirePrimitives.push(prim)

    // 让出事件循环，避免长时间卡顿
    await Promise.resolve()
  }

  return debugWirePrimitives
}

/**
 * 关闭并移除所有 wireframe primitives
 */
export function closeDebugWireframe(viewer)
{
  if (!debugWirePrimitives || debugWirePrimitives.length === 0) return
  for (const p of debugWirePrimitives)
  {
    try
    {
      viewer.scene.primitives.remove(p)
    }
    catch (e)
    {
      // ignore
    }
  }
  debugWirePrimitives = []
}
