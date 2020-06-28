const { readU32 } = require('./utilities');

module.exports = function decodeRdata({ record }) {
  // 10 bytes after the end of the domain name,
  // 2 for type,
  // 2 for class,
  // 4 for ttl,
  // 2 for rdlength
  let offset = record.offset + 10;
  let bytes = record.bytes;
  let length = record.rdlength;
  let type = record.type;
  let data = {};

  if (type === 'A') {
    data.address = bytes.readUInt32BE(offset);
  }

  return data;
};
