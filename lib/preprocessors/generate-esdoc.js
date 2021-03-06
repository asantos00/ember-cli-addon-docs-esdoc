'use strict';

const ESDoc = require('esdoc').default;
const path = require('path');
const fs = require('fs-extra');
const tmp = require('tmp');

const ESDOC_CONFIG = {
  source: './',
  plugins: [
    {
      name: 'esdoc-ecmascript-proposal-plugin',
      option: {
        classProperties: true,
        objectRestSpread: true,
        doExpressions: true,
        functionBind: true,
        functionSent: true,
        asyncGenerators: true,
        decorators: true,
        exportExtensions: true,
        dynamicImport: true
      }
    },
    { name: 'esdoc-accessor-plugin' }
  ]
};

module.exports = function generateESDoc(inputPath) {
  const originalDir = process.cwd();
  process.chdir(inputPath);

  // ESDoc requires a README.md to exist or it throws, so create
  // one if it doesn't exist and remove it later
  let readMePath = path.join(inputPath, 'README.md');
  let hasAutogeneratedReadme = !fs.existsSync(readMePath);
  if (hasAutogeneratedReadme) {
    fs.closeSync(fs.openSync(readMePath, 'w'));
  }

  const destination = tmp.dirSync().name;
  const config = Object.assign({ destination }, ESDOC_CONFIG);

  // ESDoc writes to stdout (console.log statements) which we want
  // to absorb if possible
  let originalWrite = process.stdout.write;
  process.stdout.write = () => {};

  try {
    ESDoc.generate(config);

    if (hasAutogeneratedReadme) {
      fs.unlinkSync(readMePath);
    }

    process.chdir(originalDir);
    process.stdout.write = originalWrite;

    return fs.readJsonSync(path.join(destination, 'index.json'));
  } catch (e) {
    if (hasAutogeneratedReadme) {
      fs.unlinkSync(readMePath);
    }

    process.chdir(originalDir);
    process.stdout.write = originalWrite;

    throw e;
  }
}
