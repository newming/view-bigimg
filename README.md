# view-bigimg

a pure library for zooming and panning your web images

[demo](http://newming.cn/view-bigimg/demo/)

## Features

- Support touch devices
- Smooth dragging and panning images
- Pinch in / Pinch out to zoom in/ zoom out

## How to use

#### A. with inline script

```html
<link rel="stylesheet" href="view-bigimg.css">
<script src="view-bigimg.js"></script>
<script>
  var viewer = new ViewBigimg()

  var wrap = document.getElementById('wrap')
  wrap.onclick = function (e) {
    if (e.target.nodeName === 'IMG') {
      viewer.show(e.target.src.replace('.jpg', '-big.jpg'))
    }
  }
</script>
```

#### B. with npm

```bash
npm i view-bigimg
```

```js
import 'view-bigimg/lib/view-bigimg.css'
import ViewBigimg from 'view-bigimg'

var viewer = new ViewBigimg
viewer.show(imgsrc)
```

## API

- new ViewBigimg(options)
  - show(imgsrc)
  - destroy()

### new ViewBigimg(options)

Creates an instance of ViewBigimg

| Param | Type | Default | Description |
| ---- | ---- | ---- | ---- |
| options | Object | {} | options |
| options.zoomValue | Number | 100 | default zoom size |
| options.maxZoom | Number | 500 | maxium zoom size |
| options.refreshOnResize | Boolean | true | whether refresh when window resize, default is true |
| options.zoomOnMouseWheel | Boolean | true | enable mousewheel to zoom images |