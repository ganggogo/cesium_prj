<style lang="scss" scoped>
  .contain-box{background: rgb(129 170 90 / 53%);backdrop-filter: blur(0.1rem);padding: 0.1rem;border-radius: 0.08rem;color: white;z-index:10;span{display: inline-block;text-align: center;}}
  .vertex-span{color: aquamarine;}
  .triangle-span{color: aqua;}
  .geometry-memory-span{color: rgb(61, 193, 144)}
	.texture-memory-span{color: rgb(50,195,224)}
</style>
<template>
  <div class="contain-box">
    当前场景模型 - 顶点数：<span class="vertex-span">{{ vertexNum }}</span>，
    三角形数：<span class="triangle-span">{{ triangleNum }}</span>，
    Geometry占用内存：<span class="geometry-memory-span">{{ gMemoryNum }}</span>，
    Texture占用内存：<span class="texture-memory-span">{{ tMemoryNum }}</span>
  </div>
</template>
<script>
import ShowVertexs from './ShowVertexs.js'
export default
{
  mixins: [ShowVertexs]
}
</script>
