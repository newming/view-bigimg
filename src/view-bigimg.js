import TouchEvent from './event'
import isPassive from './isPassive'

const ZOOM_CONSTANT = 15 // increase or decrease value for zoom on mouse wheel
const MOUSE_WHEEL_COUNT = 5 //A mouse delta after which it should stop preventing default behaviour of mouse wheel

const preventDefaultCb = e => e.preventDefault()
/**
 * ease out method
 * @param {Number} t current time
 * @param {Number} b intial value
 * @param {Number} c changed value
 * @param {Number} d duration
 */
function easeOutQuart(t, b, c, d) {
  t /= d
  t--
  return -c * (t * t * t * t - 1) + b
}

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
// 各种兼容 requestAnimationFrame cancelAnimationFrame
(function () {
  var lastTime = 0
  if (window.requestAnimationFrame) {
    return
  }
  var vendors = ['ms', 'moz', 'webkit', 'o']
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']
  }

  if (!window.requestAnimationFrame)
  window.requestAnimationFrame = function (callback) {
    var currTime = new Date().getTime()
    var timeToCall = Math.max(0, 16 - (currTime - lastTime))
    var id = window.setTimeout(function () {
      callback(currTime + timeToCall)
    },
    timeToCall)
    lastTime = currTime + timeToCall
    return id;
  };

  if (!window.cancelAnimationFrame)
  window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  }
}())

/**
 * function to check if image is loaded
 * @param {Node} img en image node
 */
function imageLoaded(img) {
  return img.compvare && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
}

function ImageViewer(container, options) {
  this.container = container
  this.options = Object.assign({}, ImageViewer.defaults, options)

  this.zoomValue = 100

  container.classList.add('iv-container');

  this.imageWrap = container.querySelector('.iv-image-wrap')
  this.closeBtn = container.querySelector('.iv-close')
}

