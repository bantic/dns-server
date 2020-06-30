const assert = require('assert');

function formatIPv4(u32) {
  let hex = u32.toString(16);
  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6), hex.slice(6, 8)]
    .map((hex) => Number(`0x${hex}`))
    .join('.');
}

function uint16ToBytesBE(int) {
  return [(int & 0b1111111100000000) >> 8, int & 0b0000000011111111];
}

assert.strictEqual(formatIPv4(3221226219), '192.0.2.235');

module.exports = {
  formatIPv4,
  uint16ToBytesBE,
};
