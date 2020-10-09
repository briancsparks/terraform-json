
const path                    = require('path');
const libCEConfig             = require('ceconfig');
const utils                   = require('./utils');

const { basename }                = path;
const { cleanKey, keyMirror }     = libCEConfig.all();
const { splitify }                = libCEConfig.all();

// ------------------------------------------------------------------------------------------------
module.exports.connection = function() {

  return {
    type: 'ssh',
    user: 'ubuntu',
    host: '${self.private_ip}',
    timeout: '120s'
  };
};

// ------------------------------------------------------------------------------------------------
module.exports.publicConnection = function() {

  return {
    type: 'ssh',
    user: 'ubuntu',
    host: '${self.public_ip}',
    timeout: '120s'
  };
};

// ------------------------------------------------------------------------------------------------
const remoteExec =
module.exports.remoteExec = function(lines) {

  return {
    "remote-exec": {
      inline: splitify(lines)
    }
  };
};

// ------------------------------------------------------------------------------------------------
module.exports.localExec = function(command) {

  return {
    "local-exec": {
      command
    }
  };
};

// ------------------------------------------------------------------------------------------------
const copyFile =
module.exports.copyFile = function(source, destination) {

  return {
    file: {
      source,
      destination
    }
  };
}

// ------------------------------------------------------------------------------------------------
module.exports.systemUser = function(name, homedir, otherdir) {
  // sudo mkdir -p /etc/consul.d
  // sudo useradd --system --home /etc/consul.d --shell /bin/false consul
  // sudo usermod -aG consul ubuntu
  // sudo chown --recursive consul:consul /opt/consul

  let lines = [];

  if (homedir) {
    lines.push(`sudo mkdir -p ${homedir}`);
    lines.push(`sudo useradd --system --home ${homedir} --shell /bin/false ${name}`);
    lines.push(`sudo chown --recursive ${name}:${name} ${homedir}`);
  } else {
    lines.push(`sudo useradd --system --shell /bin/false ${name}`);
  }

  lines.push(`sudo usermod -aG ${name} ubuntu`);

  if (otherdir) {
    lines.push(`sudo mkdir -p ${otherdir}`);
    lines.push(`sudo chown --recursive ${name}:${name} ${otherdir}`);
  }

  return remoteExec(lines);
};

// ------------------------------------------------------------------------------------------------
const copyFilesTo =
module.exports.copyFilesTo = function(files, destination) {
  if (!files || !destination || files.length === 0) {
    return [];
  }

  const copies = files.map(file => copyFile(file, `${destination}/${basename(file)}`));

  const result = [
    remoteExec(`mkdir -p ${destination}`),
    ...copies,
    remoteExec(`chmod +x ${destination}/*`),
  ];

  return result;
};

// ------------------------------------------------------------------------------------------------
module.exports.copyFilesToBin = function(files) {
  return copyFilesTo(files, '/home/ubuntu/bin');
};
