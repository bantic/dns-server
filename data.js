const TYPES = {
  1: 'A',
  2: 'NS',
  3: 'MD',
  4: 'MF',
  5: 'CNAME',
  6: 'SOA',
  7: 'MB',
  8: 'MG',
  9: 'MR',
  10: 'NULL',
  11: 'WKS',
  12: 'PTR',
  13: 'HINFO',
  14: 'MINFO',
  15: 'MX',
  16: 'TXT',
};
const QTYPES = {
  ...TYPES,
  252: 'AXFR',
  253: 'MAILB',
  254: 'MAILA',
  255: '*',
};

const CLASSES = {
  // CLASSES
  1: 'IN', // The Internet
  2: 'CS', // CSNET (obsolete)
  3: 'CH', // CHAOS
  4: 'HS', // Hesiod
};

const QCLASSES = {
  ...CLASSES,

  // QCLASSES only
  255: '*', // Any
};

module.exports = {
  TYPES,
  QTYPES,
  CLASSES,
  QCLASSES,
};
