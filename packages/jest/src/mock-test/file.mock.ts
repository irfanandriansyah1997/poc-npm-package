'use strict';
module.exports = {
  blurDataURL: 'data:image/png;base64,imagedata',
  height: 40,
  src: '/img.jpg',
  width: 40
};

if (
  (typeof exports.default === 'function' ||
    (typeof exports.default === 'object' && exports.default !== null)) &&
  typeof exports.default.__esModule === 'undefined'
) {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}
