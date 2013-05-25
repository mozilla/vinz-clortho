/* a tiny wrapper around winston that let's us route all logging in the
 * application through winston, and at a later point
 * do more complex things with logging configuration per environment if
 * needed */

// simply export winston
exports.logger = require('winston');

// enable logging of uncaught exceptions
exports.logger.handleExceptions(new exports.logger.transports.Console());

exports.disable = function() {
  exports.logger.remove(exports.logger.transports.Console);
};
