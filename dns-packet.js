const assert = require('assert');
const DnsHeader = require('./dns-header');
const DnsQuery = require('./dns-query');
const DnsRecord = require('./dns-record');
const { formatIPv4 } = require('./utilities');

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

  static createWithQname(qname, qtype, id = 1) {
    return DnsPacket.create({
      header: DnsHeader.create({
        id,
        qr: 'QUERY',
        opcode: 'QUERY',
        aa: false,
        tc: false,
        rd: true,
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
          qname,
          qtype,
          qclass: 'IN',
        }),
      ],
      records: [],
    });
  }

  constructor(bytes) {
    this.bytes = bytes;
  }

  toString() {
    let tab = '    ';
    let logRecords = (type) => {
      let len = this[type].length;
      return [
        `=== ${len} ${type} ===`,
        this[type]
          .map((record, i) => {
            return [
              `${tab}=== ${i + 1} of ${len} (${type}) ===`,
              record.toString(),
            ].join('\n');
          })
          .join('\n'),
      ].join('\n');
    };

    return [
      '====== Header =====',
      this.header.toString(),
      '====== /Header ======',
      '',
      `====== ${this.queries.length} Queries ======`,
      this.queries.map((query, i) => {
        return [
          '',
          `${tab}====== Query ${i + 1} of ${this.queries.length} =====`,
          `${tab}${this.queries[i].toString()}`,
          `${tab}====== /Query ${i + 1} of ${this.queries.length} =====`,
        ].join('\n');
      }),
      '',
      logRecords('answers'),
      '',
      logRecords('authorities'),
      '',
      logRecords('resources'),
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
  get answers() {
    if (!this._answers) {
      let answers = [];
      let offset =
        DnsHeader.DNS_HEADER_BYTE_LEN +
        sum(this.queries.map((query) => query.byteLength));

      for (let i = 0; i < this.header.ancount; i++) {
        let record = new DnsRecord(this.bytes, offset);
        answers.push(record);
        offset += record.byteLength;
      }
      this._answers = answers;
    }
    return this._answers;
  }

  /**
   * @returns {DnsRecord[]}
   */
  get authorities() {
    if (!this._authorities) {
      let authorities = [];
      let offset =
        DnsHeader.DNS_HEADER_BYTE_LEN +
        sum(this.queries.map((q) => q.byteLength)) +
        sum(this.answers.map((a) => a.byteLength));

      for (let i = 0; i < this.header.nscount; i++) {
        let record = new DnsRecord(this.bytes, offset);
        authorities.push(record);
        offset += record.byteLength;
      }
      this._authorities = authorities;
    }
    return this._authorities;
  }

  /**
   * @returns {DnsRecord[]}
   */
  get resources() {
    if (!this._resources) {
      let resources = [];
      let offset =
        DnsHeader.DNS_HEADER_BYTE_LEN +
        sum(this.queries.map((q) => q.byteLength)) +
        sum(this.answers.map((a) => a.byteLength)) +
        sum(this.authorities.map((a) => a.byteLength));

      for (let i = 0; i < this.header.arcount; i++) {
        let record = new DnsRecord(this.bytes, offset);
        resources.push(record);
        offset += record.byteLength;
      }
      this._resources = resources;
    }
    return this._resources;
  }

  getRandomARecord() {
    let aRecords = this.answers.filter((record) => record.type === 'A');
    return aRecords[Math.floor(Math.random() * aRecords.length)];
  }

  /**
   * @param {String} qname
   * @returns array of objects with `domain`, `host` keys
   */
  getNameservers(qname) {
    let nameservers = this.authorities.filter((record) => record.type === 'NS');
    return nameservers
      .map((ns) => {
        return {
          domain: ns.rdata.domain,
          host: ns.rdata.host,
        };
      })
      .filter(({ domain, host }) => {
        return qname.endsWith(domain);
      });
  }

  /**
   * Finds the ip address for the nameserver that corresponds to the qname.
   * Not guaranteed to find one.
   * @returns {String|null}
   */
  getResolvedNameserver(qname) {
    let nameservers = this.getNameservers(qname);
    let aRecords = this.resources.filter((record) => record.type === 'A');
    for (let ns of nameservers) {
      let aRecord = aRecords.find((r) => r.rdata.domain === ns.host);
      if (aRecord) {
        return formatIPv4(aRecord.rdata.address);
      }
    }
  }

  getUnresolvedNameserver(qname) {
    let nameservers = this.getNameservers(qname);
    if (nameservers.length) {
      return nameservers[0].host;
    }

    throw new Error(`Expected to find an unresolved ns for ${qname}`);
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
