import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

function extractGlbFromB3dm(arrayBuffer)
{
  const view = new DataView(arrayBuffer)
  const uint8 = new Uint8Array(arrayBuffer)
  const textDecoder = new TextDecoder()

  const magic = textDecoder.decode(uint8.slice(0, 4))
  if (magic !== 'b3dm')
  
    throw new Error('Not a valid b3dm file')
  

  const featureTableJSONByteLength = view.getUint32(12, true)
  const featureTableBinaryByteLength = view.getUint32(16, true)
  const batchTableJSONByteLength = view.getUint32(20, true)
  const batchTableBinaryByteLength = view.getUint32(24, true)

  const glbStart = 28 +
    featureTableJSONByteLength +
    featureTableBinaryByteLength +
    batchTableJSONByteLength +
    batchTableBinaryByteLength

  return arrayBuffer.slice(glbStart)
}

async function parseGlbBuffer(glbBuffer)
{
  const loader = new GLTFLoader()

  loader.parse(glbBuffer, '', (gltf) =>
  {
    gltf.scene.traverse((child) =>
    {
      if (child.isMesh)
      {
        const geometry = child.geometry
        const posAttr = geometry.attributes.position
        const indexAttr = geometry.index

        if (posAttr)
        {
          const positions = posAttr.array
          console.log('顶点坐标数量:', positions.length / 3)
          console.log('示例顶点:', positions.slice(0, 9))
        }

        if (indexAttr)
        {
          const indices = indexAttr.array
          console.log('索引数量:', indices.length)
          console.log('示例索引:', indices.slice(0, 9))
        }
      }
    })
  }, (err) =>
  {
    console.error('GLB parse error', err)
  })
}

export default async function parseB3dm(arrayBuffer)
{
  const glbBuffer = extractGlbFromB3dm(arrayBuffer)
  await parseGlbBuffer(glbBuffer)
}
