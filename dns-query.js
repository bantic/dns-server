const assert = require('assert');
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

// The maximum label length is 63.
// Pointers and Label-Lengths are both stored in 1 bytes, but
// a pointer will start with two 1s so it would
// be interpreted as longer than this length. That's how to
// distinguish a label from a pointer when decoding the qname
const MAX_LABEL_LEN = 63;

const bytesToAscii = (bytes) => {
  let str = '';
  for (let byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return str;
};

module.exports = class DnsQuery {
  constructor(bytes, offset) {
    this.bytes = bytes;
    this.offset = offset;
    this.qname = this.decodeQname();
    this.qtype = this.getQtype();
    this.qclass = this.getQclass();
    this.byteLength = this.offset + 4 - offset;
  }

  toString() {
    return `QNAME ${this.qname}, qtype ${this.qtype}, qclass ${this.qclass}`;
  }

  decodeQname() {
    let labels = [];
    let len;
    while ((len = this.bytes[this.offset]) !== 0) {
      if (len > MAX_LABEL_LEN) {
        throw new Error(`Unimplemented: encountered pointer`);
      }
      labels.push(
        bytesToAscii(this.bytes.slice(this.offset + 1, this.offset + 1 + len))
      );
      this.offset += len + 1;
    }
    this.offset += 1;
    return labels.join('.');
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
