const DnsPacket = require('./dns-packet');
const fs = require('fs');

async function main() {
  let file = process.argv[2];
  if (!file) {
    throw new Error(`Must pass packet file`);
  }
  let buffer = fs.readFileSync(file);
  let packet = new DnsPacket(buffer);

  console.log(packet.toString());
}

main();
