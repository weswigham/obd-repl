var OBDDevice = require('bluetooth-obd');
var Promise = require('promise');
var util = require('util');
var events = require("events");

function REPL() {
  this.init();
}
util.inherits(REPL, events.EventEmitter);

REPL.prototype.init = function() {
  this.device = new OBDDevice();
  this.connected = false;
  this.pollrate = 1000; //ms
};

REPL.prototype.connect = function() {
  var self = this;
  return new Promise(function(accept, reject) {
    self.device.on('error', function(err){
      reject(err);
    });
    self.device.on('connected', function connected() {
      self.removeEventListener('connected', connected);
      self.connected = true;
      self.device.startPolling(self.pollrate);
      self.device.on('error', function(err) {
        self.emit('error', err);
      });
      accept();
    });
    self.device.autoconnect('OBDII');
  });
};

REPL.prototype.disconnect = function() {
  this.device.disconnect();
};

REPL.prototype.readResponse_ = function() {
  var self = this;
  return new Promise(function(accept, reject){
    self.on('dataReceived', function dataGet(data) {
      self.removeEventListener('dataReceived', dataGet);
      accept(data);
    });
  });
};

REPL.prototype.writeMessage_ = function(command, responses) {
  this.device.write(command, responses !== undefined ? responses : 1);
};

REPL.prototype.addPoller_ = function(name) {
  this.device.addPoller(name);
};

REPL.prototype.removePoller_ = function(name) {
  this.device.removePoller(name);
};

REPL.prototype.lookupPID_ = function(name) {
  return this.device.getPIDByName(name);
};

REPL.prototype.lookupValue_ = function(name) {
  return this.device.requestValueByName(name);
};

REPL.prototype.parseCommand_ = function(data) {
  return this.device.parsOBDCommand(data);
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
      this.readResponse_().then(function(data){
        callback(null, data);
      }, function(err) {
        callback(err, null);
      });
    }
  }
};

module.exports = REPL;
