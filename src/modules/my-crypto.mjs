import base64 from 'base-64';

export function makeSalt() {
  return base64.encode(new Array(5).fill(0).map(_ => Math.random()).join('').replace(/0\./g, ''));
}

export function hash(data, salt) {
  let hash = 100000000;
  data += '' + salt;
  data.split('').forEach(ch => {
    let unicode = ch.charCodeAt(0);
    hash += unicode;
    hash *= -237;
    hash %= 1e15
  });
  return hash;
}
