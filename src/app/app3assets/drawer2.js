/** 用于ShowSection组件中 drawer类 */

class Drawer
{
  constructor({ root, width, height, preScale })
  {
    this.root = null
    this.observer = null
    this.observerEl = null
    this.canvas = document.createElement('canvas') // 创建canvas元素
    this.context = this.canvas.getContext('2d') // 创建一个2d上下文
    this.preScale = preScale
    this.setCanvasSize(width, height)
    this.setLineStyle()
    this.setTextStyle()
    this.$mount(root) // 把canvas元素插入到根标签之后
  }

  setCanvasSize(width, height)
  {
    this.drawStart()
    this.clearRect(0, 0, this.canvas.width, this.canvas.height) // 擦除矩形区域
    let scaleN = this.preScale
    let newWidth = width * scaleN; // 原始宽度的4倍
    let newHeight = height * scaleN; // 原始高度的4倍
    this.canvas.height = newHeight
    this.canvas.width = newWidth
    this.canvas.style.height = newHeight + 'px'
    this.canvas.style.width = newWidth + 'px'
    this.context.scale(scaleN, scaleN)
    return this
  }

  setLineStyle(width = 1, color = 'black')
  {
    this.context.lineWidth = width // 设置线宽
    this.context.strokeStyle = color // 画笔颜色设置
    return this
  }

  setTextStyle({ font, align, base } = {})
  {
    this.context.font = (font || '5px') + ' 宋体,san-serif'
    this.context.textAlign = align || 'center'
    this.context.textBaseline = base || 'middle'
    return this
  }

  setLineDash(type)
  {
    let arr = null
    switch (type)
    {
    case 0:
      arr = []
      break
    case 1:
      arr = [3, 3]
      break
    case 2:
      arr = [16, 3, 2, 3]
      break
    case 3:
      arr = [15, 3, 3]
      break
    default: arr = []
    }
    this.context.setLineDash(arr)
  }

  drawText(text, sx, sy, rule, color)
  {
    let context = this.context,
      font = rule.match(/\d+px/)
    context.fillStyle = color || '#FFFFFF'
    context.font = font + ' 宋体,san-serif'
    context.fillText(text, sx, sy)
    let textCoords = this.getTextCoor(text, sx, sy)
    return textCoords
  }

  getTextCoor(text, x, y)
  {
    // 获取文本的宽度
    let width = this.context.measureText(text).width;

    // 计算边界框的坐标范围
    let left = x - width / 2; // 左边界
    let right = x + width / 2; // 右边界
    let top = y - parseInt(this.context.font) / 2; // 上边界
    let bottom = y + parseInt(this.context.font) / 2; // 下边界
    return {cooordinate: [[left, top], [right, top], [right, bottom], [left, bottom], [left, top]], rect: {xmin: left, xmax: right, ymin: top, ymax: bottom}}
  }

  // 绘制线
  drawLine(coords, color, width, scale)
  {
    let firstCoor = coords[0].map(item => item * (scale || 1))
    let context = this.context,
      array = coords.slice(1)
    this.setLineStyle(width || 0.5, color)
    context.beginPath()
    context.moveTo(...firstCoor)
    for (let b of array)
      context.lineTo(b[0] * (scale || 1), b[1] * (scale || 1))
    context.stroke()
    return this
  }

  // 绘制圆
  drawCircle(sx, sy, radius, color)
  {
    this.context.beginPath()
    this.context.arc(sx, sy, radius, 0, 2 * Math.PI)
    this.context.fillStyle = color
    this.context.fill()
  }

  // 绘制贝塞尔曲线
  drawCurve(coords, fill, color)
  {
    let context = this.context,
      temp = coords[0],
      opera = 1,
      array = []
    context.beginPath()
    context.moveTo(...temp)

    for (let c of coords.slice(1))
    {
      if (temp[0] === c[0] || (opera ? temp[0] > c[0] : temp[0] < c[0]))
      {
        array.length > 0 && this.bezierCurve(array, opera)
        array = []
        temp = c
        temp[0] === c[0] ? context.lineTo(c[0], c[1]) : array.push(temp)
        opera = !opera
      }
      else
      
        array.push(temp = c)
    }
    context.save()
    this.setLineStyle(1, color)
    context.scale(0.25, 0.25)
    context.fillStyle = fill
    context.fill()
    this.context.stroke()
    context.restore()
  }

