<style lang="scss" scoped>

</style>
<template>
  <div id="cesiumcontainer"></div>
</template>
<script>
import InitCesium from '@/utils/js/InitCesium'
export default {
  data()
  {
    return {

    }
  },

  mounted()
  {
    this.initEarth()
  },

  methods:
  {
    // 初始化地球
    initEarth()
    {
      let scoped = this
      scoped.$nextTick(() => {
        let InitCesiumIns = new InitCesium()
        window.viewer = viewer = InitCesiumIns.initviewer(() => scoped.$hLoading())
        window.InitCesiumIns = InitCesiumIns


        // 加载Shader
      const waveMaterial = new Cesium.Material({
        fabric: {
          type: 'WaveShader',
          uniforms: {
            color: new Cesium.Color(0.0, 0.5, 1.0, 0.6),
            time: 0.0
          },
          source: `
            uniform vec4 color;
            uniform float time;

            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              float wave = sin(materialInput.st.s * 10.0 + time * 2.0) * 0.1;
              material.diffuse = color.rgb;
              material.alpha = color.a + wave;
              return material;
            }
          `
        }
      });

      // 添加一个矩形区域来展示效果
      viewer.entities.add({
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(-110.0, 30.0, -100.0, 40.0),
          material: waveMaterial
        }
      });

      // 动态更新Shader的时间
      viewer.clock.onTick.addEventListener(function () {
        waveMaterial.uniforms.time += 0.03;
      });

        // 9. 调整相机视角
        viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(-110.0, 30.0, -100.0, 40.0),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        });
      })
    }
  }
}
</script>
