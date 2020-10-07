
module.exports.Resource = function (a, b, body) {

  this.at = function(name) {
    if (name) {
      return `${a}.${b}.${name}`;
    }
    return `${a}.${b}`;
  };

  this.ata = function(name) {
    return `${a}.${b}[${name}]`;
  };

  this.id = this.at('id');
}
