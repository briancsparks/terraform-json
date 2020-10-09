
/**
 *  @file
 *
 *  This is the main module for tfjson (what you get requiring.)
 */

const _                       = require('underscore');
const libCEConfig             = require('ceconfig');

const { cleanKey, keyMirror }     = libCEConfig.all();

const CECONFIG                    = libCEConfig.mkCONFIG();
//const ARGV                        = libCEConfig.mkARGV();

// Helpful functions to export
module.exports.fns = {};
Object.assign(module.exports.fns,     require('./lib/aws'));
Object.assign(module.exports.fns,     require('./lib/ip'));
Object.assign(module.exports.fns,     require('./lib/ops'));
Object.assign(module.exports.fns,     require('./lib/utils'));

// TODO: Switch to ceconfig.ARGV
const argv            = require('minimist')(process.argv.slice(2));
const path            = require('path');
const fs              = require('fs');
const sgfs            = require('sgfs');
const { Data }        = require('./lib/data');
const { Resource }    = require('./lib/resource');
const { Locals }      = require('./lib/locals');
const { Variable }    = require('./lib/variable');
const utils           = require('./lib/utils');
const { ResourceFromOutput }    = require('./lib/resource-from-output');

//const { cleanKey, keyMirror }   = utils;
const { just }                                  = utils;

// If we have a known-jsons file, use it.
let   knowns    = safeReadFileSync(path.join(process.cwd(), '..', 'known-jsons.json')) ||
                  safeReadFileSync(path.join(__dirname, '..', '..', 'work', 'known-jsons.json')) || {};
let   adj = findAdjFromKnowns(knowns);

knowns = Object.keys(knowns).reduce((m, key) => {
  const value = knowns[key];
  return {...m, [key]: new ResourceFromOutput(key, value)};
}, {});

//console.error(`tfjson knowns (adj: ${adj}):`, knowns);

// Cache
let variables = {};
let locals    = {};
let data      = {};
let resources = {};

let cache     = {};

cache.realm = 'dc';

