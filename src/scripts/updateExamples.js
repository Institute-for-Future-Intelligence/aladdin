const fs = require('fs');
const path = require('path');

const EXAMPLE_TEXT = `
Usage: npm run update <type> <key> <value>
-type: Pascal_Case_With_Underscore. e.g. All, Wind_Turbine, Solar_Panel, Roof, Hip_Roof
-key: camelCase. Same as keys in Element Model. e.g. eavesLength, overhange, color
-value: string(use '_' as space), number, boolean, null, undefined, true, false, array(no space or nested). (no object)

Examples:
npm run update All color red
npm run update Roof overhange undefined
npm run update Roof ceilingRValue 0.5
npm run update Solar_Panel rotation [0,0,1]
npm run update Foundation texture Foundation_Texture_#1
npm run update Wall parapet 0 (need set defaultValue in script)
`;

const FOLDER_PATH = './src/examples';

if (process.argv.length < 5) {
  console.error('Please provide all arguments.\n', EXAMPLE_TEXT);
  process.exit(1);
}

const elementType = parseValue(process.argv[2]);
const key = process.argv[3];

// hard code here to add { objcect } type value. If we set value here, we need to add an arbitrary value in cmd
const defaultValue = null;

const value = defaultValue ?? parseValue(process.argv[4]);

fs.readdir(FOLDER_PATH, (err, files) => {
  if (err) {
    console.error(`An error occurred while reading the directory: ${err}`, EXAMPLE_TEXT);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(FOLDER_PATH, file);
    fs.stat(filePath, (err, stat) => {
      if (err) {
        console.error(`An error occurred while getting file stats: ${err}`, EXAMPLE_TEXT);
        return;
      }
      if (stat.isFile()) {
        fs.readFile(filePath, 'utf-8', (err, content) => {
          if (err) {
            console.error(`An error occurred while reading the file: ${err}`, EXAMPLE_TEXT);
            return;
          }
          const data = JSON.parse(content);
          let changed = false;

          if (data.elements && data.elements.length > 0) {
            data.elements.forEach((element) => {
              if (elementType === 'All' || element.type === elementType) {
                element[key] = value;
                changed = true;
              }
            });
          }

          if (changed) {
            fs.writeFile(filePath, JSON.stringify(data), 'utf-8', (err) => {
              if (err) {
                console.error(`An error occurred while writing to the file: ${err}`, EXAMPLE_TEXT);
              } else {
                console.log(`Updated ${filePath.split(/\\/)[2]} successfully!`);
              }
            });
          }
        });
      }
    });
  });
});

function parseValue(value) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (value === 'null') {
    return null;
  }

  if (value === 'undefined') {
    return undefined;
  }

  if (!isNaN(value)) {
    return Number(value);
  }

  if (value.startsWith('[')) {
    if (!value.endsWith(']')) {
      console.error('No space allowed in array.\n', EXAMPLE_TEXT);
      process.exit(1);
    }
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => parseValue(item.trim()));
  }

  return value.replaceAll('_', ' ');
}
