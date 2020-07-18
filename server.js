const PORT = 2222;
const udp = require('dgram');
const DnsPacket = require('./dns-packet');
const { lookup, recursiveLookup } = require('./lookup');

// creating a udp server
var server = udp.createSocket('udp4');

// emits when any error occurs
server.on('error', function (error) {
  console.log('Error: ' + error);
  server.close();
});

// emits on new datagram msg
server.on('message', async function (msg, info) {
  console.log('Data received from client : ' + msg.toString());
  console.log(msg);
  console.log(
    'Received %d bytes from %s:%d\n',
    msg.length,
    info.address,
    info.port
  );

  let request = new DnsPacket(msg);
  console.log('DNS Info:', request.header.toString());
  for (let i = 0; i < request.queries.length; i++) {
    console.log(`Query #${i + 1}: `, request.queries[i].toString());
  }

  if (request.queries.length > 0) {
    let query = request.queries[0];
    let qname = query.qname;
    let qtype = query.qtype;

    console.log(`Looking up ${qname} ${qtype} ID: ${request.header.id}`);
    let result = await recursiveLookup(qname, qtype, request.header.id);
    console.log('Server Got result from lookup');
    //sending msg
    server.send(result.bytes, info.port, info.address, function (error) {
      if (error) {
        console.log('ERROR in response:', error);
        client.close();
      } else {
        console.log('Data sent BACK !!!');
      }
    });
  }
});

//emits when socket is ready and listening for datagram msgs
server.on('listening', function () {
  var address = server.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log('Server is listening at port' + port);
  console.log('Server ip :' + ipaddr);
  console.log('Server is IP4/IP6 : ' + family);
});

//emits after the socket is closed using socket.close();
server.on('close', function () {
  console.log('Socket is closed !');
});

server.bind(PORT);
