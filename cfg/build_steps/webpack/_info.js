const chalk = require('chalk');
const util = require('util');



module.exports = {
    start: (executionDir, tsConfig, outputDir, isDev, publicDir, isParted, partedPrefix, partedDirUrlPrefix, devTools, rwsPlugins) => {        
        console.log(chalk.green('RWS Frontend build started with:'), {
        executionDir,        
        outputDir,
        dev: isDev,
        publicDir,
        parted: isParted,
        partedPrefix,
        partedDirUrlPrefix,
        devtool: devTools,
        plugins: rwsPlugins
        });

        console.log(chalk.blue('\nTSCONFIG:'), util.inspect(tsConfig.config, {
            depth: null,
            colors: true,
            maxArrayLength: null
        }));
    }
}