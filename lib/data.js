
module.exports.Data = function (a, b, body) {

  this.at = function(name) {
    if (name) {
      return `data.${a}.${b}.${name}`;
    }
    return `data.${a}.${b}`;
  };

  this.ata = function(name) {
    return `data.${a}.${b}[${name}]`;
  };

  this.id = this.at('id');
}
