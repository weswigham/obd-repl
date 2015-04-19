var OBDDevice = require('serial-obd');
var Promise = require('promise');
var util = require('util');
var events = require("events");

function REPL() {
  this.init();
}
util.inherits(REPL, events.EventEmitter);

REPL.prototype.init = function() {
  this.reader = new OBDDevice('COM4', {});
  this.writer = new OBDDevice('COM7', {});
  this.pollrate = 1000; //ms
};

REPL.prototype.connect = function() {
  var self = this;
  return new Promise(function(accept, reject) {
	var connected = 0;
    self.reader.on('error', function(err){
      reject(err);
    });
    self.writer.on('error', function(err){
      reject(err);
    });	
    self.reader.on('connected', function readerConnect() {
	  connected++;
      self.reader.removeListener('connected', readerConnect);
      self.reader.startPolling(self.pollrate);
      self.reader.on('error', function(err) {
        self.emit('error', err);
      });
	  self.reader.on('dataReceived', function(data) {
        console.log(data);
	  });
	  if (connected>=2) {
        accept();
	  }
    });
    self.reader.connect();    
	self.writer.on('connected', function writerConnect() {
	  connected++;
      self.writer.removeListener('connected', writerConnect);
      self.writer.on('error', function(err) {
        self.emit('error', err);
      });
	  if (connected>=2) {
        accept();
	  }
    });
    self.writer.connect();
  });
};

REPL.prototype.disconnect = function() {
  this.reader.disconnect();
  this.writer.disconnect();
};

REPL.prototype.writeMessage_ = function(command, responses) {
  this.writer.write(command, responses !== undefined ? responses : 1);
};

REPL.prototype.addPoller_ = function(name) {
  this.reader.addPoller(name);
};

REPL.prototype.removePoller_ = function(name) {
  this.reader.removePoller(name);
};

REPL.prototype.lookupPID_ = function(name) {
  return this.writer.getPIDByName(name);
};

REPL.prototype.lookupValue_ = function(name) {
  return this.writer.requestValueByName(name);
};

REPL.prototype.parseCommand_ = function(data) {
  return this.writer.parsOBDCommand(data);
};

REPL.prototype.evaluate = function(command, context, filename, callback) {
  switch(command.toLowerCase().trim()) {
    case 'connect': {
      console.log('Connecting...');
      this.connect().then(function(data){
        console.log('Connected!');
        callback(null, data);
      }, function(err) {
        callback(err, null);
      });
      break;
    }
    case 'disconnect': {
      this.disconnect();
      callback(null, true);
      break;
    }
    default: {
      this.writeMessage_(command);
    }
  }
};

module.exports = REPL;
