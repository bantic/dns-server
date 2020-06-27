const assert = require('assert');
const decodeQname = require('./decode-qname');

const QTYPES = require('./data').QTYPES;
const QCLASSES = require('./data').QCLASSES;

module.exports = class DnsQuery {
  constructor(bytes, offset) {
    this.bytes = bytes;
    this.offset = offset;
    this.qname = this.decodeQname();
    this.qtype = this.getQtype();
    this.qclass = this.getQclass();
  }

  toString() {
    return `QNAME ${this.qname}, qtype ${this.qtype}, qclass ${this.qclass}`;
  }

  /*
   * Advances this.offset by the length of this qname field
   * Sets this.byteLength
   * @returns {string}
   */
  decodeQname() {
    let [qname, byteLength] = decodeQname(this.bytes, this.offset);
    this.byteLength = byteLength + 4; // 2 bytes each for qtype and qclass
    this.offset += byteLength;
    return qname;
  }

  getQtype() {
    let code = (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1];
    assert.ok(code in QTYPES);
    return QTYPES[code];
  }

  getQclass() {
    let code = (this.bytes[this.offset + 2] << 8) | this.bytes[this.offset + 3];
    assert.ok(code in QCLASSES);
    return QCLASSES[code];
  }
};
