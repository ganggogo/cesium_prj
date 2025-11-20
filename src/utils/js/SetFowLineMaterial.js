
/**
 * @class
 * @explain    绘制贴地线（流光材质）
 * @author     xugang
 * @time       2022-08-30
 */
class SetFowLineMaterial {
  constructor (options) {
    this._definitionChanged = new Cesium.Event()
    this._color = undefined
    this._speed = undefined
    this._percent = undefined
    this._gradient = undefined
    this.color = options.color || undefined
    this.speed = options.speed || undefined
    this.percent = options.percent || undefined
    this.gradient = options.gradient || undefined

    this._lineWidth = 3
    this._lineNum = 0
    this._fs = options.fs || `
    uniform vec4 color;
    uniform float speed;
    uniform float percent;
    uniform float gradient;
    
    czm_material czm_getMaterial(czm_materialInput materialInput){
      czm_material material = czm_getDefaultMaterial(materialInput);
      vec2 st = materialInput.st;
      float t =fract(czm_frameNumber * speed / 1000.0);
      t *= (1.0 + percent);
      float alpha = smoothstep(t- percent, t, st.s) * step(-t, -st.s);
      alpha += gradient;
      material.diffuse = color.rgb;
      material.alpha = alpha;
      return material;
    }
    `
    this.initMaterial()
  };

  get isConstant () {
    return false
  }

  get definitionChanged () {
    return this._definitionChanged
  }

  getType (time) {
    return Cesium.Material.LineFlowMaterialType
  }

  getValue (time, result) {
    // if (!Cesium.defined(result)) {
    //   result = {}
    // }

    // result.color = Cesium.Property.getValueOrDefault(this._color, time, Cesium.Color.fromCssColorString('rgba(22,101,230,1)'), result.color)
    // result.speed = Cesium.Property.getValueOrDefault(this._speed, time, 5.0, result.speed)
    // result.percent = Cesium.Property.getValueOrDefault(this._percent, time, 0.3, result.percent)
    // result.gradient = Cesium.Property.getValueOrDefault(this._gradient, time, 0.08, result.gradient)
    // return result
  }

  equals (other) {
    return (this === other ||
          (other instanceof SetFowLineMaterial &&
              Cesium.Property.equals(this._color, other._color) &&
              Cesium.Property.equals(this._speed, other._speed) &&
              Cesium.Property.equals(this._percent, other._percent) &&
              Cesium.Property.equals(this._gradient, other._gradient))
    )
  }
  /** 销毁
   * @method
   */
  destroy () {
    this._EntityCollections.entities.removeAll()
  }
  /**
   * 控制显示
   */
  setShow () {
    this._EntityCollections.entities.show = true
  }
  /**
   * 控制隐藏
   */
  setHide () {
    this._EntityCollections.entities.show = false
  }
  /** 创建流线
   * @method
   * @param {Object} item 对象参数
   * properties:
   * @param {String} lineColor 飞线颜色 default: this._lineColor
   * @param {Number} lineWidth 飞线直径大小 default: this._lineWidth
   * @param {Number} speed 流线速度 默认5* Math.random()
   * @param {Number} percent 流线颜色渐变值 默认0.3
   * @param {Number} gradient 流线外包通道透明度 默认0.08
   */
  getMaterial (arg) {
    return new Cesium.SetFowLineMaterial({
      color: Cesium.Color.fromCssColorString((arg && arg.lineColor) || 'rgba(22,101,230,1)'),
      // speed: (arg && arg.speed) || 5 * Math.random(),
      speed: (arg && arg.speed) || 5,
      percent: (arg && arg.percent) || 0.3,
      gradient: (arg && arg.gradient) || 0.08
    })
  }
  /** 给cesium添加拓展材质类
   * @method
   * @param {String} fs 材质 default: this._fs
   */
  initMaterial (fs) {
    Cesium.SetFowLineMaterial = SetFowLineMaterial
    Cesium.Material.SetFowLineMaterial = 'SetFowLineMaterial'
    Cesium.Material.LineFlowMaterialType = 'LineFlowMaterialType'
    Cesium.Material.LineFlowMaterialSource = fs || this._fs

    Cesium.Material._materialCache.addMaterial(Cesium.Material.LineFlowMaterialType, {
      fabric: {
        type: Cesium.Material.LineFlowMaterialType,
        uniforms: {
          color: Cesium.Color.fromCssColorString('rgba(22,101,230,1)'),
          speed: 2.0,
          percent: 0.5,
          gradient: 0.5
        },
        source: Cesium.Material.LineFlowMaterialSource
      },
      translucent: function (material) {
        return true
      }
    })
  }
}
setTimeout(() => {
  Object.defineProperties(SetFowLineMaterial.prototype, {
    color: Cesium.createPropertyDescriptor('color'),
    speed: Cesium.createPropertyDescriptor('speed'),
    percent: Cesium.createPropertyDescriptor('percent'),
    gradient: Cesium.createPropertyDescriptor('gradient')
  })
}, 0)
export default SetFowLineMaterial