  bezierCurve(coords, opera)
  {
    let context = this.context
    if (coords.length === 1)
    
      return context.lineTo(coords[0][0], coords[0][1])
    
    if (coords.length === 2)
    
      return context.quadraticCurveTo(...coords[0], ...coords[1])
    
    if (opera)
    {
      let index = 0,
        temp = coords.slice(0, 3)
      while (temp.length === 3)
      {
        context.bezierCurveTo(temp[0][0], temp[0][1], temp[1][0], temp[1][1], temp[2][0], temp[2][1])
        index += 3
        temp = coords.slice(index, index + 3)
      }
      temp = temp.length === 2 ? temp : coords.slice(-2)
      context.quadraticCurveTo(temp[0][0], temp[0][1], temp[1][0], temp[1][1])
    }
    else
    {
      let index = coords.length % 3,
        temp = null
      if (index !== 0)
      {
        temp = coords.slice(0, 2)
        context.quadraticCurveTo(temp[0][0], temp[0][1], temp[1][0], temp[1][1])
      }
      temp = coords.slice(index, index + 3)
      while (temp.length === 3)
      {
        context.bezierCurveTo(temp[0][0], temp[0][1], temp[1][0], temp[1][1], temp[2][0], temp[2][1])
        index += 3
        temp = coords.slice(index, index + 3)
      }
    }
  }
  setImage(data, imgName, scale)
  {
    let _this = this
    let realScale = scale || 1
    return new Promise((resolve, reject) =>
    {
      if (data.rect.ymin < 0 || data.rect.ymax < 0)
      {
        let min = data.rect.ymin, max = data.rect.ymax
        data.rect.ymin = Math.abs(max)
        data.rect.ymax = Math.abs(min)
      }
      let sx = data.rect.xmin * realScale, ex = data.rect.xmax * realScale, sy = Math.abs(data.rect.ymin) * realScale, ey = Math.abs(data.rect.ymax) * realScale
      let src = `static/hole/${imgName || data.text}.svg`
      let image = new Image()
      image.src = src
      image.onload = function()
      {
        _this.drawImage(this, sx, ex, sy, ey, realScale)
        resolve(1)
      }
    })
  }
  /**
   * @method
   * canvas画图片 -- 裁剪图片必须是正方形图片画入，不然出现参差不齐的情况
   * @param {Object} img 图片对象数据
   * @param {Number} sx 起始横坐标
   * @param {Number} ex 结束横坐标
   * @param {Number} sy 起始纵坐标
   * @param {Number} ey 结束纵坐标
   */
  drawImage(img, sx, ex, sy, ey, scale)
  {
    let deltWidth = this.context.lineWidth
    let realSx = sx + deltWidth, realSy = sy + deltWidth, realEx = ex - deltWidth, realEy = ey - deltWidth
    // 清空图片模块画布
    this.context.clearRect(realSx, realSy, realEx - realSx, realEy - realSy)
    let imgW =  realEx - realSx
    let w = img.width * scale,
      h = img.height * scale
    let context = this.context
    let preSy = realSy
    let preH = h
    let n = 0, nC = imgW / w, ifM = false
    if (parseInt(nC.toString()) === parseFloat(nC.toString()))
      ifM = false
    else
      ifM = true
    n = Math.floor(nC)
    let func = () =>
    {
      realSy = preSy
      h = preH
      while ((realSy < realEy && h !== 0))
      {
        h = realSy + h < realEy ? h : realEy - realSy
        context.drawImage(img, 0, 0, w, h, realSx, realSy, w, h)
        realSy = realSy + h < realEy ? realSy + h : realEy
      }
    }
    for (let i = 0; i < n; i++)
    {
      realSx += i * w
      func()
    }
    if (ifM)
    {
      realSx += n > 1 ? (n - 1) * w : n * w
      w = imgW - n * w
      func()
    }
  }
  // 绘制多边形
  drawPolygon(coords, fill, color)
  {
    let context = this.context,
      array = coords.slice(1)
    context.beginPath()
    context.moveTo(Math.abs(coords[0][0]), Math.abs(coords[0][1]))
    for (let b of array)
      context.lineTo(Math.abs(b[0]), Math.abs(b[1]))
    
    context.save()
    this.setLineStyle(1, color)
    // context.scale(0.25, 0.25)
    context.fillStyle = fill
    context.fill() // 绘制轮廓里面的内容
    context.stroke() // 绘制轮廓
    context.restore()
  }

  drawRect(coords, fill)
  {
    let context = this.context,
      sx = Math.abs(coords[3][0]),
      sy = Math.abs(coords[3][1]),
      ex = Math.abs(coords[1][0]),
      ey = Math.abs(coords[1][1])
    context.beginPath()
    context.rect(sx, sy, ex - sx, ey - sy)
    context.save()
    // context.scale(0.25, 0.25)
    context.fillStyle = fill
    context.fill()
    context.restore()
  }

  // 绘制结束填充线段
  drawEnd()
  {
    this.context.closePath()
    this.context.stroke()
  }

  // 绘制开始 开启路径
  drawStart()
  {
    this.context.beginPath()  // 清空子路径，得到一个新的路径（创建新路径）
  }

  // 设置填充纹理颜色
  fillPattern(src, func)
  {
    let img = new Image() // 新建图像对象
    let context = this.context
    if (src.match('data:image')) // 匹配
    {
      img.onload = function()
      {
        func(context.createPattern(img, 'repeat'))
      }
      img.src = src
    }
  }

  // 清除选中画布
  clearRect(sx, sy, ex, ey)
  {
    if (ex && ey)
    
      this.context.clearRect(sx, sy, ex - sx, ey - sy)
    
    else
    
      this.context.clearRect(sx, sy, this.canvas.width / 2, this.canvas.height / 2)
  }

  $mount(root)
  {
    if (root)
    {
      this.root = root
      this.root.appendChild(this.canvas)
      return this.canvas
    }
  }
}
export default Drawer
