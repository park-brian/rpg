'use strict';

/**
 * Ford Simulation Engine — Gateway Aggregator
 * Combines headless simulation kernel (src/sim.js) and viewport UI (src/view.js).
 */

const sim = require('./sim.js');
const view = require('./view.js');

module.exports = {
  ...sim,
  ...view
};
