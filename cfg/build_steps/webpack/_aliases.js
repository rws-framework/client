const path = require('path');
const fs = require('fs');

const packageNames = [
    'client',
    'nest-interconnectors'
];

async function loadAliases(packageDir, tsConfig, nodeModulesPath, executionDir){  
    
    const tsPaths = {}

    for(const aliasKey of Object.keys(tsConfig.config.compilerOptions.paths)){
        const alias = tsConfig.config.compilerOptions.paths[aliasKey];
        tsPaths[aliasKey] = path.resolve(executionDir, alias[0]);
    }

    for(const pkgName of packageNames){
        const symlinkPath = path.join(nodeModulesPath, '@rws-framework', pkgName);

        if(fs.existsSync(symlinkPath)){
            const pkgDirStat = fs.lstatSync(symlinkPath);          
        
            if(pkgDirStat.isSymbolicLink()){   
                const targetPath = await fs.promises.realpath(symlinkPath);                
                
                tsPaths['@rws-framework/' + pkgName + '/*'] = targetPath + '/*';
                tsPaths['@rws-framework/' + pkgName] = targetPath + '/src/index.ts';
            }
        }
    }

    return {        
        ...tsPaths,
        '@rws-framework/foundation': path.resolve(packageDir, 'foundation', 'rws-foundation.js'),
        '@rws-framework/foundation/*': path.resolve(packageDir, 'foundation', '*'),        
    }
}

module.exports = { loadAliases }
