const path = require('path');

function loadAliases(packageDir, nodeModulesPath, srcDir){    
    return {        
        '@rws-framework/foundation': path.resolve(packageDir, 'foundation', 'rws-foundation.js')
    }
}

module.exports = { loadAliases }