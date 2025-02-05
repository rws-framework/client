const path = require('path');

function loadAliases(packageDir, tsConfig, nodeModulesPath, executionDir){  
    
    const tsPaths = {}

    for(const aliasKey of Object.keys(tsConfig.config.compilerOptions.paths)){
        const alias = tsConfig.config.compilerOptions.paths[aliasKey];
        tsPaths[aliasKey] = path.resolve(executionDir, alias[0]);
    }
  
    return {        
        ...tsPaths,
        '@rws-framework/foundation': path.resolve(packageDir, 'foundation', 'rws-foundation.js'),
        '@rws-framework/foundation/*': path.resolve(packageDir, 'foundation', '*')
    }
}

module.exports = { loadAliases }