const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const tools = require('../../../_tools');

module.exports = async (appRoot, swPath) => {
   const swFilePath = path.resolve(appRoot, swPath);

   if(swPath.indexOf('.ts') === -1 || !fs.existsSync(swFilePath)){
      throw new Error('[RWS] Service worker TS file does not exist');
   }

   await tools.runCommand(`yarn rws-client build:sw ${swPath}`);
}