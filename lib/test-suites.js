const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const { settings } = require('./settings');

async function getTestSuitePaths() {
  let fileList = [];
  for (const suitePath of settings.testSuitesPaths) {
    let globPattern = undefined
    if (suitePath.includes('*')) {
      globPattern = suitePath
    } else if (fs.existsSync(suitePath) && fs.lstatSync(suitePath).isDirectory()) {
      console.log(
        'DEPRECATED: using directory path is deprecated and will be removed, switch to glob pattern'
      );
      globPattern = `${suitePath}/**/*`
    }

    if (globPattern) {
      if (settings.isVerbose) {
        console.log(`Using pattern ${globPattern} to find test suites`);
      }
      const thisFileList = await glob(globPattern, { ignore: 'node_modules/**' })
      fileList.concat(thisFileList);
    } else {
      fileList.append(suitePath)
    }
  }

  console.log(`${fileList.length} test suite(s) found.`);
  if (settings.isVerbose) {
    console.log('Paths to found suites');
    console.log(JSON.stringify(fileList, null, 2));
  }

  // We can't run more threads than suites
  if (fileList.length < settings.threadCount) {
    if (settings.isVerbose) {
      console.log(
        `Thread setting is ${settings.threadCount}, but only ${fileList.length} test suite(s) were found. Adjusting configuration accordingly.`
      );
    }
    settings.threadCount = fileList.length;
  }

  return fileList;
}

function getMaxPathLengthFrom(testSuitePaths) {
  let maxLength = 10;

  for (let path of testSuitePaths) {
    maxLength = Math.max(maxLength, path.length);
  }

  return maxLength + 3;
}

function distributeTestsByWeight(testSuitePaths) {
  let specWeights = {};
  try {
    specWeights = JSON.parse(fs.readFileSync(settings.weightsJSON, 'utf8'));
  } catch (err) {
    console.log(`Weight file not found in path: ${settings.weightsJSON}`);
  }

  let map = new Map();
  for (let f of testSuitePaths) {
    let specWeight = settings.defaultWeight;
    Object.keys(specWeights).forEach((spec) => {
      if (f.endsWith(spec)) {
        specWeight = specWeights[spec].weight;
      }
    });
    map.set(f, specWeight);
  }

  map = new Map([...map.entries()].sort((a, b) => b[1] - a[1]));

  const threads = [];
  for (let i = 0; i < settings.threadCount; i++) {
    threads.push({
      weight: 0,
      list: []
    });
  }

  for (const [key, value] of map.entries()) {
    threads.sort((w1, w2) => w1.weight - w2.weight);
    threads[0].list.push(key);
    threads[0].weight += +value;
  }

  // Run slowest group first
  threads.sort((a, b) => b.weight - a.weight);

  return threads;
}

module.exports = {
  getTestSuitePaths,
  distributeTestsByWeight,
  getMaxPathLengthFrom
};
