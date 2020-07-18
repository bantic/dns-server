# DNS Server

Attempting to create a DNS server as part of a Recurse Center workshop.

## Sample Data

`query_packet.txt` is a DNS Query packet for an A record for google.com
`response_packet.txt` is the DNS Response packet for the response to the query, from 8.8.8.8

Both generated as described by https://github.com/EmilHernvall/dnsguide/blob/master/chapter1.md:

query packet:

- `nc -u -l 1053 > query_packet.txt` in one window, then
- `dig +retry=0 -p 1053 @127.0.0.1 +noedns google.com` in another. It will time out but will put the data into `query_packet.txt`

response packet:

- `nc -u 8.8.8.8 53 < query_packet.txt > response_packet.txt`. Give it a moment, then cancel the process. The response will be in `response_packet.txt`

## Running/Testing Locally

Confirm that the sample packets can be decoded:

```
$ node debug-packet query_packet.txt
====== Header =====
id 56802 (0xdde2), qr QUERY, opcode "QUERY"
aa 0, tc 0, rd 1, ra 0, z 0, AD 1, CD 0, rcode "No error"
qdcount 1, ancount 0, nscount 0, arcount 0
====== /Header ======

====== 1 Queries ======

        ====== Query 1 of 1 =====
        QNAME google.com, qtype A, qclass IN
        ====== /Query 1 of 1 =====

===== 0 Records =======

$ node debug-packet response_packet.txt
====== Header =====
id 56802 (0xdde2), qr QUERY, opcode "QUERY"
aa 0, tc 0, rd 1, ra 1, z 0, AD 0, CD 0, rcode "No error"
qdcount 1, ancount 1, nscount 0, arcount 0
====== /Header ======

====== 1 Queries ======

        ====== Query 1 of 1 =====
        QNAME google.com, qtype A, qclass IN
        ====== /Query 1 of 1 =====

===== 1 Records =======
        ====== Record 1 of 1 =====
        NAME "google.com" A IN 299
RDATA: {"domain":"google.com","host":"172.217.10.142"}
        ====== /Record 1 of 1 =====
```

Or try running the server and sending it a request via dig:

```
$ node server.js

// Separate terminal
$ dig @localhost -p 2222 +noedns recurse.com

// The server will print out the decoded query packet as well as the
// response, and it will send the response back, which will...

// In the dig terminal, you should see a valid response to your query
```

## More Info

some useful links:

- https://github.com/EmilHernvall/dnsguide/blob/master/chapter1.md — a step-by-step guide to writing a server in rust
- details on DNS: https://book.systemsapproach.org/applications/infrastructure.html
- the first DNS RFC, section 4.1 describes the bytes https://tools.ietf.org/html/rfc1035
- wireshark: https://jvns.ca/blog/2018/06/19/what-i-use-wireshark-for/
- how updating DNS works: https://jvns.ca/blog/how-updating-dns-works/

### Files

- samples/\* -- sample binary packets to use for debugging.
  Pass these as command-line arguments to debug-packet.js
  - `samples/sample-packet-198-41-0-4` -- a response from one of the root nameservers for a query (lots of authorities and resources in the response)

### TODOs

- Add decoding for more data types (only "A", "CNAME" types currently decoded)
- Remove the client.js -- it's not used (right?)

### In progress TODOS

### Done TODOS

- 7/18/20 Implement a recursive lookup that starts from the root servers
  - The recursive lookup doesn't seem to work properly. To pick this back up, start the server in one terminal and try dig-ing at it from another. Need to look
    more carefully at the get-resolved-ns and get-unresolved-ns -- it seems to not be able to follow the referral to the 'com' nameservers... Maybe the issue is the way we are using the 'endswith' to compare the qname...add a breakpoint here to check
  - Yes ^ this turned out to be the issue. There were a few issues where the rdata wasn't referenced properly, or I forgot that the nameservers were distilled to `{domain, host}` objects, etc. Recursive lookup should be working now!
- 7/18/20 Add support for 'AAAA' record type
- 7/18/20 Add `answers`,`authorities`,`resources`
  - I misunderstood the format originally and thought there was just a set of "records" after the queries.
    Turns out there are `ancount` "answer" records, `nscount` "authority" (nameserver) records, and `arcount` "resources" records
- Created a server that can handle requests via dig, use Google Public DNS, and return the response
- Added decoding for CNAME rdata type
- Ensure that sending a hardcoded Dns query packet to a known resolver (e.g., 8.8.8.8) is understood and returns a valid response
  ^ Working on this. Not getting any response. It seems like the packet is wrong.
  I tried sending the "query*packet.txt" packet (by hardcoding its bytes into the debug-send-query.js script) and it \_does*
  get a response. See TODO notes in debug-send-query about what to fix.
  The solution was to fix an error in the `toByte` function.
