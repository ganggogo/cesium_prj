<style lang="scss" scoped>
  #cesiumcontainer{
    width: 100%;
    height: 100%;
    position: relative;
    // background-image: url('public/static/img/datebg.png');
    background-position: bottom;
  }
</style>
<template>
  <div id="cesiumcontainer">
  </div>
</template>
<script>
/**
 * xugang 20230403 app1
 */
 import InitCesium from '@/utils/js/InitCesium'
let viewer = null, InitCesiumIns
export default {
  data()
  {
    return {

    }
  },
  mounted()
  {
    let scope = this
    scope.$nextTick(() =>
    {
      InitCesiumIns = new InitCesium({ifShowGlobe: true})
      window.viewer = viewer =  InitCesiumIns.initviewer(() => scope.$hLoading())
      window.InitCesiumIns = InitCesiumIns

      // var position = Cesium.Cartesian3.fromDegrees(115, 35.0), scene = window.viewer.scene
      // var rectangle = Cesium.Rectangle.fromCartesianArray([
      //     position,
      //     Cesium.Cartesian3.fromRadians(position.longitude + 0.05, position.latitude + 0.05)
      // ]);

      // var rectanglePrimitive = new Cesium.Primitive({
      //     geometryInstances: new Cesium.GeometryInstance({
      //         geometry: new Cesium.RectangleGeometry({
      //             rectangle: rectangle,
      //             vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
      //         })
      //     }),
      //     appearance: new Cesium.EllipsoidSurfaceAppearance({
      //         material: Cesium.Material.fromType('Mirror', {
      //             reflection: scene.skyAtmosphere.skyBox._cubeMap.texture,
      //         })
      //     }),
      //     show: true
      // });
      // scene.primitives.add(rectanglePrimitive);
      // viewer.camera.setView({
      //   destination: Cesium.Cartesian3.fromDegrees(115, 35, 1500.0),
      //   orientation: {
      //       heading : Cesium.Math.toRadians(0),
      //       pitch : Cesium.Math.toRadians(-30),
      //       roll : 0.0
      //   }
      // });
    })
  },
  watch:
  {
  },
  methods:
  {
  }
}
</script>
