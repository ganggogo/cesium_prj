<style lang="scss">

</style>
<template>
  <div id="canvasContainer" @dblclick="forDbClick($event)">
    <Editor :isImage="isEditImg" @pattern="commitModify" @texts="editText" :textVl="editedText" ref="editor"></Editor>
  </div>
</template>
<script>
/**
 * 生成画布-绘制GeoJson
 */
import geoinfo from './app3assets/realdata'
import Drawer from './app3assets/drawer2'
import p from './app3assets/inPolygon'
import Editor from './app3assets//editor.vue'
let temp = { coords: [], marks: {}, rect: {}, data: {} }
let data = []
export default {
  components: { Editor },
  data()
  {
    return {
      canvasBgColor: '#475164',
      areaBoxLineColor: '#ee2746',
      originPoint: [0 ,0], // 起始原点坐标
      preScale: 1, // 原始缩放倍数
      curScale: 1, // 当前滚轮控制缩放倍数
      curCalculateX: 0, // 当前累计偏移x
      curCalculateY: 0, // 当前累计偏移y
      PreX: 0, // 起始偏移X
      preY: 0, // 起始偏移Y
      isEditImg: false, // 是否是编辑图片
      editedText: '' // 编辑传入的文字
    }
  },
  mounted()
  {
    let self = this
    self.$nextTick(async() =>
    {
      data = geoinfo.geoinfo
      let coordYArr = [], coordXArr = []
      this.preScale = 4
      data.forEach(item =>
      {
        coordYArr = coordYArr.concat(self.getCoors(item.geom.coordinates, [], 'y'))
        coordXArr = coordXArr.concat(self.getCoors(item.geom.coordinates, [], 'x'))
      })
      let maxXCoorVal = Math.max(...coordXArr)
      let minXCoorVal = Math.min(...coordXArr)
      let maxYCoorVal = Math.max(...coordYArr)
      let minYCoorVal = Math.min(...coordYArr)
      console.log(maxXCoorVal, maxYCoorVal)
      let container = document.getElementById('canvasContainer');
      self.drawer = new Drawer({
        width: maxXCoorVal + 80,
        height: maxYCoorVal + 80,
        preScale: self.preScale
      })
      window.context = self.drawer.context
      self.drawer.$mount(container)
      self.PreX =  (maxXCoorVal + 80) / 2 - (maxXCoorVal - minXCoorVal) / 2
      console.log(self.PreX) // 40
      this.PreY =  10
      console.log(self.PreY)

      self.drawer.context.translate(self.PreX, this.PreY)
      await self.paint()

      // 鼠标缩放
      const debouncedForWheel = self.debounce(self.forWheel.bind(self), 180)
      // 添加滚轮事件监听
      container.addEventListener('wheel', (ev) =>
      {
        ev.preventDefault()
        debouncedForWheel(ev)
      })

      // 鼠标按下
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;

      container.addEventListener("mousedown", function(event) {
        if (event.button === 0) { // 0 表示鼠标左键
          isDragging = true;
          lastX = event.clientX;
          lastY = event.clientY;
        }
      });

      let debouncedMouseMove = self.debounce(async function(event) {
        if (isDragging) {
          let deltaX = event.clientX - lastX;
          let deltaY = event.clientY - lastY;
          // 调整画布的位移
          // 这里的 translate 函数会在原有的基础上叠加位移
          self.drawer.context.translate(deltaX / self.preScale, deltaY / self.preScale);
          let tmpDelX = Math.abs(deltaX) / self.preScale, tmpDelY = Math.abs(deltaY) / self.preScale;
          // 如果位移过短，则阻止
          if (tmpDelX < 1 || tmpDelY < 1) return
          self.curCalculateX += deltaX / self.preScale
          self.curCalculateY += deltaY / self.preScale
          lastX = event.clientX;
          lastY = event.clientY;
          // 保存绘图状态
          context.save();
          context.scale(self.curScale, self.curScale);
          await self.paint()
          context.restore() // 恢复绘图状态
        }
      }, 50); // 设置防抖延迟时间为50ms

      container.addEventListener("mousemove", debouncedMouseMove);

      container.addEventListener("mouseup", async function(event) {
        if (event.button === 0) { // 0 表示鼠标左键
          isDragging = false;
        }
      });
    })
  },
  computed: {
    curPoint()
    {
      return [(this.originPoint[0] - this.PreX - this.curCalculateX) / this.curScale, (this.originPoint[1] - this.PreY - this.curCalculateY) / this.curScale]
    }
  },
  methods:
  {
    /**
     * 当前坐标换算
     * @method
     * @param {Object} ev 事件对象
     * @returns {Object}
     */
    setCurrent(ev)
    {
      console.log(this.curCalculateX, this.curCalculateY)
      return {
        x: ((ev.offsetX / (this.preScale)) - this.PreX - this.curCalculateX) / this.curScale,
        y: ((ev.offsetY / (this.preScale)) - this.PreY - this.curCalculateY) / this.curScale
      }
    },
    forDbClick(ev)
    {
      // 清除图片范围框线条
      if (temp.coords.length) this.drawer.drawLine(temp.coords, '#FFFFFF', 0.5 * this.curScale, this.curScale)
      // // 清除文字图片范围框线条
      // if (this.tmpTextBoxLineCoords) this.drawer.drawLine(temp.coords, this.canvasBgColor, 0.5 * this.curScale, this.curScale)
      let cur = this.setCurrent(ev)
      console.log(cur)
      let rlt = p.eachPolygons(cur.x, cur.y, data)
      console.log(rlt)
      if (rlt)
      {
        let tmpcoordinates = rlt.geom.coordinates[0]
        temp.data = rlt
        let coords = tmpcoordinates
        
        this.$nextTick(() =>
        {
          this.$refs.editor.openBoxer()
          if (Array.isArray(tmpcoordinates[0])) // 根据坐标串判断是不是范围，还是文字
          {
            this.isEditImg = true
            this.drawAreaLine(coords, this.areaBoxLineColor, 0.5 * this.curScale, this.curScale)
            temp.coords = coords
            temp.rect = rlt.rect
          }
          else
          {
            this.isEditImg = false
            this.toEditRlt = rlt
            this.$nextTick(() =>
            {
              this.editedText = rlt.text
            })
          }
        })
      }
    },
    /**
     * 区域划线
     * @method
     */
    drawAreaLine(coords, color, lineWidth, scale)
    {
      coords.forEach(coord =>
      {
        coord[0] = Math.abs(coord[0])
        coord[1] = Math.abs(coord[1])
      })
      this.drawer.drawLine(coords, color, lineWidth, scale)
    },
    setTemporary(rlt)
    {
      temp.coords = rlt.geom.coordinates[0]
      temp.rect = rlt.rect
      temp.marks = {
        name: (rlt.att && rlt.att.dcbm) || '',
        color: rlt.color,
        text: rlt.text,
        remarks: rlt.remarks
      }
    },
    // 防抖函数
    debounce(func, delay) {
      let timer;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
      }
    },
    // 节流函数
    throttle(func, delay) {
        let timer;
        return function(...args) {
            if (!timer) {
                timer = setTimeout(() => {
                    func.apply(this, args);
                    timer = null;
                }, delay);
            }
        };
    },
    // 提交图列修改
    commitModify(rlt)
    {
      console.log(rlt)
      temp.data.text = rlt
      this.drawer.setImage(temp.data, rlt, this.curScale)
    },
    // 取出最大坐标数值
    getCoors(data, resarr, axis)
    {
      if (data[0] && Array.isArray(data[0]))
      {
        data.forEach(item =>
        {
          this.getCoors(item, resarr, axis)
        })
      }
      else
      {
        resarr.push(axis === 'x' ? Math.abs(data[0]) : Math.abs(data[1]))
      }
      return resarr
    },
    fillContext()
    {
      let w = this.drawer.canvas.width,
        h = this.drawer.canvas.height
      this.drawer.context.fillStyle = this.canvasBgColor
      this.drawer.context.fillRect(this.curPoint[0], this.curPoint[1], w, h)  // 从（-200,-200）填充到整个canvas上
      // this.drawer.context.fillRect(0, 0, w, h)  // 从（-200,-200）填充到整个canvas上
    },
    // 鼠标缩放事件
    async forWheel(ev)
    {
      let context = this.drawer.context
      // 根据滚轮的滚动方向调整缩放比例
      if (ev.deltaY < 0)
        this.curScale *= 1.2
      else
        this.curScale /= 1.2
      context.save();
      context.scale(this.curScale, this.curScale);
      await this.paint()
      context.restore() // 恢复绘图状态
    },
    async paint()
    {
      console.log('执行绘制')
      this.fillContext() // canvas填充矩形
      for (let i = 0; i < data.length; i++)
      {
        let d = data[i], geotype = d.geotype, lintype = d.lintype
        let coords = d.geom.coordinates
        if (geotype === 3)
        {
          coords.forEach(coord =>
          {
            coord[0] = Math.abs(coord[0])
            coord[1] = Math.abs(coord[1])
          })
          this.drawer.drawLine(coords, '#ffffff', 0.5)
        }
        else if (geotype === 4)
        {
          console.log(d)
          await this.drawer.setImage(d)
        }
        else if (geotype === 5)
        {
          this.drawText(d, coords)
        }
      }
    },
    drawText(d, coords, color)
    {
      function setCoords(d, func)
      {
        let res = func
        d.selfCoords = res.cooordinate
        d.rect = res.rect
      }
      // console.log(d.text, d)
      let rule = (d.height > 28 ? d.height - 8 : d.height - 2) / 2 + 'px'
      // 新增匹配\n格式
      if (d.text.match(/\n/))
      {
        let str = d.text.split('\n'), xmin = [], xmax = [], ymin = [], ymax = []
        for (let i = 0; i < str.length; i++)
        {
          let res = this.drawer.drawText(str[i], coords[0], Math.abs(coords[1]) + d.height * i, rule, color)
          xmin.push(res.rect.xmin)
          xmax.push(res.rect.xmax)
          ymin.push(res.rect.ymin)
          ymax.push(res.rect.ymax)
        }
        xmin = Math.min(...xmin), xmax = Math.max(...xmax), ymin = Math.min(...ymin), ymax = Math.max(...ymax)
        d.selfCoords = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]
        d.rect = {xmin, xmax, ymin, ymax}
      }
      else
        setCoords(d, this.drawer.drawText(d.text, coords[0], Math.abs(coords[1]), rule, color))
    },
    /**
     * 修改字体样式并重绘此区域
     * @method
     * @param {Object} data
     */
     editText(data)
     {
      let rlt = this.toEditRlt, coords = rlt.selfCoords, rect = rlt.rect, coordinates = rlt.geom.coordinates
      this.drawer.context.fillStyle = this.canvasBgColor
      this.drawer.context.fillRect(coords[0][0], coords[0][1], rect.xmax - rect.xmin, rect.ymax - rect.ymin)
      rlt.text = data.text
      this.drawText(rlt, coordinates, data.color)
     }
  }
}
</script>
