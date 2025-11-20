<style lang="scss" scoped>
#cesiumcontainer{
  width: 100%;
  height: 100%;
  position: relative;
  background-image: url('public/static/img/datebg.png');
  background-position: bottom;
}
</style>
<template>
  <div id="cesiumcontainer"></div>
</template>
<script>
/**
 * xugang 20230403 app0
 * 
 * 
 * specularMap : 'static/img/water.png',
   normalMap : 'static/img/waterNormals.jpg',
 */
import InitCesium from '@/utils/js/InitCesium'
let viewer = null
export default {
  data()
  {
    return {
    }
  },
  mounted()
  {
    let scoped = this
    scoped.$sLoading()
    scoped.$nextTick(() =>
    {
      let InitCesiumIns = new InitCesium({ifFlytoDefViewPort: false})
      window.viewer = viewer =  InitCesiumIns.initviewer(() => scoped.$hLoading())
      window.InitCesiumIns = InitCesiumIns
    })
  },
  methods:
  {
    
  }
}
</script>
