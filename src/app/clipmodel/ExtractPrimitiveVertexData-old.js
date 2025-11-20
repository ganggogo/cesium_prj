
/**
 * 从 Cesium primitive 中提取 positions 和 indices
 * @param {Object} primitive - Cesium 的 runtimePrimitive（rp.primitive）
 * @returns {Object|null} 包含 positions（Float32Array）和 indices（Uint16Array / Uint32Array）
 */


/**
    顶点在 buffer 中可能 interleaved（比如 xyz + normal + uv）。

    byteStride 大于 3×4（Float32）时，直接按紧凑方式读取会错位。

    POSITION 可能不是 float，需要按 ComponentDatatype 转换。

    有 GPU buffer，不能直接访问 typedArray。
 */
export default function extractPrimitiveVertexData(primitive)
{

  try
  {
    const attribute = primitive.attributes.find(a => a.semantic === 'POSITION')
    const indexBuffer = primitive.indices

    if (!attribute || !attribute.buffer || !indexBuffer || !indexBuffer.buffer) return null

    const gl = attribute.buffer._gl
    const vertexBuffer = attribute.buffer._buffer // 顶点buffer
    const indexGlBuffer = indexBuffer.buffer._buffer // 索引buffer

    // === 顶点数据 ===
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    const vertexByteLength = attribute.buffer._sizeInBytes
    const vertexArray = new Float32Array(vertexByteLength / 4)
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, vertexArray)

    // === 索引数据 ===
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexGlBuffer)
    const indexByteLength = indexBuffer.count * (
      indexBuffer.componentDatatype === Cesium.ComponentDatatype.UNSIGNED_SHORT ? 2 : 4
    )
    const IndexArrayType = indexBuffer.componentDatatype === Cesium.ComponentDatatype.UNSIGNED_SHORT
      ? Uint16Array
      : Uint32Array
    const indexArray = new IndexArrayType(indexByteLength / IndexArrayType.BYTES_PER_ELEMENT)
    gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, indexArray)

    const result = {
      positions: vertexArray,
      indices: indexArray
    }

    return result
  }
  catch (e)
  {
    console.warn('[extractPrimitiveVertexData] WebGL 提取失败:', e)
    return null
  }
}
