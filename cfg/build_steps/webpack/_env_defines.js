

function processEnvDefines(BuildConfigurator, config, devDebug) {
    let _rws_defines = {
        'process.env._RWS_DEV_DEBUG': JSON.stringify(devDebug),
        'process.env._RWS_DEFAULTS': JSON.stringify(BuildConfigurator.exportDefaultConfig()),
        'process.env._RWS_BUILD_OVERRIDE': JSON.stringify(BuildConfigurator.exportBuildConfig()),
        'process.env.TZ': JSON.stringify(process.env.TZ || 'Europe/Warsaw')
    }

    const rwsDefines = BuildConfigurator.get('env') || config.env || null;
    if (rwsDefines) {
        const stringifiedDefines = Object.entries(rwsDefines).reduce((acc, [key, value]) => ({
            ...acc,
            [`process.env.${key}`]: JSON.stringify(value)
        }), {});
        _rws_defines = { ..._rws_defines, ...stringifiedDefines }
    }
    
    return _rws_defines;
}

module.exports = { processEnvDefines }