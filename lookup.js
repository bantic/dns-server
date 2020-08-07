const SERVER = "8.8.8.8";
const PORT = 53;
const udp = require("dgram");
const DnsPacket = require("./dns-packet");
const fs = require("fs");

/**
 Looks up the given qname and qtype (e.g. 'www.recurse.com', 'A')
 using Google's public DNS server unless another is specified.

 Decodes the public DNS server response packet and calls the callback w/ it

 Usage:
 lookup('www.recurse.com', 'A', {id: 'SOME_ID'}, responsePacket => {
   console.log('Got a response:',responsePacket.toString());
 });
 */
async function lookup(qname, qtype, serverOptions = {}) {
  let server = serverOptions.server || SERVER;
  let port = serverOptions.port || PORT;
  let id = serverOptions.id || 1;

  let packet = DnsPacket.createWithQname(qname, qtype, id);
  let client = udp.createSocket("udp4");

  return new Promise((resolve, reject) => {
    // Handle the response from the public DNS server
    client.on("message", (msg, info) => {
      console.log(
        "Lookup Received %d bytes from %s:%d\n",
        msg.length,
        info.address,
        info.port
      );

      if (info.address === "198.41.0.4") {
        // TODO: Remove this -- it was a one-off to create a sample file for debugging
        // fs.writeFileSync('sample-packet-198-41-0-4', msg);
      }

      let packet = new DnsPacket(msg);
      console.log("Packet", packet.toString());
      resolve(packet);
    });

    // Send the request to the public DNS server
    client.send(packet.bytes, port, server, (err) => {
      console.log("Send data, err:", err);
    });
  });
}

async function recursiveLookup(qname, qtype, id) {
  let ns = "198.41.0.4"; // a.root-servers.net

  while (true) {
    console.log(
      `[recursiveLookup] attempting lookup of ${qname} ${qtype} ns ${ns}`
    );
    let response = await lookup(qname, qtype, { id, server: ns });
    if (response.answers.length) {
      return response;
    }

    let nextNs = response.getResolvedNameserver(qname);
    if (nextNs) {
      ns = nextNs;
      continue;
    }

    let newNsName = response.getUnresolvedNameserver(qname);
    if (!newNsName) {
      console.log(`No unresolved nameserver for ${qname}`);
      return response;
    }

    // Lookup again
    let recursiveResponse = await recursiveLookup(newNsName, "A");
    let nsARecord = recursiveResponse.getRandomARecord();
    if (nsARecord) {
      ns = formattedIPv4(nsARecord.rdata.address);
    } else {
      console.log(
        `recursive lookup of ${newNsName} didn't go anywhere, returning`
      );
      return response;
    }
  }
}

module.exports = { lookup, recursiveLookup };
