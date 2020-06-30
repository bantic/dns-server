const DnsPacket = require('./dns-packet');
const DnsHeader = require('./dns-header');
const DnsQuery = require('./dns-query');
const udp = require('dgram');

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

let server = '1.1.1.1';
let port = 53;

const client = udp.createSocket('udp4');
client.bind(2222);

client.on('message', (msg, info) => {
  console.log('Received data from client: ' + msg.toString());
  console.log('Message:', msg);
  console.log('From: ', info.address, info.port);
});

client.on('error', (err) => {
  console.log(`client error:\n${err.stack}`);
  client.close();
});

client.on('listening', () => {
  const address = client.address();
  console.log(`client listening ${address.address}:${address.port}`);
});

// These are the bytes from "query_packet.txt"
// When they are sent, we get a response,
// but we don't get a response back when we send "packet.bytes"
// It looks like the packet.bytes are wrong at the 3rd byte...it should be "0x20" but it
// is "0x80" for some reason. Need to figure out why
// TODO figure out what is wrong with our encoding of the header
let bytes = Buffer.from([
  0xdd,
  0xe2,
  0x01,
  0x20,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x06,
  0x67,
  0x6f,
  0x6f,
  0x67,
  0x6c,
  0x65,
  0x03,
  0x63,
  0x6f,
  0x6d,
  0x00,
  0x00,
  0x01,
  0x00,
  0x01,
]);
client.send(bytes, port, server, (err) => {
  if (err) {
    console.log('Got error', err);
  } else {
    console.log('Sent data!', bytes);
  }
});
