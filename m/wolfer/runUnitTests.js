const { UnitTests, MALog } = require('./UnitTests');

let ut = new UnitTests();
ut.run();

for (let log of MALog.logs) {
  console.log(log);
}