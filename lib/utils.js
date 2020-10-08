
const path    = require('path');

const binDir  = '/home/ubuntu/bin';

module.exports.scriptFile = function (name) {
  return path.join(__dirname, 'files', name);
};

module.exports.scriptFile2 = function (name, pathPart) {
  return path.join(__dirname, 'files', pathPart, name);
};


module.exports.just = function(str) {
  return '${' + str + '}';
};
module.exports.just_it = module.exports.just;

module.exports.just_bare = function(str) {
  return str;
};



