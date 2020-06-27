const assert = require('assert');
const decodeQname = require('./decode-qname');

const QTYPES = {
  // TYPES
  1: 'A',
  2: 'NS',
  3: 'MD',
  4: 'MF',
  5: 'CNAME',
  6: 'SOA',
  7: 'MB',
  8: 'MG',
  9: 'MR',
  10: 'NULL',
  11: 'WKS',
  12: 'PTR',
  13: 'HINFO',
  14: 'MINFO',
  15: 'MX',
  16: 'TXT',

  // NOT TYPES, only QTYPES
  252: 'AXFR',
  253: 'MAILB',
  254: 'MAILA',
  255: '*',
};

const QCLASSES = {
  // CLASSES
  1: 'IN', // The Internet
  2: 'CS', // CSNET (obsolete)
  3: 'CH', // CHAOS
  4: 'HS', // Hesiod

  // QCLASSES only
  255: '*', // Any
};

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
    debugger;
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
