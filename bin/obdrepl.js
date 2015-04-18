var OBDRepl = require('../lib');
var repl = require("repl");

var connection = new OBDRepl();

repl.start({
  eval: connection.evaluate.bind(connection)
});