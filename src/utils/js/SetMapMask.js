/**
 * 地图设置水印
 *
 * 使用：
 *
 * import ./SetMapMask.js
 * let text = '武汉智博创享'
   SetMapMask.addMask({ viewer, text })
 */
class SetMapMask
{
  static viewer = null
  static watermarkStage = null
  /**
   * 初始化水印
   * @param {Object} viewer viewer 必须
   * @param {String} color 字体颜色 可传
   * @param {String} text 文字内容 可传
   * @returns
   */
  static initMask(viewer, color, text)
  {
    this.viewer = viewer
    let cesiumCanvas = viewer.scene.canvas
    let width = cesiumCanvas.clientWidth
    let height = cesiumCanvas.clientHeight
    let textCanvas = document.createElement('canvas')
    textCanvas.width = width * 2  // 使水印画布比场景画布更大，以便能够旋转全覆盖
    textCanvas.height = height * 2
    let textContext = textCanvas.getContext('2d')
    // 设置水印样式
    textContext.font = 'bold 30px Arial'
    textContext.fillStyle = color || 'rgba(173,173,173,1)'
    textContext.textAlign = 'center'
    textContext.textBaseline = 'middle'
    textContext.translate(textCanvas.width / 2, textCanvas.height / 2) // 将原点移到中心
    textContext.rotate(-Math.PI / 4) // 旋转45度

    // 绘制重复的水印文字
    for (let x = -textCanvas.width; x < textCanvas.width; x += 500)
    {
      for (let y = -textCanvas.height; y < textCanvas.height; y += 350)
        textContext.fillText(text || '江 苏 省 地 质 调 查 研 究 院', x, y)
    }
    let watermarkTexture = new Cesium.Texture({
      context: viewer.scene.context,
      source: textCanvas
    })
    let watermarkStage = new Cesium.PostProcessStage({
      fragmentShader: `
      uniform sampler2D colorTexture;
      uniform sampler2D watermarkTexture;
      in vec2 v_textureCoordinates;
      void main() {
          vec4 color = texture(colorTexture, v_textureCoordinates);
          vec4 watermarkColor = texture(watermarkTexture, v_textureCoordinates);
          out_FragColor = mix(color, watermarkColor, watermarkColor.a);
      }
  `,
      uniforms: {
        watermarkTexture: watermarkTexture
      }
    })
    this.watermarkStage = watermarkStage
    return watermarkStage
  }

  /**
   * 添加水印
   * @param {Object} param0 viewer
   * @param {String} param1 color
   * @param {String} param2 text
   */
  static addMask({ viewer, color, text })
  {
    if (!this.watermarkStage) this.initMask(viewer, color, text)
    // 将水印Stage添加到场景的PostProcessStages中
    if (!this.viewer.scene.postProcessStages.contains(this.watermarkStage))
      this.viewer.scene.postProcessStages.add(this.watermarkStage)
  }

  /**
   * 移除水印
   */
  static removeMask()
  {
    this.viewer.scene.postProcessStages.remove(this.watermarkStage)
  }
}
export default SetMapMask
