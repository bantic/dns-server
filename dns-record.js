// As described by https://tools.ietf.org/html/rfc1035 section 4.1.3
const assert = require('assert');
const decodeQname = require('./decode-qname');
const decodeRdata = require('./decode-rdata');
const { formatIPv4 } = require('./utilities');
const TYPES = require('./data').TYPES;
const CLASSES = require('./data').CLASSES;

// 10 bytes for all the non-dynamic parts of the record
// (2 for type, 2 for class, 4 for ttl, 2 for rdlength)
const RECORD_FIXED_BYTE_SIZE = 10;

module.exports = class DnsRecord {
  constructor(bytes, offset) {
    this.bytes = bytes;
    this.offset = offset;
    this.byteLength = RECORD_FIXED_BYTE_SIZE;

    let [qname, byteLength] = decodeQname(this.bytes, this.offset);
    this.name = qname;
    this.offset += byteLength;
    this.byteLength = byteLength + RECORD_FIXED_BYTE_SIZE + this.rdlength;
  }

  toString() {
    return [
      `NAME "${this.name}" ${this.type} ${this.className} ${this.ttl}`,
      `RDATA: ${JSON.stringify(this.formattedData)}`,
    ].join('\n');
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

  get ttl() {
    return this.bytes.readUInt32BE(this.offset + 4);
  }

  get rdlength() {
    return this.bytes.readUInt16BE(this.offset + 8);
  }

  get rdata() {
    return decodeRdata({ record: this });
  }

  get formattedData() {
    let data = this.rdata;
    if (this.type === 'A') {
      return {
        domain: this.name,
        host: formatIPv4(data.address),
      };
    } else {
      return data;
    }
  }
};
