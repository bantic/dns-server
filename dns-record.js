// As described by https://tools.ietf.org/html/rfc1035 section 4.1.3

module.exports = class DnsRecord {
  constructor(bytes, offset) {
    this.bytes = bytes;
    this.offset = offset;
  }
};
