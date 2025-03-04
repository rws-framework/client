function getRWSHotReloadSetup(port, outputDir){
    return {
        hot: true,
        port,
        static: {
            directory: outputDir,            
        },
        devMiddleware: {
            publicPath: '/'
        }
    }
}

module.exports = { getRWSHotReloadSetup };