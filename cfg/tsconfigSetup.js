const md5 = require('md5');
const chalk = require('chalk');
const tools = require('../_tools');
const { rwsPath } = require('@rws-framework/console');
const path = require('path');
const fs = require('fs');

function setupTsConfig(tsConfigPath, executionDir, pkgPath, userAliases = {}) {

    if (!fs.existsSync(tsConfigPath)) {
        throw new Error(`Typescript config file "${tsConfigPath}" does not exist`);
    }

    const tsConfigContents = fs.readFileSync(tsConfigPath, 'utf-8');

    try {
        let tsConfig = JSON.parse(tsConfigContents);

        const declarationsPath = path.resolve(pkgPath, 'types') + '/declarations.d.ts';
        const foundationPath = path.resolve(pkgPath, 'foundation');
        const testsPath = path.resolve(pkgPath, 'tests');


        const relativeDeclarationsPath = path.relative(path.dirname(tsConfigPath), declarationsPath);
        const relativeTestsPath = path.relative(path.dirname(tsConfigPath), testsPath);
        const relativeFoundationPath = path.relative(path.dirname(tsConfigPath), foundationPath);

        const includedMD5 = [];
        const srcPath = 'src/index.ts';

        let changed = false;

        if (!Object.keys(tsConfig).includes('include')) {
            tsConfig['include'] = [];
        } else {
            tsConfig['include'] = tsConfig['include'].filter((inc) => {
                if (inc === srcPath) {
                    return true;
                }

                return fs.existsSync(rwsPath.relativize(inc, executionDir));
            })
        }


        if (!tsConfig['include'].includes(srcPath)) {
            console.log(chalk.blueBright('[RWS TS CONFIG]'), 'adding RWS project typescript code to project tsconfig.json');
            tsConfig['include'].unshift(srcPath);
            changed = true;
        }

        if (!Object.keys(tsConfig).includes('exclude')) {
            tsConfig['exclude'] = [];
            changed = true;
        }

        const excludeString = '**/*.debug.ts';

        if (!tsConfig['exclude'].includes(excludeString)) {
            tsConfig['exclude'].push(excludeString);
            changed = true;
        }

        let probablyLinked = false;

        tsConfig['include'].forEach(element => {
            if (element !== 'src' && element.indexOf('declarations.d.ts') > -1 && md5(fs.readFileSync(rwsPath.relativize(element, executionDir), 'utf-8')) === md5(fs.readFileSync(declarationsPath, 'utf-8'))) {
                probablyLinked = true;
            }
        });

        if (!tsConfig['include'].includes(relativeDeclarationsPath) && !probablyLinked) {
            console.log(chalk.blueBright('[RWS TS CONFIG]'), 'adding RWS typescript declarations to project tsconfig.json');
            tsConfig['include'].push(relativeDeclarationsPath);
            includedMD5.push(md5(fs.readFileSync(declarationsPath, 'utf-8')));
            changed = true;
        }

        if(!tsConfig.compilerOptions){
            throw new Error(`${tsConfigPath} needs "compilerOptions" section`)
        }

        if (Object.keys(userAliases).length) {
            const tsPaths = tsConfig.compilerOptions?.paths || {};

            // console.log({tsPaths})            
            let changedPaths = false;

            Object.keys(userAliases).forEach((alias) => {
                const aliasPath = userAliases[alias];
                if(!tsPaths[alias]){
        
                    tsPaths[alias] = [path.relative(executionDir, aliasPath)];

                    changedPaths = true;                    
                }
            });

            if(changedPaths){                
                console.log(chalk.blueBright('[RWS TS CONFIG]'), 'adding user aliases as paths to project tsconfig.json');

                tsConfig.compilerOptions.paths = tsPaths;
                changed = true;
            }
        }


        if (changed) {
            fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
            console.log(chalk.yellowBright('Typescript config file'), `"${chalk.blueBright(tsConfigPath)}"`, chalk.yellowBright('has been changed'));
        }

        return true;
    } catch (e) {
        const tsConfigFileContent = fs.readFileSync(tsConfigPath, 'utf-8');
        try {
            console.log(chalk.blueBright('TSConfig (parsed)'), JSON.parse(tsConfigFileContent));
        } catch (e) {
            console.log(chalk.yellow('TSConfig (unparsed)'), tsConfigFileContent);

        }
        console.log(chalk.redBright('Error in tsconfig.json:'));
        console.error(chalk.red(e.stack));

        return false;
    }
}

function getPartedModeVendorsBannerParams(partedDirUrlPrefix, partedPrefix) {
    return {
        banner: `if(!window.RWS_PARTS_LOADED){         
              const script = document.createElement('script');
              script.src = '${partedDirUrlPrefix}/${partedPrefix}.vendors.js';        
              script.type = 'text/javascript';
              document.body.appendChild(script);
              window.RWS_PARTS_LOADED = true;
              console.log('[RWS INIT SCRIPT]', 'vendors injected...');
            }`.replace('\n', ''),
        raw: true,
        entryOnly: true,
        include: `${partedPrefix}.client.js`
    };
}

module.exports = {
    setupTsConfig
}