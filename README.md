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

## More Info

some useful links:

- https://github.com/EmilHernvall/dnsguide/blob/master/chapter1.md — a step-by-step guide to writing a server in rust
- details on DNS: https://book.systemsapproach.org/applications/infrastructure.html
- the first DNS RFC, section 4.1 describes the bytes https://tools.ietf.org/html/rfc1035
- wireshark: https://jvns.ca/blog/2018/06/19/what-i-use-wireshark-for/
- how updating DNS works: https://jvns.ca/blog/how-updating-dns-works/
