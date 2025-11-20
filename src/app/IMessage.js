/**
 * cx.IMessage
 * 消息接口类
 *
 * @class
 * @memberof    cx
 * @author      Zhang Fayong
 * @since       2018-04-29
 */
class IMessage
{
  /**
   * @constructor
   */
  constructor()
  {
    this.socket = null
  }

  /**
   * 销毁对象
   * @method
   */
  destroy()
  {
    this.disconnect()
  }

  /**
   * 连接到服务器
   * @method
   * @param   {String}    url             服务地址
   * @param   {String}    username        用户名
   * @returns {Object}                    this
   */
  connect(url, username, callback)
  {
    let self = this
    // let connStr = url + '?userid=' + username + '&_auth=' + cx.localCache.get('authNo')
    let connStr = url + '?userid=' + username
    this.username = username
    if ('WebSocket' in window)
      this.socket = new WebSocket(connStr)
    else if ('MozWebSocket' in window)
      this.socket = new MozWebSocket(connStr)
    else
      return
    this.socket.onopen = () =>
    {
      callback({state: 79, data: '已建立连接~'})
    }
    this.socket.onclose = (event) =>
    {
      callback({state: 0, data: '已关闭连接~'})
    }
    this.onerror = function(event)
    {
      callback({state: 2, data: '建立连接出错~'})
    }
    this.socket.onmessage = (message) =>
    {
      // self.onMessage(message)
      callback({state: 1, data: message})
    }
  }

  /**
   * 断开连接
   * @method
   */
  disconnect()
  {
    if (this.socket)
    {
      this.socket.close()
      this.socket = null
    }
  }

  /**
   * 发送消息
   * @method
   * @param {String}      to              接收者
   * @param {Object}      msg             消息体
   * @returns {Object}                    this
   */
  send(to, msg)
  {
    this.socket.send(to)
    return this
  }
  
  /**
   * 接收消息
   * @method
   * @param {Object}    msg        消息体
   */
  onMessage(msg)
  {
  }
}

export default IMessage
