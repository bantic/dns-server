// Pointers start with two 1 bits, and the pointer value is the
// remaining 6 bits and the following byte.
// Label-lengths are 1 byte and always start with two 0 bits,
// so their max value is 0b00111111 == 63
// If a byte &s this MASK, it is a pointer
const POINTER_MASK = 0b11000000;
const sum = (arr) => arr.reduce((acc, v) => (acc += v), 0);

const bytesToAscii = (bytes) => {
  let str = '';
  for (let byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return str;
};

/**
 TODO: The returned `byteLength` can be incorrect when, for instance,
 decoding the CNAME RDATA section of a Dns Record.
 This is because when I wrote this originally I assumed that a qname
 would either start with a pointer (in which case the byteLength is 2, the
 size of the pointer) or a series of labels, in which case the byteLength
 could be calculated from the offset of the last label and the offset of the
 first label.
 It seems that for a CNAME RDATA section (and maybe others?) it is possible for
 the qname to have a mix of labels and pointer(s), in which case the as-you-go
 calculation of offset/bytelength in this function can be incorrect.
 TODO: This should be changed to be correct. The sample packet in
 samples/packet-example-response-from-1-1-1-1.txt contains a CNAME RDATA
 that exhibits this behavior.
 It is still decodable because an RDATA section encodes its length (the RDLENGTH field),
 so we can simply ignore the (maybe incorrect) `byteLength` returned from decodeQname
 in this case.
 */
module.exports = function decodeQname(bytes, offset) {
  let labels = [];
  let len;
  let originalOffset = offset;
  let jumps = 0;
  let maxJumps = 127;
  let isPointer = false;
  let hasLooped = false;

  while ((len = bytes[offset]) !== 0) {
    if (offset >= bytes.length) {
      throw new Error(`Incorrect label length`);
    }

    if (len & POINTER_MASK) {
      let nextOffset =
        ((bytes[offset] ^ POINTER_MASK) << 8) | bytes[offset + 1];
      jumps += 1;
      if (jumps > maxJumps) {
        throw new Error(`Too many jumps: ${jumps} > ${maxJumps}`);
      }
      if (!hasLooped) {
        isPointer = true;
      }
      offset = nextOffset;
    } else {
      labels.push(bytesToAscii(bytes.slice(offset + 1, offset + 1 + len)));
      offset += len + 1;
    }
    hasLooped = true;
  }
  let byteLength;
  if (isPointer) {
    byteLength = 2; // the length of the first pointer
  } else {
    offset += 1; // to account for the final 0x00 byte
    byteLength = offset - originalOffset;
  }
  return [labels.join('.'), byteLength];
};
