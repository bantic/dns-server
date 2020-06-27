const DnsHeader = require('./dns-header');
const DnsQuery = require('./dns-query');

module.exports = class DnsRequest {
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
};
