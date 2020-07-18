const { readU32 } = require('./utilities');
const decodeQname = require('./decode-qname');
const assert = require('assert');

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
    assert.strictEqual(length, 4, 'expect 4 bytes for an A record');
    data.domain = record.name;
    data.address = bytes.readUInt32BE(offset);
  } else if (type === 'CNAME') {
    let [qname, byteLength] = decodeQname(bytes, offset);
    // TODO -- the byteLength *can* be wrong, see `decodeQname` for more details.
    // But we don't care here because we already have the `rdlength`
    data.domain = qname;
  } else if (type === 'NS') {
    let [nsdname, _] = decodeQname(bytes, offset);
    data.domain = record.name;
    data.host = nsdname;
  } else if (type === 'AAAA') {
    let raw1 = bytes.readUInt32BE(offset);
    let raw2 = bytes.readUInt32BE(offset + 4);
    let raw3 = bytes.readUInt32BE(offset + 8);
    let raw4 = bytes.readUInt32BE(offset + 12);
    data.address = [raw1, raw2, raw3, raw4]
      .flatMap((num) => {
        return [
          ((num >> 16) & 0xffff).toString(16),
          ((num >> 0) & 0xffff).toString(16),
        ];
      })
      .join(':');
  } else {
    assert.ok(false, `Not implemented: decode rdata of type ${type}`);
  }

  return data;
};
