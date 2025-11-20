/**
 * indices，不依赖顶点在buffer中的布局，始终指向正确的定点编号
 * 即使顶点是 interleaved 或 byteStride 很大，索引仍然指向正确的顶点编号。
 *
 *positions,

  根据 byteOffset + realStride 精确定位每个顶点 xyz。
  按 componentDatatype 正确读取每个分量。
  输出连续的 Float32Array positions，保证 与 indices 对应。
 */

export default function extractPrimitiveVertexData(primitive)
{
  try
  {
    if (!primitive) return null

    // 兼容不同 Cesium 结构：优先 primitive.attributes（runtime 中常见），老版本Ceisum也可能存在于vertexAttributes属性中
    const attribute = (primitive.attributes && primitive.attributes.find(a => a.semantic === 'POSITION'))
      || (primitive.vertexAttributes && primitive.vertexAttributes.find(a => a.semantic === 'POSITION'))

    const indexBuffer = primitive.indices || primitive.indexBuffer
    // if (!attribute || !attribute.buffer || !indexBuffer || !indexBuffer.buffer) return null

    // 根据顶点属性类型返回每个顶点的分量数量
    const getNumComponents = (type) =>
    {
      if (!type) return 3
      if (type === 'SCALAR') return 1
      if (type === 'VEC2') return 2
      if (type === 'VEC3') return 3
      if (type === 'VEC4') return 4
      return 3
    }
    // 根据顶点组件数据类型返回每个分量占用的字节数
    const componentSize = (cd) =>
    {
      // 使用 Cesium.ComponentDatatype 常量
      if (cd === Cesium.ComponentDatatype.FLOAT) return 4
      if (cd === Cesium.ComponentDatatype.UNSIGNED_SHORT) return 2
      if (cd === Cesium.ComponentDatatype.SHORT) return 2
      if (cd === Cesium.ComponentDatatype.UNSIGNED_BYTE) return 1
      if (cd === Cesium.ComponentDatatype.BYTE) return 1
      if (cd === Cesium.ComponentDatatype.UNSIGNED_INT) return 4 // 若支持
      return 4
    }
    // 按类型读取单个分量
    const readComponent = (dv, off, cd) =>
    {
      switch (cd)
      {
      case Cesium.ComponentDatatype.FLOAT: return dv.getFloat32(off, true)
      case Cesium.ComponentDatatype.UNSIGNED_SHORT: return dv.getUint16(off, true)
      case Cesium.ComponentDatatype.SHORT: return dv.getInt16(off, true)
      case Cesium.ComponentDatatype.UNSIGNED_BYTE: return dv.getUint8(off)
      case Cesium.ComponentDatatype.BYTE: return dv.getInt8(off)
      case Cesium.ComponentDatatype.UNSIGNED_INT: return dv.getUint32(off, true)
      default: return dv.getFloat32(off, true)
      }
    }

    // 获取顶点缓冲对象

    // --- 读取顶点原始 bytes（优先 GPU buffer） ---
    const bufObj = attribute.buffer // Cesium runtime buffer wrapper
    const gl = bufObj && bufObj._gl
    const vertexGlBuffer = bufObj && bufObj._buffer
    // 可能的字段名：attribute.byteOffset / attribute.byteStride / attribute.count / attribute.type / attribute.componentDatatype
    /**
      count 顶点个数。
      byteOffset 顶点属性在缓冲区中的偏移。
      byteStride 每个顶点间隔（可能 interleaved）。
      components 每个顶点分量数（通常 3）。
      compSize 每个分量字节数
     */
    const count = attribute.count
    const byteOffset = (typeof attribute.byteOffset === 'number') ? attribute.byteOffset : 0
    const byteStride = (typeof attribute.byteStride === 'number')
      ? attribute.byteStride
      : (bufObj && bufObj.byteStride) || 0
    const components = getNumComponents(attribute.type || attribute.type)
    const compSize = componentSize(attribute.componentDatatype)

    // 计算顶点缓冲长度（优先使用 bufObj._sizeInBytes）
    const vertexByteLength = bufObj._sizeInBytes
      || (count * (byteStride || components * compSize))

    let rawBytesBuf // Uint8Array 包含缓冲字节

    if (gl && typeof gl.getBufferSubData === 'function' && vertexGlBuffer)
    {
      // WebGL2 - 直接从 GPU 读回 bytes
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexGlBuffer)
      rawBytesBuf = new Uint8Array(vertexByteLength)
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, rawBytesBuf)
    }
    else if (bufObj.typedArray)
    {
      // 回退：Cesium 在 CPU 保留了 typedArray 的情况（可能是 interleaved）
      const ta = bufObj.typedArray
      rawBytesBuf = new Uint8Array(ta.buffer, ta.byteOffset || 0, ta.byteLength || ta.length * ta.BYTES_PER_ELEMENT)
    }
    else
    {
      console.warn('[extractPrimitiveVertexData] 无法获取顶点缓冲（既没有 WebGL2 getBufferSubData，也没有 typedArray）')
      return null
    }

    // DataView 按字节读取
    const dataView = new DataView(rawBytesBuf.buffer, rawBytesBuf.byteOffset, rawBytesBuf.byteLength)

    // 实际的 stride：如果 byteStride 为 0 或未定义 -> 按紧凑排列（components * compSize）
    const realStride = (byteStride && byteStride > 0) ? byteStride : (components * compSize)

    // 提取 positions
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++)
    {
      const base = byteOffset + i * realStride // 关键：计算每个顶点的起始位置
      // POSITION--> float32 三个分量
      if (attribute.componentDatatype === Cesium.ComponentDatatype.FLOAT)
      {
        positions[i * 3 + 0] = dataView.getFloat32(base + 0, true)
        positions[i * 3 + 1] = dataView.getFloat32(base + 4, true)
        positions[i * 3 + 2] = dataView.getFloat32(base + 8, true)
      }
      else
      {
        // 如果不是 float，需要按实际类型读取并转成 Number
        positions[i * 3 + 0] = readComponent(dataView, base + 0 * compSize, attribute.componentDatatype)
        positions[i * 3 + 1] = readComponent(dataView, base + 1 * compSize, attribute.componentDatatype)
        positions[i * 3 + 2] = readComponent(dataView, base + 2 * compSize, attribute.componentDatatype)
      }
    }

    // console.log('[extractPrimitiveVertexData] positions:', positions)

    // // --- 读取索引数组 ---
    // const ibufObj = indexBuffer.buffer
    // const indexGlBuffer = ibufObj && ibufObj._buffer
    // const indexCount = indexBuffer.count
    // const indexComponent = indexBuffer.componentDatatype
    // let indices

    // if (gl && typeof gl.getBufferSubData === 'function' && indexGlBuffer)
    // {
    //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexGlBuffer)
    //   if (indexComponent === Cesium.ComponentDatatype.UNSIGNED_SHORT)
    //   {
    //     indices = new Uint16Array(indexCount)
    //     gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, indices)
    //   }
    //   else
    //   {
    //     // 默认使用 Uint32（Cesium 在某些平台上会用 UNSIGNED_INT）
    //     indices = new Uint32Array(indexCount)
    //     gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, indices)
    //   }
    // }
    // else if (ibufObj.typedArray)
    // {
    //   // 回退：CPU 副本存在
    //   const ta = ibufObj.typedArray
    //   if (ta instanceof Uint16Array || ta instanceof Uint32Array)
    //     indices = new ta.constructor(ta) // 复制一份
    //   else
    //   {
    //     // 根据 component 类型转换
    //     indices = (indexComponent === Cesium.ComponentDatatype.UNSIGNED_SHORT)
    //       ? new Uint16Array(ta.buffer, ta.byteOffset || 0, indexCount)
    //       : new Uint32Array(ta.buffer, ta.byteOffset || 0, indexCount)
    //   }
    // }
    // else
    // {
    //   console.warn('[extractPrimitiveVertexData] 无法获取索引缓冲（既没有 WebGL2 getBufferSubData，也没有 typedArray）')
    //   return null
    // }
    return {
      positions,
    }
  }
  catch (e)
  {
    console.warn('[extractPrimitiveVertexData] 提取失败：', e)
    return null
  }
}
