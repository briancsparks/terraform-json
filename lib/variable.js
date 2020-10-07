
module.exports.Variable = function (a, body) {

  this.at = function(name) {
    return `var.${a}.${name}`;
  };

  this.ata = function(name) {
    return `var.${a}[${name}]`;
  };

}