module.exports.Tf = function (options ={}) {
  let self = this;
  self.json = {};

  let costCntr    = options.costCntr   || 'LeeVanCleef';
  cache.realm     = cache.realm || options.realm || cache.realm;

  // -----------------------------------------------------------------------------------------------------------
  self.variable = function(a_, body) {
    self.json.variable = self.json.variable || [];

    let a = clean(a_);

    let x = {[a]:body};
    self.json.variable.push(x);

    return variables[a] = new Variable(a, body);
  };

  // -----------------------------------------------------------------------------------------------------------
  self.locals = function(body) {
    self.json.locals = self.json.locals || [];

    self.json.locals.push(body);

    return new Locals(body);
  };

  // -----------------------------------------------------------------------------------------------------------
  self.provider = function(a_, body) {
    self.json.provider = self.json.provider || {};

    let a = clean(a_);

    let x = {[a]: body};
    Object.assign(self.json.provider, x);
  };

  // -----------------------------------------------------------------------------------------------------------
  self.data = function(a_, b_, body) {
    self.json.data = self.json.data || [];

    let a = clean(a_);
    let b = clean(b_);

    let x = {[a]:{[b]: body}};
    self.json.data.push(x);

    return setOn(data, a, b, new Data(a, b, body));
  };

  // -----------------------------------------------------------------------------------------------------------
  self.fetchData = function(a_, b_, ) {
    let a = clean(a_);
    let b = clean(b_);

    let result = data[a];
    result = result && result[b];

    result = result || self.alternateResource(a_, b_);

    return wassertGood(result, `${b} (${a}) does not exist, yet.`) || self.externData(a, b, {});
  };

  // -----------------------------------------------------------------------------------------------------------
  self.externData = function(a_, b_, body) {
    let a = clean(a_);
    let b = clean(b_);

    return new Data(a, b, body);
  };

  // -----------------------------------------------------------------------------------------------------------
  self.output = function(a_, b_, body) {
    self.json.output = self.json.output || [];
    const a = clean(a_);
    const b = clean(b_)   || 'the';

    const k = `${a}__${b}`;
    const x = {[k]: body};
    self.json.output.push(x);

    //return new Resource(a, b, body);
  };

  // TODO: put self.resource back here

  // -----------------------------------------------------------------------------------------------------------
  self.fetchResource = function(a_, b_) {
    let a = clean(a_);
    let b = clean(b_);
    let result;

    let resultA = resources[a];
    if (!b) {
      // You can ask by just the type, and if there is only one, you get it.
      const keys = Object.keys(resultA ||[]);
      if (keys.length === 1) {
        result = resultA[keys[0]];
      }
    }

    else {
      result = resultA && resultA[b];
    }

    result = result || self.alternateResource(a_, b_);

    return wassertGood(result, `${b} (${a}) does not exist, yet.`) || self.externResource(a, b, {});
  };

  // -----------------------------------------------------------------------------------------------------------
  self.alternateResource = function(a_, b_, body, level =1) {
    let a = clean(a_);
    let b = clean(b_);

    let result;

    result  = knowns[`${a}__${b}`] || result;
    result  = knowns[`${a}${b}`]  || result;
    result  = knowns[`${a_}__${b_}`] || result;
    result  = knowns[`${a_}${b_}`] || result;

    if (typeof b_ !== 'string') {
      result  = knowns[`${a}`] || result;
      result  = knowns[`${a_}`] || result;
    }

    if (!result && a_ === 'aws_ami' && b_ === 'xenial') {
      result = new ResourceFromOutput('aws_ami_xenial', 'ami-08a5419d45846dbc5');
    }

    // Fix naming problems (type_name --> type_name_id)
    if (!result && level === 1) {
      // type_name -> type_name_id
      let alt = self.alternateResource(a_, `${b_}_id`, body, level+1);
      if (alt) {
        result = alt;
      }
    }

    if (level === 1) {    // Only brag if we are not doing a fixup
      // Let the caller know they are lucky we are looking out for them.
      if (result) {
        console.error(`Looking out for you! (${a_}, ${b_})`, {result: result});
      } else {
        console.error(`Looking out for you?`, {result: result, a_, b_, a, b, keys: Object.keys(knowns)});
      }
    }

//    if (result) {
//      result = result.value;
//    }

    return result;
  };
  self.alternateData = self.alternateResource;

  // -----------------------------------------------------------------------------------------------------------
  self.externResource = function(a_, b_, body) {
    let a = clean(a_);
    let b = clean(b_);

    return new Resource(a, b, body);
  };

  // -----------------------------------------------------------------------------------------------------------
  self.resource = function(a_, b_, body_) {
    self.json.resource = self.json.resource || [];
    warnResource(a_, b_, body_);

    let a = clean(a_);
    let b = clean(b_);

    let body = body_;
    if (taggable(a)) {
      body = { ...body,
        tags: {
          Name        : b_,
          realm       : cache.realm,
          costCntr,
          ...(body.tags ||{})
        }
      };
    }

    let x = {[a]:{[b]: body}};
    self.json.resource.push(x);

    const result = setOn(resources, a, b, new Resource(a, b, body));

    // TODO: output it if it can be

    return result;
  };

  // =================================================================================================================================

  // -----------------------------------------------------------------------------------------------------------
  self.aws = {};
  self.aws.data = {};
  self.aws.config = {};

  let adj, classB, region;

  let aws_vpc, aws_internet_gateway;
  let vpc_service_endpoints = {}, route_tables = {};

  // -----------------------------------------------------------------------------------------------------------
  self.aws.configuration = function(config) {
    ({adj, classB, region} = config);
    costCntr = costCntr || config.costCntr;

    self.aws.config = { ...self.aws.config, adj, classB, region, costCntr};
  };

  // -----------------------------------------------------------------------------------------------------------
  self.aws.vpc = function(vpc) {
    aws_vpc =
      self.resource('aws_vpc', `${adj}-Vpc`, {
        ...vpc,
        enable_dns_support    : true,
        enable_dns_hostnames  : true
      });

      self.output(`aws_vpc`, null, {
        value: just(aws_vpc.id)
      });

     self.aws.data.aws_vpc = aws_vpc;

    return aws_vpc;
  };

  // -----------------------------------------------------------------------------------------------------------
  self.aws.internet_gateway = function() {
    aws_internet_gateway =
      self.resource("aws_internet_gateway", `${adj}-IGW`, {
        vpc_id            : just(aws_vpc.id)
      });

      self.output(`aws_internet_gateway`, null, {
        value: just(aws_internet_gateway.id)
      });

    return aws_internet_gateway;
  };

  // -----------------------------------------------------------------------------------------------------------
  self.aws.vpc_endpoint = function(serviceName) {
    const service_vpc_endpoint =
      self.resource("aws_vpc_endpoint", `${adj}-${serviceName}-endpoint`, {
        vpc_id            : just(`${aws_vpc.id}`),
        service_name      : `com.amazonaws.${region}.${serviceName}`
      });

      self.output(`aws_vpc_endpoint`, serviceName, {
        value: just(service_vpc_endpoint.id)
      });

    vpc_service_endpoints[serviceName] = service_vpc_endpoint;
    return service_vpc_endpoint;
  };

  // -----------------------------------------------------------------------------------------------------------
  self.aws.route_table = function(name) {
    const route_table =
      self.resource("aws_route_table", `${adj}-RT-${name}`, {
        vpc_id            : just(aws_vpc.id),

        tags : {
          main : 'no'
        }
      });
      route_tables[name] = route_table;

      _.each(vpc_service_endpoints, (vpc_endpoint, serviceName) => {
        self.resource("aws_vpc_endpoint_route_table_association", `${serviceName}-endpoint-for-${name}`, {
          route_table_id            : just(route_table.id),
          vpc_endpoint_id           : just(vpc_endpoint.id)
        });
      })
    
    return route_table;
  };

  // -----------------------------------------------------------------------------------------------------------
  self.aws.subnet = function(name, {route_table_id, ...config}) {
    let subnet =
      self.resource("aws_subnet", `${adj}-subnet-${name}`, {
        vpc_id            : just(aws_vpc.id),
        ...config,
      });
  
      self.output("aws_subnet", name, {
        value: just(subnet.id)
      });
    
      self.resource("aws_route_table_association", `rtassoc_${name}`, {
        subnet_id         : just(subnet.id),
        route_table_id,
      });
  
    return subnet;
  };

  // -----------------------------------------------------------------------------------------------------------
  self.aws.sg = function(nameId, config) {
    const it =
      self.resource("aws_security_group", nameId, {
        vpc_id            : just(aws_vpc.id),
        ...config,
      });

      self.output("aws_security_group", nameId, {
        value: just(it.id)
      });
  
    return it;
  };

  // // -----------------------------------------------------------------------------------------------------------
  // self.aws.sg = function(nameId, name, description) {
  //   self.resource("aws_security_group", nameId, {
  //     vpc_id            : just(`${aws_vpc.id}`),
  //     name,
  //     description,
  //   });
  // };

  // -----------------------------------------------------------------------------------------------------------
  self.writeJson = function (filename) {
    const json = self.toJSON();
    if (argv._.indexOf('-') !== -1) {
      console.log(json);
      return;
    }

    const cwd = sgfs.dir();
    cwd.writeFileSync(filename, json);
  }

  // -----------------------------------------------------------------------------------------------------------
  self.toJSON = function() {
    return JSON.stringify(self.json, null, 2);
  };

  // -----------------------------------------------------------------------------------------------------------
  self.toPod = function () {
    return JSON.parse(JSON.stringify(self.json));
  }
};

