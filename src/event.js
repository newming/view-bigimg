import isPassive from './isPassive'

function TouchEvent(container, options) {
  this.container = container
  // an enpty function
  var noop = function () {}
  this.onStart = options.onStart || noop
  this.onMove = options.onMove || noop
  this.onEnd = options.onEnd || noop
  this.onMouseWheel = options.onMouseWheel || noop
  this.onClick = options.onClick || noop
  this.onPinch = options.onPinch || noop
}
TouchEvent.prototype.init = function () {
  var self = this
  this.startHandle = function startHandle(estart) {
    estart.preventDefault()
    var eventType = estart.type

    var touchMove = eventType === 'touchstart' ? 'touchmove' : 'mousemove'
    var touchEnd = eventType === 'touchstart' ? 'touchend' : 'mouseup'

    // 注意先后顺序，如果先拿 touches 的容易报错
    var sx = estart.clientX || estart.touches[0].clientX
    var sy = estart.clientY || estart.touches[0].clientY

    var start = self.onStart(estart, {
      x: sx,
      y: sy
    })

    if (start === false) return

    if (eventType === 'touchstart' && estart.touches[1]) {
      self.onPinch(estart)
    }

    function moveListener(emove) {
      emove.preventDefault()

      //get the cordinates
      var mx = emove.clientX || emove.touches[0].clientX
      var my = emove.clientY || emove.touches[0].clientY

      self.onMove(emove, {
        dx: mx - sx,
        dy: my - sy,
        mx: mx,
        my: my
      })
    }
    function endListener() {
      document.removeEventListener(touchMove, moveListener)
      document.removeEventListener(touchEnd, endListener)
      self.onEnd()
    }
    document.addEventListener(touchMove, moveListener, touchMove === 'touchmove' && isPassive() ? {
      capture: false,
      passive: false
    } : false)
    document.addEventListener(touchEnd, endListener)
  }

  this.container.addEventListener('touchstart', this.startHandle, false)
  this.container.addEventListener('mousedown', this.startHandle, false)
  this.container.addEventListener('mousewheel', this.onMouseWheel, false)
  this.container.addEventListener('click', this.onClick, false)


  return this
}

TouchEvent.prototype.destroy = function () {
  this.container.removeEventListener('touchstart', this.startHandle)
  this.container.removeEventListener('mousedown', this.startHandle)
  this.container.removeEventListener('mousewheel', this.onMouseWheel)
  this.container.removeEventListener('click', this.onClick)
}

export default TouchEvent
