# remote-exec

**Very simple wrapper for [ssh2](https://github.com/mscdex/ssh2) to execute shell commands on one or more remote computers in node via SSH**

## install

```
npm install remote-exec
```

## usage

```javascript
var rexec = require('remote-exec');
rexec(hosts <string|array>, commands <string|array>, options <object>, callback <function>);
```
### hosts
hosts can be a string, an array of strings, or an array of objects   
if hosts is an array of objects, the **name** key of each object will be used to connect to the host

### commands
commands can be a string or an array of strings   
commands can also contain parameters using the {{myParameter}} syntax (see below)

### options
options is the connection options object used for [ssh2](https://github.com/mscdex/ssh2) with the following additions:
- the **params** key takes an object declaring global/default values for parameters used in commands
- the **beforeEach** key takes a callback function run for each host before commands are run (passed host, commands, and params objecs)
- **stdout** and/or **stderr** can be specified to change where output from the remote hosts is sent

## examples

### basic
```javascript
var rexec = require('remote-exec');

// see documentation for the ssh2 npm package for a list of all options 
var connection_options = {
	port: 22,
	username: 'myuser',
	privateKey: require('fs').readFileSync('~/.ssh/rsa_id'),
	passphrase: 'mypassphrase'
};

var hosts = [
	'host1.somewhere.com',
	'host2.somewhere.else.com',
	'250.110.0.13'
];

var cmds = [
	'ls -l',
	'cat /etc/hosts'
];

rexec(hosts, cmds, connection_options, function(err){
	if (err) {
		console.log(err);
	} else {
		console.log('Great Success!!');
	}
});
```

### parameters
```javascript
// commands can be parameterized using the {{parameterName}} syntax
// parameters can be set at the global or host level

// global parameters should be set via the params key of the connections options
var connection_options = {
	port: 22,
	username: 'myuser',
	privateKey: require('fs').readFileSync('~/.ssh/rsa_id'),
	passphrase: 'mypassphrase',
	params: {
		myParam: 'something',
		anotherParam: 'something else'
	}
}

// to set a parameter for a specific host:
var hosts = [
	{name: 'host1.somewhere.com', myParam: 'this overrides the global myParam value', blah: 'this is an additional parameter at the host level'},
	{name: 'host2.somewhere.else.com'} // this host will only get the global parameters
];

var cmds = [
	'echo "{{myParam}}"'
];

rexec(hosts, cmds, connection_options, function(err){
	if (err) {
		console.log(err);
	} else {
		console.log('Great Success!!');
	}
});
```

### output
```javascript
// by default all output for remote computers is routed to process.stdout and process.stderr
// but this can be overridden by passing valid writable streams to the stdout and/or stderr
// keys of the connection options

var rexec = require('remote-exec')
  , fs = require('fs');

var connection_options = {
  port: 22,
  stdout: fs.createWriteStream('./out.txt'),
  stderr: fs.createWriteStream('./err.txt')
}

rexec('myserver.com', 'cat /proc/cpuinfo', connection_options);

```
