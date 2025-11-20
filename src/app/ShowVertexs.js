/**
 * 组件名称: 获取当前场景实时的模型顶点数、三角形数、Geometry占用内存和Texture占用内存
 * 研发时间: 2024.5.12
 * 研发人员: 徐港
 * 参数说明:
 */
let timer = null, viewer = null
export default {
  data() {
    return {
      vertexNum: 0,
      triangleNum: 0,
      gMemoryNum: 0,
      tMemoryNum: 0
    }
  },

  created()
  {
    timer = setInterval(() =>
    {
      if (!viewer) return viewer = window.viewer
      let { vertexNum, triangleNum, gMemoryNum, tMemoryNum } = this.getVertexNum()
      this.vertexNum = this.formatNumber(vertexNum)
      this.triangleNum = this.formatNumber(triangleNum)
      this.gMemoryNum = this.formatMemory(gMemoryNum)
      this.tMemoryNum = this.formatMemory(tMemoryNum)
    }, 10)
  },

  unmounted()
  {
    if (timer)
    {
      clearInterval(timer)
      timer = null
    }
  },
	
  methods:
  {
    /**
     * @method
     * 获取实时模型顶点数、三角形数
     * @returns {Object} result
     */
    getVertexNum()
    {
      let primitives = viewer.scene._primitives._primitives[0]._primitives,
        result = {vertexNum: 0, triangleNum: 0, gMemoryNum: 0, tMemoryNum: 0}
      if (!primitives.length) return result
      for (let i = 0; i < primitives.length; i++)
      {
        let curModelTileChildren = primitives[i].root.children
        for (let j = 0; j < curModelTileChildren.length; j++)
        {
          let curTile = curModelTileChildren[j], content = curTile.content
          if (!content) continue
          result.triangleNum += content.trianglesLength
          if(content._model && content._model._pipelineResources)
          {
            let vertexArray = content._model._pipelineResources.filter(__ => __.constructor.name === 'VertexArray')
            result.vertexNum += vertexArray.length ? vertexArray[0]._numberOfVertices : 0
          }
          result.gMemoryNum += (content.geometryByteLength ? content.geometryByteLength : 0)
          result.tMemoryNum += (content.texturesByteLength ? content.texturesByteLength : 0)
        }
      }
      return result
    },
    /**
     * @method
     * 格式化模型顶点数、三角形数
     * @param {Number} number
     * @returns {String} result
     */
    formatNumber(number)
    {
      number = number.toFixed(0)
      if (typeof(number) === 'undefined') return
      let units = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿'],
        numString = number.toString(),
        numLength = numString.length,
        result = ''
      for (let i = 0; i < numLength; i++)
      {
        let digit = parseInt(numString[i])
        let unit = units[numLength - i - 1]
        result += `${digit} ${unit} `
      }
      return result
    },
    /**
     * @method
     * 格式化内存数据
     * @param {Number} memoryNum
     * @returns {String}
     */
    formatMemory(memoryNum)
    {
      let units = ['Byte', 'Kb', 'Mb', 'Gb', 'Tb'],
        unitIndex = 0,size = memoryNum
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`
    }
  }
}
