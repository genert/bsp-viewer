const bf_byteBuff = new ArrayBuffer(4);
const bf_wuba = new Uint8Array(bf_byteBuff);
const bf_wsa = new Int16Array(bf_byteBuff);
const bf_wusa = new Uint16Array(bf_byteBuff);
const bf_wia = new Int32Array(bf_byteBuff);
const bf_wuia = new Uint32Array(bf_byteBuff);
const bf_wfa = new Float32Array(bf_byteBuff);

export default class {
  constructor (data) {
    this.buffer = data;
    this.length = data.length;
    this.offset = 0;
  }

  eof () {
    this.offset >= this.length;
  }

  // Seek to the given byt offset within the stream
  seek (offest) {
    this.offset = offest;
  }

  // Seek to the given byt offset within the stream
  tell () {
    return this.offset;
  }

  // Read a signed byte from the stream
  readByte () {
    var b0 = this.buffer.charCodeAt(this.offset) & 0xff;
    this.offset += 1;
    return b0 - (b0 & 0x80);
  }

  // Read an unsigned byte from the stream
  readUByte () {
    var b0 = this.buffer.charCodeAt(this.offset) & 0xff;
    this.offset += 1;
    return b0;
  }

  // Read a signed short (2 bytes) from the stream
  readShort () {
    var off = this.offset;
    var buf = this.buffer;
    bf_wuba[0] = buf.charCodeAt(off) & 0xff;
    bf_wuba[1] = buf.charCodeAt(off+1) & 0xff;
    this.offset += 2;
    return bf_wsa[0];
  }

  // Read an unsigned short (2 bytes) from the stream
  readUShort () {
    var off = this.offset;
    var buf = this.buffer;
    bf_wuba[0] = buf.charCodeAt(off) & 0xff;
    bf_wuba[1] = buf.charCodeAt(off+1) & 0xff;
    this.offset += 2;
    return bf_wusa[0];
  }

  // Read a signed long (4 bytes) from the stream
  readLong () {
    var off = this.offset;
    var buf = this.buffer;
    bf_wuba[0] = buf.charCodeAt(off) & 0xff;
    bf_wuba[1] = buf.charCodeAt(off+1) & 0xff;
    bf_wuba[2] = buf.charCodeAt(off+2) & 0xff;
    bf_wuba[3] = buf.charCodeAt(off+3) & 0xff;
    this.offset += 4;
    return bf_wia[0];
  }

  // Read an unsigned long (4 bytes) from the stream
  readULong () {
    var off = this.offset;
    var buf = this.buffer;
    bf_wuba[0] = buf.charCodeAt(off) & 0xff;
    bf_wuba[1] = buf.charCodeAt(off+1) & 0xff;
    bf_wuba[2] = buf.charCodeAt(off+2) & 0xff;
    bf_wuba[3] = buf.charCodeAt(off+3) & 0xff;
    this.offset += 4;
    return bf_wuia[0];
  }

  // Read a float (4 bytes) from the stream
  readFloat () {
    var off = this.offset;
    var buf = this.buffer;
    bf_wuba[0] = buf.charCodeAt(off) & 0xff;
    bf_wuba[1] = buf.charCodeAt(off+1) & 0xff;
    bf_wuba[2] = buf.charCodeAt(off+2) & 0xff;
    bf_wuba[3] = buf.charCodeAt(off+3) & 0xff;
    this.offset += 4;
    return bf_wfa[0];
  }

  expandHalf (h) {
    var s = (h & 0x8000) >> 15;
    var e = (h & 0x7C00) >> 10;
    var f = h & 0x03FF;

    if(e == 0) {
      return (s?-1:1) * Math.pow(2,-14) * (f/Math.pow(2, 10));
    } else if (e == 0x1F) {
      return f?NaN:((s?-1:1)*Infinity);
    }

    return (s?-1:1) * Math.pow(2, e-15) * (1+(f/Math.pow(2, 10)));
  }

  readHalf () {
    var h = this.readUShort();
    return this.expandHalf(h);
  }

  // Read an ASCII string of the given length from the stream
  readString (length) {
    var str = this.buffer.substr(this.offset, length).replace(/\0+$/,'');
    this.offset += length;
    return str;
  }
}
