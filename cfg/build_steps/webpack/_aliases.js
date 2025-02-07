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
        '@rws-framework/foundation/*': path.resolve(packageDir, 'foundation', '*'),
        // 'entities/lib/maps/entities.json': path.resolve(nodeModulesPath, 'entities/lib/maps/entities.json'),
        // 'entities/lib/maps/legacy.json': path.resolve(nodeModulesPath, 'entities/lib/maps/legacy.json'),
        // 'entities/lib/maps/xml.json': path.resolve(nodeModulesPath, 'entities/lib/maps/xml.json')
    }
}

module.exports = { loadAliases }
