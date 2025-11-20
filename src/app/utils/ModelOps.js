

// 获取 tile 特征的 dch 和 dcmc 属性
export function getTileFeatureDcmc(tile)
{
  const features = tile?.content?.batchTable?._features
  if (!features?.length) return null
  // 调试用
  window.curFeature ? void 0 : (window.curFeature = features[0])
  const dcmcs = []
  // 模型的地层属性枚举值
  const dchAtts = ['dcbm', 'name']      // 地层编号
  const dcmcAtts = ['ytmc', '岩土名称']  // 地层名称

  for (const feature of features)
  {
    const arr = []
    
    // 查找 dch 属性
    const dch = dchAtts.find(att => feature.getPropertyIds().includes(att))
    if (dch) arr.push(feature.getProperty(dch))
    
    // 查找 dcmc 属性
    const dcmc = dcmcAtts.find(att => feature.getPropertyIds().includes(att))
    if (dcmc) arr.push(feature.getProperty(dcmc))
    
    if (arr.length) dcmcs.push(arr)
  }
  return dcmcs.length ? dcmcs : null
}

// 获取 primitive 的 POSITION 属性
export function getPositionAttribute(primitive)
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

// 判断tile和plane是否相交
export function intersectsPlaneOBB(obb, plane)
{
  const center = obb.center
  const halfAxes = obb.halfAxes

  const normal = Cesium.Cartesian3.clone(plane.normal)

  const xAxis = Cesium.Cartesian3.fromElements(halfAxes[0], halfAxes[1], halfAxes[2], new Cesium.Cartesian3())
  const yAxis = Cesium.Cartesian3.fromElements(halfAxes[3], halfAxes[4], halfAxes[5], new Cesium.Cartesian3())
  const zAxis = Cesium.Cartesian3.fromElements(halfAxes[6], halfAxes[7], halfAxes[8], new Cesium.Cartesian3())

  // 投影到法线方向的半长轴和中心距离
  const r =
    Math.abs(Cesium.Cartesian3.dot(normal, xAxis)) +
    Math.abs(Cesium.Cartesian3.dot(normal, yAxis)) +
    Math.abs(Cesium.Cartesian3.dot(normal, zAxis))
  const d = Cesium.Plane.getPointDistance(plane, center)
  return Math.abs(d) <= r
}


// 判断AABB和plane是否相交
export function intersectsPlaneAABB(min, max, matrix, plane)
{
  const corners = [
    new Cesium.Cartesian3(min.x, min.y, min.z),
    new Cesium.Cartesian3(min.x, min.y, max.z),
    new Cesium.Cartesian3(min.x, max.y, min.z),
    new Cesium.Cartesian3(min.x, max.y, max.z),
    new Cesium.Cartesian3(max.x, min.y, min.z),
    new Cesium.Cartesian3(max.x, min.y, max.z),
    new Cesium.Cartesian3(max.x, max.y, min.z),
    new Cesium.Cartesian3(max.x, max.y, max.z),
  ]

  let hasFront = false, hasBack = false
  for (const corner of corners)
  {
    const worldCorner = Cesium.Matrix4.multiplyByPoint(matrix, corner, new Cesium.Cartesian3())
    const distance = Cesium.Plane.getPointDistance(plane, worldCorner)
    // console.log('corner world pos:', worldCorner, 'distance to plane:', distance)
    if (distance > 0) hasFront = true
    else if (distance < 0) hasBack = true
    if (hasFront && hasBack)
      return true
  }
  return false
}


