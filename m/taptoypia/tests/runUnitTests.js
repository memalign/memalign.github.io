const fs = require('fs');
const path = require('path');
const { UnitTests, MALog } = require('./UnitTests');

const ut = new UnitTests();

for (const file of fs.readdirSync(__dirname)) {
  if (file.startsWith('UnitTests_') && file !== 'UnitTests.js') {
    const TestClass = require(path.join(__dirname, file));
    ut.importTestMethodsFromClass(TestClass);
  }
}

ut.run();

for (let log of MALog.logs) {
  console.log(log);
}

