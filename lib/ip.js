

// ------------------------------------------------------------------------------------------------
const ipToNumber =
module.exports.ipToNumber = function(strIp) {
  if (!/\d+[.]\d+[.]\d+[.]\d+/.exec(strIp)) { return -1; }

  const parts = strIp.split(/[^0-9]+/);

  let n = 0;

  n += +(parts[0] || 0) << 24;
  n += +(parts[1] || 0) << 16;
  n += +(parts[2] || 0) << 8;
  n += +(parts[3] || 0);

  if (n & 0x80000000) {
    n = 0x80000000 + (n & 0x7fffffff);
  }

  return n;
};

// ------------------------------------------------------------------------------------------------
const numberToIp =
module.exports.numberToIp = function (n) {
  const highBit = (n & 0x80000000) ? 0x80 : 0;
  return [((n & 0x7f000000) >> 24) + highBit, (n & 0x00ff0000) >> 16, (n & 0x0000ff00) >> 8, (n & 0x000000ff)].join('.');
};

// ------------------------------------------------------------------------------------------------
module.exports.ipWithinCidr = function (cidr, n) {
  const base    = ipToNumber(cidr);
  const ipNum   = base + n;

  return numberToIp(ipNum);
};

// ------------------------------------------------------------------------------------------------
module.exports.nextIp = function(ip) {
  return numberToIp(ipToNumber(ip) + 1);
};

// ------------------------------------------------------------------------------------------------
module.exports.nToCidr = function(nIp, nBits) {
  return numberToIp(nIp) + '/' + nBits;
};

// ------------------------------------------------------------------------------------------------
module.exports.nextCidr = function (ip, numBits1, numBits2) {
  const isString = (typeof ip === 'string');

  const numBits = Math.min(numBits1, numBits2);
  const m  = mask[numBits];
  const m0 = ~m;
  const n  = numberify(ip);

  const last  = n | m0;
  const first = last + 1;

  if (isString) {
    return numberToIp(first);
  }

  return first;
};

// ------------------------------------------------------------------------------------------------
const mask = [

  0x00000000,         // /00
  0x80000000,         // /01
  0xc0000000,         // /02
  0xe0000000,         // /03
  0xf0000000,         // /04
  0xf8000000,         // /05
  0xfc000000,         // /06
  0xfe000000,         // /07
  0xff000000,         // /08
  0xff800000,         // /09
  0xffc00000,         // /10
  0xffe00000,         // /11
  0xfff00000,         // /12
  0xfff80000,         // /13
  0xfffc0000,         // /14
  0xfffe0000,         // /15
  0xffff0000,         // /16
  0xffff8000,         // /17
  0xffffc000,         // /18
  0xffffe000,         // /19
  0xfffff000,         // /20
  0xfffff800,         // /21
  0xfffffc00,         // /22
  0xfffffe00,         // /23
  0xffffff00,         // /24
  0xffffff80,         // /25
  0xffffffc0,         // /26
  0xffffffe0,         // /27
  0xfffffff0,         // /28
  0xfffffff8,         // /29
  0xfffffffc,         // /30
  0xfffffffe,         // /31
  0xffffffff          // /32
];

// ------------------------------------------------------------------------------------------------
function numberify(ip) {
  if (typeof ip === 'string') {
    return ipToNumber(ip);
  }

  return ip;
}