// -----------------------------------------------------------------------------------------------------------
module.exports.TfBucket = function(options ={}) {
  let self = this;
  self.json = {};

  cache.realm = options.realm || cache.realm;

  self.add = function(name, tf) {
    self.json = {...self.json, [cleanKey(name)]:tf.toPod() };
  };

  self.writeJson = function (filename) {
    const json = self.toJSON();
    if (!filename || filename === '-') {
      process.stdout.write(json, 'utf8');
      return;
    }

    const cwd = sgfs.dir();
    cwd.writeFileSync(filename, json);
  }

  self.toJSON = function() {
    return JSON.stringify(self.json, null, 2);
  };

  self.toPod = function () {
    return JSON.parse(JSON.stringify(self.json));
  }
};

// -----------------------------------------------------------------------------------------------------------
function setOn(obj, a, b, value) {
  obj[a]      = obj[a]      || {};
  obj[a][b]   = value;

  return value;
}

  // -----------------------------------------------------------------------------------------------------------
function clean(str) {
  if (!str) { return str; }
  return str.replace(/[^0-9a-z_]/ig, '_');
}

// -----------------------------------------------------------------------------------------------------------
function wassertGood(x, msg ='') {
  if (!x) {
//    console.log(`WARNING: ${msg}`);
    console.trace(`WARNING: ${msg}`);
  }

  return x;
}

// -----------------------------------------------------------------------------------------------------------
function warnResource(a, b, body) {
  if (a === 'aws_vpc') {
    if (body.instance_tenancy === "dedicated") {
      console.log("");
      console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
      console.log(`WARNING: using dedicated instance tenancy on a VPC will cost $50/day or more.`);
      console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
      console.log("");
    }
  }
}

// -----------------------------------------------------------------------------------------------------------
function taggable(type) {
  const taggables   = keyMirror('aws_instance');
  const untaggables = keyMirror('aws_route,aws_security_group_rule,aws_route_table_association,aws_eip_association,aws_vpc_endpoint_route_table_association,aws_route53_record');

  return (taggables[type] || true) && !untaggables[type];
}




// -----------------------------------------------------------------------------------------------------------
function safeReadFileSync(filename, options ={encoding:'uft8'}) {

  try {
    const json_ = fs.readFileSync(filename);
    const json  = JSON.parse(''+json_);

    //console.error('safeReadFile from', {filename});
    return json;

  } catch(err) {
    //console.error(err);
  }

  //console.error(`safeReadFile FAILED from ${filename}`);
}

// -----------------------------------------------------------------------------------------------------------
function findAdjFromKnowns(knowns) {
  const keys = Object.keys(knowns);

  return keys.reduce((m, key) => {
    if (key.startsWith('aws_vpc_')) {
      const parts = key.split('_');
      if (parts.length >= 3) {
        return parts[2];
      }
    }

    return m;
  }, null);
}

