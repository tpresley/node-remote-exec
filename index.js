Ssh = require('ssh2');
async = require('async');

function RemoteExec(hosts, commands, options, cb) {
  var stdout = process.stdout
    , stderr = process.stderr;

  // return an error if no hosts were specified
  if (!hosts || !(hosts instanceof String || hosts instanceof Array)) return cb(new Error('No hosts specified'));
  // array-ify hosts if necessary
  if (hosts instanceof String) hosts = [hosts];
  // return an error if no commands were specified
  if (!commands || !(commands instanceof String || commands instanceof Array)) return cb(new Error('No commands specified'));
  // array-ify commands if necessary
  if (commands instanceof String) commands = [commands];
  
  // if 3rd arg (options) is a function, assume the user skipped the options and specified the callback
  if (options instanceof Function) {
    cb = options;
    options = null;
  }

  // default options
  if (!options) options = {};
  if (!options.port) options.port = 22;
  
  // grab refs to overloaded outputs if specified (defaults to process.stdout and process.stderr)
  if (options.stdout && options.stdout.write instanceof Function) {
    stdout = options.stdout;
    delete options.stdout;
  }
  if (options.stderr && options.stderr.write instanceof Function) {
    stderr = options.stderr;
    delete options.stderr;
  }

  // set callback to noop if not provided
  if (!cb) {
    cb = function(){};
  }

  function doHost(host, done) {
    // grab a new connection object
    var connection = new Ssh();
    
    function connect(done) {
      // attach event listeners and start the connection
      options.host = host;
      connection.on('ready', done);
      connection.on('error', done);
      connection.connect(options);
    }

    function runCommands(done) {
      // run each command in series
      async.eachSeries(commands, runCommand, done);
    }

    function runCommand(command, done){
      // if the current command ends with '&' (request for a background process)
      // then force an exit code of 0 to allow the connection to close
      // NOTE: this will most likely kill the command if it didn't specify 'nohup'
      if (/ &$/.test(command)) {
        command = command + '; exit 0';
      }

      // run the current command
      connection.exec(command, function(err, stream){
        if (err) done(err);
        
        // forward output to specified stream based on extended (null || stderr)
        stream.on('data', function(data, extended){
          ((extended && extended === 'stderr') ? stderr : stdout).write(data);
        });

        // capture the end of the command and return error if command exited with non-zero code
        stream.on('exit', function(code, signal){
          var err;
          if (code !== 0) {
            err = new Error(host + ' : ' + command + ' [Exit ' + code + ']');
          }
          done(err);
        });

      });
    }    

    // 1: connect to current host
    // 2: run each command
    async.series([ connect, runCommands ], function(err) {
      // close the connection
      connection.end(); 
      done(err);
    });
  }

  // run commands on all hosts in parallel
  async.each(hosts, doHost, cb);
}

module.exports = RemoteExec;