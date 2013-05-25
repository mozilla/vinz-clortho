/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
StatsD = require("node-statsd").StatsD,
config = require('./configuration'),
logger = require('./logging').logger;

// report statistics with a "mozillaidp" prefix.
const PREFIX = "mozillaidp.";

var statsd = new StatsD(config.get('statsd.host'), config.get('statsd.port'));

// start by exporting a stubbed no-op stats reporter
module.exports = {
  timing: function(s, v) {
    if (statsd) { statsd.timing(PREFIX + s, v); }
  },
  increment: function(s, v) {
    if (statsd) { statsd.increment(PREFIX + s, v); }
  }
};
