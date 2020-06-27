const assert = require('assert');

const toHex = (num) => num.toString(16);

// 0,1,2 or 3-15 (reserved)
const OPCODES = {
  0: 'QUERY',
  1: 'IQUERY',
  2: 'STATUS',
  // 3-15 are "RESERVED"
};

const RCODES = {
  0: 'No error',
  1: 'Format error',
  2: 'Server failure',
  3: 'Name error',
  4: 'Not implemented',
  5: 'Refused',
  // 6-15: Reserved for future use
};

const QRS = {
  0: 'QUERY',
  1: 'RESPONSE',
};

class DnsHeader {
  static DNS_HEADER_BYTE_LEN = 12;

  // array of bytes
  constructor(bytes) {
    this.bytes = bytes;
    assert.strictEqual(this.bytes.length, DnsHeader.DNS_HEADER_BYTE_LEN);
  }

  toString() {
    return (
      `id ${this.id} (${toHex(this.id)}), qr ${this.qr}, opcode "${
        this.opcode
      }"\n` +
      `aa ${this.aa}, tc ${this.tc}, rd ${this.rd}, ra ${this.ra}, z ${this.z}, AD ${this.ad}, CD ${this.cd}, rcode "${this.rcode}"\n` +
      `qdcount ${this.qdcount}, ancount ${this.ancount}, nscount ${this.nscount}, arcount ${this.arcount}`
    );
  }

  get id() {
    // the first two bytes of the header
    return (this.bytes[0] << 8) | this.bytes[1];
  }

  get qr() {
    return QRS[(this.bytes[2] & 0b100000000) >> 8];
  }

  get opcode() {
    let code = (this.bytes[2] & 0b011110000) >> 4;
    assert.ok(code in OPCODES);
    return OPCODES[code];
  }

  get aa() {
    return (this.bytes[2] & 0b00000100) >> 2;
  }

  get tc() {
    return (this.bytes[2] & 0b00000010) >> 1;
  }

  get rd() {
    return this.bytes[2] & 0b000000001;
  }

  get ra() {
    return (this.bytes[3] & 0b10000000) >> 7;
  }

  // 3 bits in RFC 1035, changed to 1 bits in RFC
  // https://tools.ietf.org/html/rfc2535#section-6
  // to make space for AD and CD bits (DNSSEC)
  get z() {
    return (this.bytes[3] & 0b01000000) >> 6;
  }

  get ad() {
    return (this.bytes[3] & 0b00100000) >> 5;
  }

  get cd() {
    return (this.bytes[3] & 0b00010000) >> 4;
  }

  get rcode() {
    let code = this.bytes[3] & 0b00001111;
    assert.ok(code in RCODES);
    return RCODES[code];
  }

  get qdcount() {
    return (this.bytes[4] << 8) | this.bytes[5];
  }

  get ancount() {
    return (this.bytes[6] << 8) | this.bytes[7];
  }

  get nscount() {
    return (this.bytes[8] << 8) | this.bytes[9];
  }

  get arcount() {
    return (this.bytes[10] << 8) | this.bytes[11];
  }
}

module.exports = DnsHeader;
