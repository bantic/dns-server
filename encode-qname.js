module.exports = function encodeQname(qname) {
  let pieces = qname.split('.');
  let bytes = [];
  let nullByte = 0x0;
  for (let piece of pieces) {
    let encodedBytes = piece.split('').map((char) => char.charCodeAt(0));
    bytes = [...bytes, piece.length, ...encodedBytes];
  }
  return [...bytes, nullByte];
};
