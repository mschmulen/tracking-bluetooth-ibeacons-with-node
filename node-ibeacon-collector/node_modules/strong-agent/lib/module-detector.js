var path = require('path');

module.exports.detectModule = detectModule;
function detectModule(modulename, hasRun) {
  var location;

  try {
    location = require.resolve(modulename);
  } catch (err) {}

  if (location) {
    location = path.dirname(location);
    var version = require(path.resolve(location, 'package.json')).version;
    return version;
  } else if (!hasRun) {
    return detectModule(
      path.resolve(process.cwd(), 'node_modules', modulename),
      true
    );
  }
  return null;
}