'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function () {
    return _default;
  }
});

const _default = new Proxy(
  {},
  {
    get: function getter(_target, key) {
      if (key === '__esModule') {
        return false;
      }
      return key;
    }
  }
);

if (
  (typeof exports.default === 'function' ||
    (typeof exports.default === 'object' && exports.default !== null)) &&
  typeof exports.default.__esModule === 'undefined'
) {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}
