// As described by https://tools.ietf.org/html/rfc1035 section 4.1.3
const assert = require('assert');
const decodeQname = require('./decode-qname');
const TYPES = require('./data').TYPES;
const CLASSES = require('./data').CLASSES;

module.exports = class DnsRecord {
  constructor(bytes, offset) {
    this.bytes = bytes;
    this.offset = offset;

    let [qname, byteLength] = decodeQname(this.bytes, this.offset);
    this.name = name;
    this.offset += byteLength;
  }

  get type() {
    let code = (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1];
    assert.ok(code in TYPES);
    return TYPES[code];
  }

  get className() {
    let code = (this.bytes[this.offset + 2] << 8) | this.bytes[this.offset + 3];
    assert.ok(code in CLASSES);
    return CLASSES[code];
  }
};
