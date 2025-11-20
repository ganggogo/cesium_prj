class Queue
{
  constructor(use)
  {
    this.use = use
    this.list = new Set()
  }

  addItem(el, func, ...other)
  {
    this.list.add(new this.use(el, func, other).bindEvent())
  }

  delItem(el)
  {
    let use = null
    let iterator = this.list.values()
    while ((use = iterator.next().value))
    {
      if (use.el === el)
      
        return this.list.delete(use.unbindEvent())
    }
  }

  clear()
  {
    this.list.forEach(function(value)
    {
      value.unbindEvent()
    })
    this.list.clear()
  }
}
export default Queue
