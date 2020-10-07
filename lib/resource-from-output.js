
module.exports.ResourceFromOutput = function (a, value ={}) {

  this.at = function(name) {
    const result = value.value || value;
    return result
  };

  this.id = this.at('id');
}

