const asarmor = require('asarmor');
const path = require('path');

module.exports = async function (context) {
  const appOutDir = context.appOutDir;
  const asarPath = path.join(appOutDir, 'resources', 'app.asar');

  try {
    console.log(`Applying asarmor patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // Apply default patches
    await archive.write(asarPath);
    console.log('Patches applied successfully');
  } catch (err) {
    console.error('Failed to apply asarmor patches', err);
  }
};
