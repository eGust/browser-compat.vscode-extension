const { join } = require('path');
const { writeFile } = require('fs');
const { promisify } = require('util');

const bcd = require('mdn-browser-compat-data');

const writeFileAsync = promisify(writeFile);

const writeToFile = (filename, data) => writeFileAsync(
  join(__dirname, `../data/${filename}`),
  JSON.stringify(data, null, '\t'),
);

Promise.all(
  [
    writeToFile('bcd.json', bcd),
    ...Object.entries(bcd)
      .map(([key, content]) => writeToFile(`bcd/${key}.json`, content) ),
  ]
);
