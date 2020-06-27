// The maximum label length is 63.
// Pointers and Label-Lengths are both stored in 1 bytes, but
// a pointer will start with two 1s so it would
// be interpreted as longer than this length. That's how to
// distinguish a label from a pointer when decoding the qname
// TODO, implement pointers
const MAX_LABEL_LEN = 63;

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
  while ((len = bytes[offset]) !== 0) {
    if (len > MAX_LABEL_LEN) {
      throw new Error(`Unimplemented: encountered pointer`);
    }
    labels.push(bytesToAscii(bytes.slice(offset + 1, offset + 1 + len)));
    offset += len + 1;
  }
  offset += 1;
  let byteLength = offset - originalOffset;
  return [labels.join('.'), byteLength];
};
