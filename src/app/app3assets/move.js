/** 拖拽事件 移动组件 */
import Queue from './queue'

const events = {
  mousemove: function(ev)
  {
    ev.stopPropagation()

    if (this.downed)
    {
      clearTimeout(this.timer)
      let _this = this
      this.el.style.left = ev.clientX - this.recordX + 'px'
      this.el.style.top = ev.clientY - this.recordY + 'px'
      this.tiemr = setTimeout(function()
      {
        _this.func && _this.func()
      }, 400)
    }
  },
  mousedown: function(ev)
  {
    ev.stopPropagation()
    this.downed = !0
    this.recordX = ev.clientX - this.el.offsetLeft
    this.recordY = ev.clientY - this.el.offsetTop
  },
  mouseleave: function(ev)
  {
    this.downed = !1
  },
  mouseup: function(ev)
  {
    this.downed = !1
  }
}

class Move
{
  constructor(el, func)
  {
    this.el = el
    this.recordX = 0
    this.recordY = 0
    this.left = 0
    this.top = 0
    this.downed = !1
    this.timer = null
    this.func = func || function()
    {}
    this.events = Object.keys(events)
  }

  bindEvent()
  {
    for (let e of this.events)
    
      this.el.addEventListener(e, events[e].bind(this))
    
    return this
  }

  unbindEvent()
  {
    for (let e of this.events)
    
      this.el.removeEventListener(e, events[e])
    
    return this
  }
}

const queue = new Queue(Move)

export default {
  bind: function(el, binding)
  {
    queue.addItem(el, binding.value)
  },
  unbind: function(el, binding)
  {
    queue.delItem(el)
  }
}
