
const nameFilter = {
  trusty: "ubuntu/images/hvm-ssd/ubuntu-trusty-14.04-amd64-server-*",
  xenial: "ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-*"
};

const distroFilter = {
  trusty: "ubuntu",
  xenial: "ubuntu"
};

const owner = {
  trusty: "099720109477",
  xenial: "099720109477"
};

module.exports.latestAmi = function(codename) {
  return {
    most_recent: true,

    filter: [{
      name: "name", values: [nameFilter[codename]]
    }, {
      name: "virtualization-type", values: ["hvm"]
    }],

    owners: [owner[codename]]
  };
};



