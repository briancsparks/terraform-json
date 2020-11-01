
const nameFilter = {
  trusty: "ubuntu/images/hvm-ssd/ubuntu-trusty-14.04-amd64-server-*",
  xenial: "ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-*",
  bionic: "ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*",
  focal:  "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*",

  arm_xenial: "ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-arm64-server-*",
  arm_bionic: "ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-arm64-server-*",
  arm_focal:  "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-arm64-server-*",
};

const distroFilter = {
  trusty: "ubuntu",
  xenial: "ubuntu",
  bionic: "ubuntu",
  focal:  "ubuntu",

  arm_xenial: "ubuntu",
  arm_bionic: "ubuntu",
  arm_focal:  "ubuntu",
};

const owner = {
  trusty: "099720109477",
  xenial: "099720109477",
  bionic: "099720109477",
  focal:  "099720109477",

  arm_xenial: "099720109477",
  arm_bionic: "099720109477",
  arm_focal:  "099720109477",
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



