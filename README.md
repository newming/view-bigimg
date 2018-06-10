# view-bigimg

a pure library for zooming and panning your web images

## Features

- Support touch devices
- Smooth dragging and panning images
- Pinch in / Pinch out to zoom in/ zoom out

## How to use

#### A. use script

```html
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

```js
import ViewBigimg from 'view-bigimg'

var viewer = new ViewBigimg
viewer.show(src)
```