// 创建剖切面并返回相关信息
export function createClippingPlaneAndSurface({
  tileset,
  viewer,
  position = 0,
  axis = 'z', // 可选: 'x' | 'y' | 'z'
  normal = null, // 可自定义法线向量（Cesium.Cartesian3）
  extent = null, // 默认自动计算
  showHelper = false // 是否显示剖切面辅助面
})
{
  if (!tileset || !viewer)
    throw new Error('tileset 和 viewer 参数必传')

  const modelMatrix =
    tileset.root.transform ||
    tileset.root.computedTransform ||
    Cesium.Matrix4.IDENTITY

  // 自动根据模型范围设置 extent
  if (!extent)
  {
    const bs = tileset.boundingSphere
    extent = bs ? bs.radius * 2.0 : 250.0
  }

  // 根据 axis 或 normal 生成局部坐标法线和中心点
  let localNormal, localCenter
  switch (axis)
  {
  case 'x':
    localNormal = new Cesium.Cartesian3(1, 0, 0)
    localCenter = new Cesium.Cartesian3(position, 0, 0)
    break
  case 'y':
    localNormal = new Cesium.Cartesian3(0, 1, 0)
    localCenter = new Cesium.Cartesian3(0, position, 0)
    break
  case 'z':
  default:
    localNormal = new Cesium.Cartesian3(0, 0, 1)
    localCenter = new Cesium.Cartesian3(0, 0, position)
    break
  }
  if (normal instanceof Cesium.Cartesian3) localNormal = normal

  // 转换为世界坐标
  const worldCenter = Cesium.Matrix4.multiplyByPoint(
    modelMatrix,
    localCenter,
    new Cesium.Cartesian3()
  )
  const rotationMatrix = new Cesium.Matrix3()
  Cesium.Matrix4.getRotation(modelMatrix, rotationMatrix)
  const worldNormal = Cesium.Matrix3.multiplyByVector(
    rotationMatrix,
    localNormal,
    new Cesium.Cartesian3()
  )
  Cesium.Cartesian3.normalize(worldNormal, worldNormal)

  // 计算剖面上两个正交方向向量
  const arbitraryUp = Cesium.Cartesian3.UNIT_Z
  let right = Cesium.Cartesian3.cross(worldNormal, arbitraryUp, new Cesium.Cartesian3())
  if (Cesium.Cartesian3.magnitude(right) < 1e-6)
    right = Cesium.Cartesian3.cross(worldNormal, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(right, right)
  const realUp = Cesium.Cartesian3.cross(right, worldNormal, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(realUp, realUp)

  // 构造剖切面矩形
  const half = extent / 2
  function offset(pos, dir1, len1, dir2, len2)
  {
    const p = Cesium.Cartesian3.clone(pos)
    Cesium.Cartesian3.add(p, Cesium.Cartesian3.multiplyByScalar(dir1, len1, new Cesium.Cartesian3()), p)
    Cesium.Cartesian3.add(p, Cesium.Cartesian3.multiplyByScalar(dir2, len2, new Cesium.Cartesian3()), p)
    return p
  }

  const corners = [
    offset(worldCenter, right, -half, realUp, -half),
    offset(worldCenter, right, +half, realUp, -half),
    offset(worldCenter, right, +half, realUp, +half),
    offset(worldCenter, right, -half, realUp, +half),
  ]

  // 可视化剖切面（调试用）
  if (showHelper)
  {
    viewer.entities.add({
      name: 'Clipping Plane Helper',
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(corners),
        material: Cesium.Color.RED.withAlpha(0.35),
        perPositionHeight: true,
        classificationType: Cesium.ClassificationType.BOTH,
      },
    })
  }

  // 计算平面
  const v1 = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3())
  const v2 = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3())
  const normalVec = Cesium.Cartesian3.cross(v1, v2, new Cesium.Cartesian3())
  Cesium.Cartesian3.normalize(normalVec, normalVec)
  let distance = -Cesium.Cartesian3.dot(normalVec, corners[0])

  // 确保方向与世界法线一致
  if (Cesium.Cartesian3.dot(normalVec, worldNormal) < 0)
  {
    Cesium.Cartesian3.negate(normalVec, normalVec)
    distance = -distance
  }

  const plane = new Cesium.Plane(normalVec, distance)

  return {
    plane,          // Cesium.Plane 剖切平面对象
    corners,        // 四个角点世界坐标
    worldCenter,    // 世界中心点
    worldNormal,    // 世界法线方向
  }
}


// export function createClippingPlaneAndSurface({ xPosition, tileset, viewer, extent = 250 })
// {
//   const modelMatrix =
//     tileset.root.transform ||
//     tileset.root.computedTransform ||
//     Cesium.Matrix4.IDENTITY

//   // 模型局部空间中心点和法线
//   const localCenter = new Cesium.Cartesian3(xPosition, 0, 0)
//   const localNormal = new Cesium.Cartesian3(1, 0, 0)
//   // const localNormal = new Cesium.Cartesian3(0, 0, -1)
//   // const localCenter = new Cesium.Cartesian3(0, 0, xPosition)

//   // 转换为世界坐标中心点和法线
//   const worldCenter = Cesium.Matrix4.multiplyByPoint(modelMatrix, localCenter, new Cesium.Cartesian3())
//   const rotationMatrix = new Cesium.Matrix3()
//   Cesium.Matrix4.getRotation(modelMatrix, rotationMatrix)
//   const worldNormal = Cesium.Matrix3.multiplyByVector(rotationMatrix, localNormal, new Cesium.Cartesian3())
//   Cesium.Cartesian3.normalize(worldNormal, worldNormal)

