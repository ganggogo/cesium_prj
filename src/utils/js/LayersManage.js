/**
 * xuagng 20221025 cesium图层管理
 */
import SetFowLineMaterial from './SetFowLineMaterial'
window.DataSourceCollection = []
export default
{
  methods:
  {
    /**
     * 绘制边界
     * @param  {Object}  geoJson      LineString类型的geojson数据
     * @param  {String}  strokeColr   线或多边形的默认轮廓颜色，用css值创建的颜色类型，比如：'rgba(1,19,70,0)'
     * @param  {Number}  speed   流线的流动速度
     */
    async loadBJDataSouces(geoJson, strokeColr, speed)
    {
      let tmpDataSouce = Cesium.GeoJsonDataSource.load(geoJson, { // 这个方法加载geojson文件的路径和对象都可以
        stroke: Cesium.Color.fromCssColorString(strokeColr),
        name: 'InitDp'
      })
      await tmpDataSouce.then(async dataSource =>
      {
        let entities = dataSource.entities.values
        entities.forEach(item =>
        {
          item.polyline.material = new SetFowLineMaterial({}).getMaterial({gradient: 0.5, percent: 1.5, speed: speed || 5, lineColor: strokeColr})
          item.polyline.width = 5
        })
        window.DataSourceCollection.forEach(item =>
        {
          window.Viewer.dataSources.remove(item)
        })
        window.DataSourceCollection.push(dataSource)
        await window.Viewer.dataSources.add(dataSource)
      })
    }
  }
}
