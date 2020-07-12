const SERVER = '8.8.8.8';
const PORT = 53;
const udp = require('dgram');
const DnsPacket = require('./dns-packet');

/**
 Looks up the given qname and qtype (e.g. 'www.recurse.com', 'A')
 using Google's public DNS server unless another is specified.

 Decodes the public DNS server response packet and calls the callback w/ it

 Usage:
 lookup('www.recurse.com', 'A', {id: 'SOME_ID'}, responsePacket => {
   console.log('Got a response:',responsePacket.toString());
 });
 */
module.exports = function lookup(
  qname,
  qtype,
  serverOptions = {},
  callback = () => {}
) {
  let server = serverOptions.server || SERVER;
  let port = serverOptions.port || PORT;
  let id = serverOptions.id || 1;

  let packet = DnsPacket.createWithQname(qname, qtype, id);
  let client = udp.createSocket('udp4');

  // Handle the response from the public DNS server
  client.on('message', (msg, info) => {
    console.log(
      'Lookup Received %d bytes from %s:%d\n',
      msg.length,
      info.address,
      info.port
    );

    let packet = new DnsPacket(msg);
    console.log('Packet', packet.toString());
    callback(packet);
  });

  // Send the request to the public DNS server
  client.send(packet.bytes, port, server, (err) => {
    console.log('Send data, err:', err);
  });
};