//   // 根据法线计算切面上的两个方向向量（正交于法线）
//   const up = Cesium.Cartesian3.UNIT_Z
//   let right = Cesium.Cartesian3.cross(worldNormal, up, new Cesium.Cartesian3())
//   if (Cesium.Cartesian3.magnitude(right) < 1e-6)
//   {
//     // worldNormal 与 Z 轴平行，选择另一个 up 向量
//     right = Cesium.Cartesian3.cross(worldNormal, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3())
//   }
//   Cesium.Cartesian3.normalize(right, right)
//   const realUp = Cesium.Cartesian3.cross(right, worldNormal, new Cesium.Cartesian3())
//   Cesium.Cartesian3.normalize(realUp, realUp)

//   // 构造正方形四个角点
//   const half = extent / 2

//   function offset(pos, dir1, len1, dir2, len2)
//   {
//     const p = Cesium.Cartesian3.clone(pos)
//     Cesium.Cartesian3.add(p, Cesium.Cartesian3.multiplyByScalar(dir1, len1, new Cesium.Cartesian3()), p)
//     Cesium.Cartesian3.add(p, Cesium.Cartesian3.multiplyByScalar(dir2, len2, new Cesium.Cartesian3()), p)
//     return p
//   }

//   const corners = [
//     offset(worldCenter, right, -half, realUp, -half),
//     offset(worldCenter, right, +half, realUp, -half),
//     offset(worldCenter, right, +half, realUp, +half),
//     offset(worldCenter, right, -half, realUp, +half),
//   ]

//   // 可视化剖切面
//   viewer.entities.add({
//     name: '剖切面',
//     polygon: {
//       hierarchy: new Cesium.PolygonHierarchy(corners),
//       material: Cesium.Color.RED.withAlpha(0.6),
//       perPositionHeight: true,
//       classificationType: Cesium.ClassificationType.BOTH,
//     },
//   })

//   // 计算剖切平面
//   const v1 = Cesium.Cartesian3.subtract(corners[1], corners[0], new Cesium.Cartesian3())
//   const v2 = Cesium.Cartesian3.subtract(corners[2], corners[0], new Cesium.Cartesian3())
//   const normal = Cesium.Cartesian3.cross(v1, v2, new Cesium.Cartesian3())
//   Cesium.Cartesian3.normalize(normal, normal)
//   const distance = -Cesium.Cartesian3.dot(normal, corners[0])
//   const plane = new Cesium.Plane(normal, distance)

//   return {plane}
// }

export function isPointInsideTileOBB(tile, point, eps = 1e-6)
{
  if (!tile || !point) return false

  // 1. 找 OBB
  const obb =
    tile._boundingVolume?.boundingVolume?.orientedBoundingBox ??
    tile._boundingVolume?._orientedBoundingBox

  if (!obb || !obb.center || !obb.halfAxes) return false

  // 2. p - center
  const v = Cesium.Cartesian3.subtract(point, obb.center, new Cesium.Cartesian3())

  // 3. halfAxes 的三列（半轴向量）
  const col0 = Cesium.Matrix3.getColumn(obb.halfAxes, 0, new Cesium.Cartesian3())
  const col1 = Cesium.Matrix3.getColumn(obb.halfAxes, 1, new Cesium.Cartesian3())
  const col2 = Cesium.Matrix3.getColumn(obb.halfAxes, 2, new Cesium.Cartesian3())

  const len0 = Cesium.Cartesian3.magnitude(col0)
  const len1 = Cesium.Cartesian3.magnitude(col1)
  const len2 = Cesium.Cartesian3.magnitude(col2)

  if (len0 < eps || len1 < eps || len2 < eps) return false // 退化，算作不在内部

  // 4. 三个轴的单位向量
  const axis0 = Cesium.Cartesian3.divideByScalar(col0, len0, new Cesium.Cartesian3())
  const axis1 = Cesium.Cartesian3.divideByScalar(col1, len1, new Cesium.Cartesian3())
  const axis2 = Cesium.Cartesian3.divideByScalar(col2, len2, new Cesium.Cartesian3())

  // 5. 点在这三个轴上的投影（绝对值）
  const p0 = Math.abs(Cesium.Cartesian3.dot(v, axis0))
  const p1 = Math.abs(Cesium.Cartesian3.dot(v, axis1))
  const p2 = Math.abs(Cesium.Cartesian3.dot(v, axis2))

  // 6. 只要投影都在半径范围内 → 点在 OBB 内
  return (
    p0 <= len0 + eps &&
    p1 <= len1 + eps &&
    p2 <= len2 + eps
  )
}


