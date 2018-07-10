// isPassive
function isPassive () {
  var supportsPassiveOption = false
  try {
    addEventListener('test', null, Object.defineProperty({}, 'passive', {
      get: function () {
        supportsPassiveOption = true
      }
    }))
  } catch (e) {}
  return supportsPassiveOption
}

export default isPassive