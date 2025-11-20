class IdleRenderController
{
  constructor(viewer, options = {})
  {
    if (!viewer || !viewer.scene)
    
      throw new Error('IdleRenderController requires a valid Cesium Viewer')
    

    // 配置项
    this.viewer = viewer
    this.idleTimeout = options.idleTimeout || 5000 // 毫秒
    this.enableDebug = options.debug || false

    // 初始化状态
    this._handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    this._lastInteraction = Date.now()
    this._timer = null

    // 启用按需渲染 + 暂停时间推进
    viewer.scene.requestRenderMode = true
    viewer.clock.shouldAnimate = false

    // 初始化事件监听和定时器
    this._bindEvents()
    this._resetTimer()

    if (this.enableDebug)
    
      console.log('[IdleRenderController] Initialized')
    
  }

  _bindEvents()
  {
    const events = [
      Cesium.ScreenSpaceEventType.LEFT_DOWN,
      Cesium.ScreenSpaceEventType.MIDDLE_DOWN,
      Cesium.ScreenSpaceEventType.RIGHT_DOWN,
      Cesium.ScreenSpaceEventType.WHEEL,
      Cesium.ScreenSpaceEventType.PINCH_START,
      Cesium.ScreenSpaceEventType.PINCH_END,
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    ]

    events.forEach(type =>
    {
      this._handler.setInputAction(() => this._onUserInteraction(), type)
    })
  }

  _onUserInteraction()
  {
    const now = Date.now()
    this._lastInteraction = now

    if (this.viewer.clock.shouldAnimate !== true)
    {
      this.viewer.clock.shouldAnimate = false // 保证动画不动
      this.viewer.scene.requestRender()
      this._resetTimer()

      if (this.enableDebug)
      {
        // console.log('[IdleRenderController] 监测到操作，开始渲染');
      }
    }
  }

  _resetTimer()
  {
    clearTimeout(this._timer)
    this._timer = setTimeout(() =>
    {
      this.viewer.scene.requestRender() // 最后一帧
      this.viewer.clock.shouldAnimate = false

      if (this.enableDebug)
      {
        // console.log('[IdleRenderController] 无操作，暂停渲染');
      }
    }, this.idleTimeout)
  }

  destroy()
  {
    clearTimeout(this._timer)
    this._handler?.destroy()
    this._handler = null

    if (this.enableDebug)
    
      console.log('[IdleRenderController] 消耗')
    
  }
}
export default IdleRenderController
