function getRandomColor(alpha)
{
  const red = Math.random()     // 0~1
  const green = Math.random()   // 0~1
  const blue = Math.random()    // 0~1
  return new Cesium.Color(red, green, blue, alpha || 1.0)
}

let clipModelResPolygonPrimitiveCollections = []
window.clipModelResPolygonPrimitiveCollections = clipModelResPolygonPrimitiveCollections
// 纯色填充
export function drawPolygonsWithPrimitive(viewer, polygons, color)
{
  const instances = []

  for (const positions of polygons)
  {
    if (positions.length < 3) continue

    instances.push(
      new Cesium.GeometryInstance({
        geometry: Cesium.PolygonGeometry.fromPositions({
          positions,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          perPositionHeight: true,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(getRandomColor(1)),
        },
      })
    )
  }

  const primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true,
      closed: true,
    }),
    asynchronous: true,
  })
  clipModelResPolygonPrimitiveCollections.push(primitive)
  viewer.scene.primitives.add(primitive)
  return primitive
}

// 带纹理填充
export function drawPolygonsWithTexturePrimitive(viewer, polygonsWithDcmc, legends)
{
  for (const { polygon: rawPolygon, dcxx } of polygonsWithDcmc)
  {
    if (!rawPolygon) continue
    for (const polygons of rawPolygon)
    {
      if (!polygons || polygons.length < 3) continue
      let [dch, dcmc] = Array.isArray(dcxx) ? dcxx : dcxx.split(',')
      let textureUrl

      const targetLegend =
      legends.find(_ => _.name === `${dch}${dcmc}`) ||
      legends.find(_ => _.name === `${dch}`) ||
      legends.find(_ => _.name === `${dcmc}`)

      if (!targetLegend || !targetLegend.uri?.startsWith('data:image'))
      {
        console.warn(`地层 ${dch}${dcmc} 未找到有效纹理`)
        continue
      }

      textureUrl = targetLegend.uri

      // 保证逆时针
      const polygon = ensureCounterClockwise(polygons)

      // 计算实际尺寸并自适应 repeat
      const { width, height } = getXYRange(polygon)
      const desiredMetersPerTexture = 15.0 // 每张纹理图理想映射的米数
      const repeatU = Math.max(width / desiredMetersPerTexture, 1.0)
      const repeatV = Math.max(height / desiredMetersPerTexture, 1.0)

      const geometryInstance = new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(polygon),
          perPositionHeight: true,
          vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
        }),
        id: `${dch}${dcmc}`
      })

      const appearance = new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Image',
            uniforms: {
              image: textureUrl,
              repeat: new Cesium.Cartesian2(repeatU, repeatV),
              color: Cesium.Color.WHITE
            }
          }
        }),
        closed: false, // 面处理
        faceForward: true, // 面始终朝向摄像机
        translucent: true
      })

      const primitive = new Cesium.Primitive({
        geometryInstances: [geometryInstance],
        appearance,
        asynchronous: false,
        cull: false // 不剔除背面
      })
      clipModelResPolygonPrimitiveCollections.push(primitive)
      viewer.scene.primitives.add(primitive)
    }
  }

  function ensureCounterClockwise(polygon)
  {
    let area = 0
    for (let i = 0; i < polygon.length - 1; i++)
      area += (polygon[i + 1].x - polygon[i].x) * (polygon[i + 1].y + polygon[i].y)
    return area > 0 ? polygon.slice().reverse() : polygon
  }

  function getXYRange(polygon)
  {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    for (const p of polygon)
    {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    return {
      width: maxX - minX,
      height: maxY - minY
    }
  }
}

