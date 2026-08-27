/**
 * Autonomous Playtest Harness for Ford Engine
 * Demonstrates hooking into the game's observation and injection pipeline
 * to playtest as a single-player entity in the dynamic world.
 */
const {
  DATA, T, ACT, makeWorld, step, inject, read, hash, count, hands, tileAt, idx
} = require('./src/game.js');

function runAutonomousPlaytest(seed = 42, maxSteps = 100) {
  console.log(`=== Starting Autonomous Playtest on Seed ${seed} ===`);
  const { S, player } = makeWorld(seed);

  console.log(`Player entity spawned at (${S.px[player]}, ${S.py[player]}), ID: ${player}`);
  console.log(`Initial World State Hash: 0x${hash(S).toString(16)}`);

  let stepsTaken = 0;
  const journalLog = [];

  for (let cycle = 0; cycle < maxSteps; cycle++) {
    if (!S.palive[player]) {
      console.log(`[ALERT] Player died at time ${S.time} (Day ${Math.floor(S.time / 1440) + 1})`);
      break;
    }

    const personState = read(S, { person: player });
    const [food, sleep, warmth, safety, company] = personState.needs;

    // Check inventory hands
    const heldItems = hands(S, player);
    const knifeSlot = heldItems.find(t => S.tstuff[t] === 'knife');
    const axeSlot = heldItems.find(t => S.tstuff[t] === 'axe');
    const breadSlot = heldItems.find(t => S.tstuff[t] === 'bread');

    // 1. High-Priority Survival: Hunger
    if (food < 50 && breadSlot !== undefined && count(S, 1, player, 'bread') > 0) {
      console.log(`[DECISION] Hunger is low (${food.toFixed(1)}). Eating bread.`);
      inject(S, player, { k: 'act', slot: breadSlot, act: 'eat' });
      step(S, S.time + DATA.ACT_MIN.eat + 1);
      stepsTaken++;
      continue;
    }

    // 2. High-Priority Survival: Sleep / Rest when exhausted
    if (sleep < 20) {
      const restAffordance = read(S, { acts: player, slot: -1 }).find(a => a.act === 'sleep' || a.act === 'rest');
      if (restAffordance) {
        console.log(`[DECISION] Fatigue is high (${sleep.toFixed(1)}). Resting...`);
        inject(S, player, { k: 'act', slot: -1, act: restAffordance.act, target: restAffordance.tile });
        step(S, S.time + 360); // sleep 6 hours
        stepsTaken++;
        continue;
      }
    }

    // 3. Resource Gathering: Thatch
    const currentThatch = count(S, 1, player, 'thatch');
    if (currentThatch < 4 && knifeSlot !== undefined) {
      const thatchAffordance = read(S, { acts: player, slot: knifeSlot }).find(a => a.act === 'thatch');
      if (thatchAffordance) {
        console.log(`[DECISION] Gathering thatch bundle (${currentThatch + 1}/4)...`);
        inject(S, player, { k: 'act', slot: knifeSlot, act: 'thatch', target: thatchAffordance.tile });
        step(S, S.time + DATA.ACT_MIN.thatch + 1);
        stepsTaken++;
        continue;
      }
    }

    // 4. Resource Gathering: Logs
    const currentLogs = count(S, 1, player, 'log');
    if (currentLogs < 4 && axeSlot !== undefined) {
      const chopAffordance = read(S, { acts: player, slot: axeSlot }).find(a => a.act === 'chop');
      if (chopAffordance) {
        console.log(`[DECISION] Chopping adjacent tree for logs (${currentLogs + 1}/4)...`);
        inject(S, player, { k: 'act', slot: axeSlot, act: 'chop', target: chopAffordance.tile });
        step(S, S.time + DATA.ACT_MIN.chop + 1);
        stepsTaken++;
        continue;
      }
    }

    // 5. Crafting: Whittle Spade from Log if no spade held
    const spadeSlot = heldItems.find(t => S.tstuff[t] === 'spade');
    if (spadeSlot === undefined && currentLogs > 0 && knifeSlot !== undefined) {
      const whittleAffordance = read(S, { acts: player, slot: knifeSlot }).find(a => a.act === 'whittle');
      if (whittleAffordance) {
        console.log(`[DECISION] Whittling wooden spade from log...`);
        inject(S, player, { k: 'act', slot: knifeSlot, act: 'whittle' });
        step(S, S.time + DATA.ACT_MIN.whittle + 1);
        stepsTaken++;
        continue;
      }
    }

    // 4. Exploration & Movement: Step East towards the village / stream
    if (S.px[player] < 45) {
      console.log(`[DECISION] Traversing East along road (x: ${S.px[player]} -> ${S.px[player] + 1})...`);
      inject(S, player, { k: 'move', d: 3 });
      step(S, S.time + 10);
      stepsTaken++;
      continue;
    }

    // Default step forward in time
    step(S, S.time + 30);
    stepsTaken++;
  }

  console.log(`=== Autonomous Playtest Completed (${stepsTaken} actions executed) ===`);
  const finalState = read(S, { person: player });
  console.log(`Final Player Status: Alive=${S.palive[player]}, Needs=[${finalState.needs.map(n => n.toFixed(1)).join(', ')}]`);
  console.log(`Final Inventory: Logs=${count(S, 1, player, 'log')}, Thatch=${count(S, 1, player, 'thatch')}, Bread=${count(S, 1, player, 'bread')}`);
  console.log(`Final World State Hash: 0x${hash(S).toString(16)}`);

  // Assert Invariant Gates
  if (count(S, 1, player, 'bread') < 0 || count(S, 1, player, 'log') < 0) {
    throw new Error('Invariant Failure: Negative stock detected!');
  }
  console.log('✔ All Playtest Invariant Assertions Passed Successfully!');
}

if (require.main === module) {
  runAutonomousPlaytest(42, 60);
}

module.exports = { runAutonomousPlaytest };
