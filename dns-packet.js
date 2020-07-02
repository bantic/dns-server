const assert = require('assert');
const DnsHeader = require('./dns-header');
const DnsQuery = require('./dns-query');
const DnsRecord = require('./dns-record');

const sum = (arr) => arr.reduce((acc, v) => acc + v, 0);

class DnsPacket {
  static create({ header, queries, records }) {
    let bytes = header.bytes;
    for (let query of queries) {
      bytes = [...bytes, ...query.bytes];
    }
    for (let record of records) {
      bytes = [...bytes, ...record.bytes];
    }
    return new DnsPacket(Buffer.from(bytes));
  }

  constructor(bytes) {
    this.bytes = bytes;
  }

  toString() {
    return [
      '====== Header =====',
      this.header.toString(),
      '====== /Header ======',
      '',
      `====== ${this.queries.length} Queries ======`,
      this.queries.map((query, i) => {
        return [
          '',
          `====== Query ${i + 1} of ${this.queries.length} =====`,
          this.queries[i].toString(),
          `====== /Query ${i + 1} of ${this.queries.length} =====`,
        ]
          .map((s) => `\t${s}`)
          .join('\n');
      }),
      '',
      `===== ${this.records.length} Records =======`,
      this.records.map((record, i) => {
        return [
          `====== Record ${i + 1} of ${this.records.length} =====`,
          this.records[i].toString(),
          `====== /Record ${i + 1} of ${this.records.length} =====`,
        ]
          .map((s) => `\t${s}`)
          .join('\n');
      }),
    ].join('\n');
  }

  /**
   * @returns {DnsHeader}
   */
  get header() {
    if (!this._header) {
      this._header = new DnsHeader(
        this.bytes.slice(0, DnsHeader.DNS_HEADER_BYTE_LEN)
      );
    }
    return this._header;
  }

  /**
   * @returns {DnsQuery[]}
   */
  get queries() {
    if (!this._queries) {
      let queries = [];
      let offset = DnsHeader.DNS_HEADER_BYTE_LEN;
      for (let i = 0; i < this.header.qdcount; i++) {
        let query = new DnsQuery(this.bytes, offset);
        queries.push(query);
        offset += query.byteLength;
      }
      this._queries = queries;
    }
    return this._queries;
  }

  /**
   * @returns {DnsRecord[]}
   */
  get records() {
    if (!this._records) {
      let records = [];
      let offset =
        DnsHeader.DNS_HEADER_BYTE_LEN +
        sum(this.queries.map((query) => query.byteLength));

      for (let i = 0; i < this.header.ancount; i++) {
        let record = new DnsRecord(this.bytes, offset);
        records.push(record);
        offset += record.byteLength;
      }
      this._records = records;
    }
    return this._records;
  }
}

// TEST
const TESTING = true;
if (TESTING) {
  let packet = DnsPacket.create({
    header: DnsHeader.create({
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
    }),
    queries: [
      DnsQuery.create({
        qname: 'www.recurse.com',
        qtype: 'A',
        qclass: 'IN',
      }),
    ],
    records: [],
  });

  assert.strictEqual(packet.header.id, 1);
  assert.strictEqual(packet.header.qr, 'QUERY');
  assert.strictEqual(packet.header.opcode, 'QUERY');
  assert.strictEqual(packet.header.rd, 0);
  assert.strictEqual(packet.header.qdcount, 1);
  assert.strictEqual(packet.header.rcode, 'No error');
  assert.strictEqual(packet.queries.length, 1);
  assert.strictEqual(packet.queries[0].qname, 'www.recurse.com');
  assert.strictEqual(packet.queries[0].qtype, 'A');
  assert.strictEqual(packet.queries[0].qclass, 'IN');
}

module.exports = DnsPacket;
