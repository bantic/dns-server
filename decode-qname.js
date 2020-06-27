// Pointers start with two 1 bits, and the pointer value is the
// remaining 6 bits and the following byte.
// Label-lengths are 1 byte and always start with two 0 bits,
// so their max value is 0b00111111 == 63
// If a byte &s this MASK, it is a pointer
const POINTER_MASK = 0b11000000;

const bytesToAscii = (bytes) => {
  let str = '';
  for (let byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return str;
};

module.exports = function decodeQname(bytes, offset) {
  let labels = [];
  let len;
  let originalOffset = offset;
  let jumps = 0;
  let maxJumps = 5;
  let hasJumped = false;

  while ((len = bytes[offset]) !== 0) {
    if (len & POINTER_MASK) {
      let nextOffset =
        ((bytes[offset] ^ POINTER_MASK) << 8) | bytes[offset + 1];
      jumps += 1;
      if (jumps > maxJumps) {
        throw new Error(`Too many jumps: ${jumps} > ${maxJumps}`);
      }
      if (!hasJumped) {
        hasJumped = true;
      }
      offset = nextOffset;
    } else {
      labels.push(bytesToAscii(bytes.slice(offset + 1, offset + 1 + len)));
      offset += len + 1;
    }
  }
  let byteLength;
  if (hasJumped) {
    byteLength = 2; // the length of the first pointer
  } else {
    offset += 1; // to account for the final 0x00 byte
    byteLength = offset - originalOffset;
  }
  return [labels.join('.'), byteLength];
};