ImageViewer.prototype = {
  constructor: ImageViewer,
  _init () {
    var viewer = this
    var options = viewer.options
    var zooming = false // 是否正在通过手势进行缩放
    var container = viewer.container

    var imageWrap = viewer.imageWrap

    // 鼠标滚轮事件控制缩放失误次数
    var changedDelta = 0
    //handle double tap for zoom in and zoom out
    var touchtime = 0, point

    viewer._imageSlider = new TouchEvent(imageWrap, {
      onStart () {
        if (!viewer.loaded) return false
        if (zooming) return
        var self = this // 这里的 this 是 _imageSlider
        self.imgWidth = viewer.imageDim.w * viewer.zoomValue / 100
        self.imgHeight = viewer.imageDim.h * viewer.zoomValue / 100
        self.curImgLeft = parseFloat(viewer.currentImg.style.left)
        self.curImgTop = parseFloat(viewer.currentImg.style.top)
      },
      onMove (e, position) {
        if (zooming) return
        // 每次移动都把 position 设置到 currentPos
        this.currentPos = position
        var newLeft = this.curImgLeft + position.dx
        var newTop = this.curImgTop + position.dy
        var baseLeft = Math.max((viewer.containerDim.w - this.imgWidth) / 2, 0),
          baseTop = Math.max((viewer.containerDim.h - this.imgHeight) / 2, 0),
          baseRight = viewer.containerDim.w - baseLeft,
          baseBottom = viewer.containerDim.h - baseTop
        // 修正新的 left top 的边界
        newLeft = Math.min(newLeft, baseLeft)
        newTop = Math.min(newTop, baseTop)
        // //fix for right and bottom
        if ((newLeft + this.imgWidth) < baseRight) {
          newLeft = baseRight - this.imgWidth //newLeft - (newLeft + imgWidth - baseRight)
        }
        if ((newTop + this.imgHeight) < baseBottom) {
          newTop = baseBottom - this.imgHeight //newTop + (newTop + imgHeight - baseBottom)
        }
        viewer.currentImg.style.left = newLeft + 'px'
        viewer.currentImg.style.top = newTop + 'px'
      },
      onEnd () {
        if (zooming) return
      },
      onMouseWheel (e) {
        if (!options.zoomOnMouseWheel || !viewer.loaded) {
          return
        }
        // cross-browser wheel delta 这里限制了 delta 不是 1 就是 -1, zoomValue 100 - 500
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta))),
          zoomValue = viewer.zoomValue * (100 + delta * ZOOM_CONSTANT) / 100

        if (!(zoomValue >= 100 && zoomValue <= options.maxZoom)) {
          changedDelta += Math.abs(delta) // 这里 Math.abs(delta) 为 1，即 changedDelta ++
        } else {
          changedDelta = 0
        }

        if (changedDelta > MOUSE_WHEEL_COUNT) return; // 保护措施，在5次 zoomValue 不合法时，不做任何处理

        e.preventDefault();

        var x = e.pageX,
          y = e.pageY

        viewer.zoom(zoomValue, {
          x: x,
          y: y
        })
      },
      // dbclick
      onClick (e) {
        if (touchtime == 0) {
          touchtime = Date.now()
          point = {
            x: e.pageX,
            y: e.pageY
          }
        } else {
          if ((Date.now() - touchtime) < 500 && Math.abs(e.pageX - point.x) < 50 && Math.abs(e.pageY - point.y) < 50) {
            if (viewer.zoomValue == options.zoomValue) {
              viewer.zoom(200)
            } else {
              viewer.resetZoom()
            }
            touchtime = 0
          } else {
            touchtime = 0
          }
        }
      },
      // pinch
      onPinch (estart) {
        if (!viewer.loaded) return
        var touch0 = estart.touches[0],
          touch1 = estart.touches[1]

        if (!(touch0 && touch1)) {
          return
        }

        zooming = true

        var startdist = Math.sqrt(Math.pow(touch1.pageX - touch0.pageX, 2) + Math.pow(touch1.pageY - touch0.pageY, 2)),
          startZoom = viewer.zoomValue,
          center = {
            x: ((touch1.pageX + touch0.pageX) / 2),
            y: ((touch1.pageY + touch0.pageY) / 2)
          }

        var moveListener = function (emove) {
          emove.preventDefault()

          var touch0 = emove.touches[0],
            touch1 = emove.touches[1],
            newDist = Math.sqrt(Math.pow(touch1.pageX - touch0.pageX, 2) + Math.pow(touch1.pageY - touch0.pageY, 2)),
            zoomValue = startZoom + (newDist - startdist) / 2

          viewer.zoom(zoomValue, center)
        }

        var endListener = function () {
          document.removeEventListener('touchmove', moveListener)
          document.removeEventListener('touchend', endListener)
          zooming = false
        }

        document.addEventListener('touchmove', moveListener, isPassive() ? {
          capture: false,
          passive: false
        } : false)
        document.addEventListener('touchend', endListener)
      }
    }).init()

    if (options.refreshOnResize) {
      this._resizeHandler = this.refresh.bind(this)
      window.addEventListener('resize', this._resizeHandler)
    }

    //prevent scrolling the backside if container if fixed positioned
    container.addEventListener('touchmove', preventDefaultCb, isPassive() ? {
      capture: false,
      passive: false
    } : false)
    container.addEventListener('mousewheel', preventDefaultCb)

    //assign event on close button
    this._close = this.hide.bind(this)
    this.closeBtn.addEventListener('click', this._close)
  },
  // 核心方法，处理缩放移动等位置计算
  zoom (perc, point) {
    var self = this,
      maxZoom = this.options.maxZoom,
      curPerc = this.zoomValue,
      curImg = this.currentImg,
      containerDim = this.containerDim,
      imageDim = this.imageDim,
      curLeft = parseFloat(curImg.style.left),
      curTop = parseFloat(curImg.style.top)

    // 约束 perc 的范围 100-500
    perc = Math.round(Math.max(100, perc))
    perc = Math.min(maxZoom, perc)
    // 从哪缩放的坐标，默认从 container 中心缩放
    point = point || {
      x: containerDim.w / 2,
      y: containerDim.h / 2
    }
    self._clearFrames();
    var step = 0

    //calculate base top,left,bottom,right 这里可以考虑放到 self 对象上
    // var baseLeft = (containerDim.w - imageDim.w) / 2,
    //   baseTop = (containerDim.h - imageDim.h) / 2,
    //   baseRight = containerDim.w - baseLeft,
    //   baseBottom = containerDim.h - baseTop

    function _zoom() {
      step++
      if (step < 20) {
        // 20 帧完成动画，不到 20 则启动计时器
        self._zoomFrame = requestAnimationFrame(_zoom)
      }
      // 计算新的缩放值
      var tickZoom = easeOutQuart(step, curPerc, perc - curPerc, 20)
      // 计算新的宽高 left top
      var ratio = tickZoom / curPerc,
        imgWidth = imageDim.w * tickZoom / 100,
        imgHeight = imageDim.h * tickZoom / 100,
        newLeft = -((point.x - curLeft) * ratio - point.x),
        newTop = -((point.y - curTop) * ratio - point.y)

      var baseLeft = Math.max((containerDim.w - imgWidth) / 2, 0),
        baseTop = Math.max((containerDim.h - imgHeight) / 2, 0),
        baseRight = containerDim.w - baseLeft,
        baseBottom = containerDim.h - baseTop

      // 修正新的 left top 的边界
      newLeft = Math.min(newLeft, baseLeft)
      newTop = Math.min(newTop, baseTop)

      //fix for right and bottom
      if ((newLeft + imgWidth) < baseRight) {
        newLeft = baseRight - imgWidth //newLeft - (newLeft + imgWidth - baseRight)
      }
      if ((newTop + imgHeight) < baseBottom) {
        newTop = baseBottom - imgHeight //newTop + (newTop + imgHeight - baseBottom)
      }
      curImg.style.width = imgWidth + 'px'
      curImg.style.height = imgHeight + 'px'
      curImg.style.left = newLeft + 'px'
      curImg.style.top = newTop + 'px'

      self.zoomValue = tickZoom
    }
    _zoom()
  },
  _clearFrames () {
    cancelAnimationFrame(this._zoomFrame)
  },
  resetZoom () {
    this.zoom(this.options.zoomValue)
  },
  //calculate dimensions of image, container and reset the image
  _calculateDimensions () {
    //calculate content width of image and snap image
    var self = this
    var curImg = self.currentImg
    var container = self.container
    var imageWidth = curImg.getBoundingClientRect().width
    var imageHeight = curImg.getBoundingClientRect().height
    var contWidth = container.getBoundingClientRect().width
    var contHeight = container.getBoundingClientRect().height

    // set the container dimension
    self.containerDim = {
      w: contWidth,
      h: contHeight
    }

    //set the image dimension
    var imgWidth, imgHeight
    var ratio = imageWidth / imageHeight

    imgWidth = (imageWidth > imageHeight && contHeight >= contWidth) || ratio * contHeight > contWidth ? contWidth : ratio * contHeight
    imgHeight = imgWidth / ratio

    self.imageDim = {
      w: imgWidth,
      h: imgHeight
    }

    // //reset image position and zoom
    curImg.style.width = imgWidth + 'px'
    curImg.style.height = imgHeight + 'px'
    curImg.style.left = (contWidth - imgWidth) / 2 + 'px'
    curImg.style.top = (contHeight - imgHeight) / 2 + 'px'
    curImg.style.maxWidth = 'none'
    curImg.style.maxHeight = 'none'
  },
  refresh () {
    if (!this.loaded) return
    this._calculateDimensions()
    this.resetZoom()
  },
  show (image) {
    this.container.style.display = 'block'
    if (image) this.load(image)
  },
  hide () {
    this.container.style.display = 'none'
  },
  destroy () {
    window.removeEventListener('resize', this._resizeHandler)
    this._imageSlider.destroy()
    this.closeBtn.removeEventListener('click', this._close)
    this.container.parentNode.removeChild(this.container)
    this.closeBtn = null
    this.container = null
    this.imageWrap = null
    this.options = null
    this._close = null
    this._imageSlider = null
    this._resizeHandler = null
  },
  load (image) {
    var self = this
    var container = this.container
    var imageWrap = this.imageWrap
    var beforeImg = imageWrap.querySelector('.iv-large-image')
    if (beforeImg) {
      imageWrap.removeChild(beforeImg)
    }
    var img = document.createElement('img')
    img.classList.add('iv-large-image')
    img.src = image
    this.currentImg = img
    this.imageWrap.appendChild(img)

    this.loaded = false

    container.querySelector('.iv-loader').style.display = 'block'
    img.style.display = 'none'

    function refreshView() {
      self.loaded = true
      self.zoomValue = 100

      //reset zoom of images
      img.style.display = 'block'
      self.refresh()

      //hide loader
      container.querySelector('.iv-loader').style.display = 'none'
    }
    if (imageLoaded(img)) {
      refreshView()
    } else {
      img.onload = function () {
        refreshView()
      }
    }
  }
}

ImageViewer.defaults = {
  zoomValue: 100,
  maxZoom: 500,
  refreshOnResize: true,
  zoomOnMouseWheel: true
}

function ViewBigimg (options) {
  var imageViewHtml = '<div class="iv-loader"></div><div class="iv-image-view"><div class="iv-image-wrap"></div><div class="iv-close"></div></div>'
  var container = document.createElement('div')
  container.id = 'iv-container'
  container.innerHTML = imageViewHtml
  document.body.appendChild(container)
  var viewer = new ImageViewer(container, options)
  viewer._init()
  return viewer
}

export default ViewBigimg