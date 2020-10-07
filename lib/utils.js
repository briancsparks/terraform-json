
module.exports.just = function(str) {
  return '${' + str + '}';
};
module.exports.just_it = module.exports.just;

module.exports.just_bare = function(str) {
  return str;
};



