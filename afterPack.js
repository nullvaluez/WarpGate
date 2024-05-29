const asarmor = require('asarmor');
const path = require('path');

exports.default = async ({ appOutDir, packager }) => {
    try {
        const asarPath = path.join(packager.getResourcesDir(appOutDir), 'app.asar');   
        console.log(`asarmor is encrypting all JavaScript files stored in ${asarPath}`);
        await asarmor.encrypt({
            // path to the input asar file
            src: asarPath,
            // path to the output asar file
            dst: asarPath,
        });
        console.log(`asarmor applying patches to ${asarPath}`);
        const archive = await asarmor.open(asarPath);
        archive.patch(); // apply default patches
        await archive.write(asarPath);
    } catch (err) {
        console.error(err);
    }
};