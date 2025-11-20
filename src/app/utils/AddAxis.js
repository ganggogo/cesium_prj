export function addAxesAtTilesetOriginWithTransform(viewer, tileset, axisLength = 8000.0)
{
  const transform = tileset._root.transform
  const origin = Cesium.Matrix4.getTranslation(transform, new Cesium.Cartesian3())

  const matrix3 = Cesium.Matrix4.getMatrix3(transform, new Cesium.Matrix3())
  const xDir = Cesium.Matrix3.getColumn(matrix3, 0, new Cesium.Cartesian3())
  const yDir = Cesium.Matrix3.getColumn(matrix3, 1, new Cesium.Cartesian3())
  const zDir = Cesium.Matrix3.getColumn(matrix3, 2, new Cesium.Cartesian3())

  const axisConfigs = [
    { name: 'x', dir: xDir, color: Cesium.Color.RED },
    { name: 'y', dir: yDir, color: Cesium.Color.GREEN },
    { name: 'z', dir: zDir, color: Cesium.Color.BLUE }
  ]

  for (const cfg of axisConfigs)
  {
    const { name, dir, color } = cfg

    // 正方向
    const positiveEnd = Cesium.Cartesian3.add(
      origin,
      Cesium.Cartesian3.multiplyByScalar(dir, axisLength, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    )
    viewer.entities.add({
      id: `__axis_${name}_positive`,
      name: `${name.toUpperCase()} 轴正方向`,
      polyline: {
        positions: [origin, positiveEnd],
        width: 5,
        material: color
      }
    })

    // 负方向
    const negativeEnd = Cesium.Cartesian3.add(
      origin,
      Cesium.Cartesian3.multiplyByScalar(dir, -axisLength, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    )
    viewer.entities.add({
      id: `__axis_${name}_negative`,
      name: `${name.toUpperCase()} 轴负方向`,
      polyline: {
        positions: [origin, negativeEnd],
        width: 5,
        material: color.withAlpha(0.3)
      }
    })

    // 标签（加在正方向末尾）
    viewer.entities.add({
      id: `__axis_${name}_label`,
      name: `${name.toUpperCase()} 轴标签`,
      position: positiveEnd,
      label: {
        text: name.toUpperCase(),
        font: '20px sans-serif',
        fillColor: color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.NONE,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      }
    })
  }

  console.log('坐标轴已添加（含 transform 和负轴）')
}

export function removeAxes(viewer)
{
  const idsToRemove = viewer.entities.values
    .filter(entity => entity.id && entity.id.startsWith('__axis_'))
    .map(entity => entity.id)

  for (const id of idsToRemove)
  
    viewer.entities.removeById(id)
  

  console.log('坐标轴已销毁')
}

