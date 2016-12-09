//
// Shader Tokenizer
//
export default class {
  constructor (src) {
    // Strip out comments
    src = src.replace(/\/\/.*$/mg, ''); // C++ style (//...)
    src = src.replace(/\/\*[^*\/]*\*\//mg, ''); // C style (/*...*/) (Do the shaders even use these?)
    this.tokens = src.match(/[^\s\n\r\"]+/mg);

    this.offset = 0;
  }

  EOF () {
    if(this.tokens === null) {
      return true;
    }

    var token = this.tokens[this.offset];

    while (token === '' && this.offset < this.tokens.length) {
      this.offset++;
      token = this.tokens[this.offset];
    }

    return this.offset >= this.tokens.length;
  }

  next () {
    if(this.tokens === null) {
      return;
    }

    var token = '';

    while (token === '' && this.offset < this.tokens.length) {
      token = this.tokens[this.offset++];
    }

    return token;
  }

  prev () {
    if(this.tokens === null) {
      return;
    }

    var token = '';

    while (token === '' && this.offset >= 0) {
      token = this.tokens[this.offset--];
    }

    return token;
  }
}
