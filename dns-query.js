const assert = require('assert');
const decodeQname = require('./decode-qname');
const encodeQname = require('./encode-qname');

const QTYPES = require('./data').QTYPES;
const QCLASSES = require('./data').QCLASSES;
const { uint16ToBytesBE } = require('./utilities');

// 2-byte unsigned int...return 2 bytes
// TODO: create intTo2Bytes function
function encodeQtype(qtype) {
  assert.ok(Object.values(QTYPES).includes(qtype));
  let code = Object.entries(QTYPES).find(([k, v]) => v === qtype)[0];
  return uint16ToBytesBE(code);
}

function encodeQclass(qclass) {
  assert.ok(Object.values(QCLASSES).includes(qclass));
  let code = Object.entries(QCLASSES).find(([k, v]) => v === qclass)[0];
  return uint16ToBytesBE(code);
}

class DnsQuery {
  static create({ qname, qtype, qclass }) {
    let bytes = Buffer.from([
      ...encodeQname(qname),
      ...encodeQtype(qtype),
      ...encodeQclass(qclass),
    ]);
    return new DnsQuery(bytes, 0);
  }

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
    assert.ok(code in QTYPES, `${code} in QTYPES`);
    return QTYPES[code];
  }

  getQclass() {
    let code = (this.bytes[this.offset + 2] << 8) | this.bytes[this.offset + 3];
    assert.ok(code in QCLASSES);
    return QCLASSES[code];
  }
}

// Test
let query = DnsQuery.create({
  qname: 'www.recurse.com',
  qtype: 'A',
  qclass: 'IN',
});

assert.strictEqual(query.qname, 'www.recurse.com');
assert.strictEqual(query.qtype, 'A');
assert.strictEqual(query.qclass, 'IN');

module.exports = DnsQuery;
