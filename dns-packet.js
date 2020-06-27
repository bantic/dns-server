const DnsHeader = require('./dns-header');
const DnsQuery = require('./dns-query');
const DnsRecord = require('./dns-record');

const sum = (arr) => arr.reduce((acc, v) => acc + v, 0);

module.exports = class DnsPacket {
  constructor(bytes) {
    this.bytes = bytes;
  }

  /**
   * @returns {DnsHeader}
   */
  get header() {
    return new DnsHeader(this.bytes.slice(0, DnsHeader.DNS_HEADER_BYTE_LEN));
  }

  /**
   * @returns {DnsQuery[]}
   */
  get queries() {
    let queries = [];
    let offset = DnsHeader.DNS_HEADER_BYTE_LEN;
    for (let i = 0; i < this.header.qdcount; i++) {
      let query = new DnsQuery(this.bytes, offset);
      queries.push(query);
      offset += query.byteLength;
    }
    return queries;
  }

  /**
   * @returns {DnsRecord[]}
   */
  get records() {
    let records = [];
    let offset =
      DnsHeader.DNS_HEADER_BYTE_LEN +
      sum(this.queries.map((query) => query.byteLength));

    for (let i = 0; i < this.header.ancount; i++) {
      let record = new DnsRecord(this.bytes, offset);
      records.push(record);
      offset += record.byteLength;
    }
    return records;
  }
};
