const assert = require('assert');
const { uint16ToBytesBE } = require('./utilities');

const toHex = (num) => `0x${num.toString(16)}`;

const keyFor = (value, obj) => {
  let found = Object.entries(obj).find(([k, v]) => v === value);
  if (!found) {
    throw new Error(`No value ${value} in obj ${obj}`);
  }
  return found[0];
};

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

const to4Bits = (u4) => {
  return {
    0: [0, 0, 0, 0],
    1: [0, 0, 0, 1],
    2: [0, 0, 1, 0],
    3: [0, 0, 1, 1],
    4: [0, 1, 0, 0],
    5: [0, 1, 0, 1],
    6: [0, 1, 1, 0],
    7: [0, 1, 1, 1],
    8: [1, 0, 0, 0],
    9: [1, 0, 0, 1],
    10: [1, 0, 1, 0],
    11: [1, 0, 1, 1],
    12: [1, 1, 0, 0],
    13: [1, 1, 0, 1],
    14: [1, 1, 1, 0],
    15: [1, 1, 1, 1],
  }[u4];
};

const toByte = (bits) => {
  assert.strictEqual(bits.length, 8);
  return bits.reduce((acc, bit, idx) => {
    acc += bit ? 2 ** (8 - idx - 1) : 0;
    return acc;
  }, 0);
};

assert.strictEqual(toByte([0, 0, 0, 0, 0, 0, 0, 1]), 1);
assert.strictEqual(toByte([0, 0, 0, 0, 0, 0, 1, 0]), 2);
assert.strictEqual(toByte([1, 0, 0, 0, 0, 0, 1, 0]), 130);
assert.strictEqual(toByte([1, 0, 0, 1, 0, 0, 1, 0]), 146);
assert.strictEqual(toByte([1, 0, 0, 1, 0, 0, 1, 1]), 147);

class DnsHeader {
  static DNS_HEADER_BYTE_LEN = 12;

  static create({
    id,
    qr,
    opcode,
    aa,
    tc,
    rd,
    ra,
    z,
    ad,
    cd,
    rcode,
    qdcount,
    ancount,
    nscount,
    arcount,
  }) {
    id = id || 1;
    qr = keyFor(qr, QRS);
    opcode = keyFor(opcode, OPCODES);
    rcode = keyFor(rcode, RCODES);

    let bytes = Buffer.from([
      ...uint16ToBytesBE(id),
      toByte([qr, ...to4Bits(opcode, 4), aa, tc, rd]),
      toByte([ra, z, ad, cd, ...to4Bits(rcode)]),
      ...uint16ToBytesBE(qdcount),
      ...uint16ToBytesBE(ancount),
      ...uint16ToBytesBE(nscount),
      ...uint16ToBytesBE(arcount),
    ]);
    return new DnsHeader(bytes);
  }

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
    let code = (this.bytes[2] & 0b01111000) >> 4;
    assert.ok(code in OPCODES);
    return OPCODES[code];
  }

  /**
    Authoritative Answer - this bit is valid in responses,
    and specifies that the responding name server is an
    authority for the domain name in question section.
   @boolean
  */
  get aa() {
    return (this.bytes[2] & 0b00000100) >> 2;
  }

  /**
  truncated
   @boolean
   */
  get tc() {
    return (this.bytes[2] & 0b00000010) >> 1;
  }

  /**
   recursion desired
   @boolean
  */
  get rd() {
    return this.bytes[2] & 0b000000001;
  }

  /**
   recursion available
   @boolean
   */
  get ra() {
    return (this.bytes[3] & 0b10000000) >> 7;
  }

  // 3 bits in RFC 1035, changed to 1 bits in RFC
  // https://tools.ietf.org/html/rfc2535#section-6
  // to make space for AD and CD bits (DNSSEC)
  // must be 0
  get z() {
    return (this.bytes[3] & 0b01000000) >> 6;
  }

  /**
  authenticate data
  https://tools.ietf.org/html/rfc2535#section-6
   @boolean
   */
  get ad() {
    return (this.bytes[3] & 0b00100000) >> 5;
  }

  /**
  checking disabled
  https://tools.ietf.org/html/rfc2535#section-6
   @boolean
   */
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

// TEST
let header = DnsHeader.create({
  id: 1,
  qr: 'QUERY',
  opcode: 'QUERY',
  aa: false,
  tc: false,
  rd: false,
  ra: false,
  z: 0,
  ad: false,
  cd: false,
  rcode: 'No error',
  qdcount: 1,
  ancount: 0,
  nscount: 0,
  arcount: 0,
});

assert.strictEqual(header.id, 1);
assert.strictEqual(header.qdcount, 1);
assert.strictEqual(header.opcode, 'QUERY');
assert.strictEqual(header.qr, 'QUERY');
assert.strictEqual(header.rcode, 'No error');
assert.strictEqual(header.ad, 0);
console.log(header.bytes);

module.exports = DnsHeader;
