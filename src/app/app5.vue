<style lang="scss" scoped>
  #cesiumcontainer{
    width: 100%;
    height: 100%;
    position: relative;
    background-image: url('public/static/img/datebg.png');
    background-position: bottom;
  }
  .show-vertexs{position: absolute;top: 8px;left: 300px;}
  .slider-control{position: absolute;top: 64px;left: 310px;z-index: 15;width: 800px;display: flex;color: white;
    div{width: 180px;}
  }
</style>
<template>
  <div id="cesiumcontainer">
    <ShowVertexs class="show-vertexs"></ShowVertexs>
    <span style="position: absolute;top: 10px;left: 10px;z-index: 9999;">
      <el-button @click="backPos" type="success">复位</el-button>
      <el-button @click="loadModel" type="success">加载模型</el-button>
    </span>
    <div class="slider-control">
      <div>切割面距离原点位置：</div>
      <el-slider :disabled="ifNoSlide" :min="yMin" :max="yMax" :step="1" v-model="axisYVal" />
    </div>
  </div>
</template>
<script>
/**
 * xugang 20230403 app1
 */
 import ShowVertexs from './ShowVertexs'
 import InitCesium from '@/utils/js/InitCesium'
let viewer = null, InitCesiumIns
export default {
  components: {ShowVertexs},
  data()
  {
    return {
      axisYVal: 0,
      yMin: 0,
      yMax: 0,
      ifNoSlide: true
    }
  },
  mounted()
  {
    let scope = this
    scope.$nextTick(() =>
    {
      InitCesiumIns = new InitCesium()
      window.viewer = viewer =  InitCesiumIns.initviewer(() => scope.$hLoading())
      window.InitCesiumIns = InitCesiumIns
    })

    /**
     * e.detail
     * @param {Object}
     * @property {String} title 标题
     * @property {String} message 报错信息
     * @property {Object} error 详细错误信息
     */
    document.addEventListener("Cesium_RunTimeError_To_Outer", (e) => {
      console.log(e.detail)
    })
  },
  watch:
  {
    axisYVal(val)
    {
      InitCesiumIns.targetY = val
    }
  },
  methods:
  {
    loadModel()
    {
      let self = this
      if (window.modelSocket && window.modelSocket.socket && window.modelSocket.socket.readyState === 3) return console.log('模型服务连接已关闭~')
      console.log(window.modelSocket)
      InitCesiumIns.load3DTiles('modelJson/static/model/工程地质模型.json', {
      }, (val) => {
        self.yMin = -val
        self.yMax = val
        self.ifNoSlide = false
      })
    }
  }
}
</script>
