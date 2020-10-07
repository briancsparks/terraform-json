
module.exports.Locals = function (body) {

  this.at = function(name) {
    return `local.${name}`;
  };

  this.ata = function(name, index) {
    return `local.${name}[${index}]`;
  };

  this.id = this.at('id');
}
