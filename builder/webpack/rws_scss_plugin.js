const path = require('path');
const _tools = require('../../_tools');

const _scss_compiler_builder = require('./scss/_compiler');
let _scss_compiler = null;
const _scss_import_builder = require('./scss/_import');

let _scss_import = null;
const _scss_fs_builder = require('./scss/_fs');
const { timingStart, timingStop } = require('../../cfg/build_steps/webpack/_timing');
let _scss_fs = null;


class RWSScssPlugin {
  autoCompile = [];
  rwsWorkspaceDir = null;

  constructor(params = {
    rwsWorkspaceDir: null,
    autoCompile: []
  }) {
    this.node_modules_dir = (fileDir) => path.relative(fileDir, _tools.findRootWorkspacePath(process.cwd() + '/node_modules'))
    _scss_import = _scss_import_builder(this);    
    _scss_fs = _scss_fs_builder(this);
    _scss_compiler = _scss_compiler_builder(this);

    if(!params.rwsWorkspaceDir){      
      throw new Error('Pass "rwsWorkspaceDir" to the "@rws-framework/client/builder/webpack/loaders/rws_fast_ts_loader.js" loader.');
    }

    this.rwsWorkspaceDir = params.rwsWorkspaceDir;

    if (!!params.autoCompile && params.autoCompile.length > 0) {
      this.autoCompile = params.autoCompile;
    }

    for (let index in this.autoCompile) {
      const sassFile = this.autoCompile[index];
      this.compileFile(sassFile, true);
    }
  }
  
  apply(compiler) {
    const _self = this;

    return;
  }

  async compileFile(scssPath) {    
    scssPath = _scss_import.processImportPath(scssPath, this.rwsWorkspaceDir, path.dirname(scssPath))    


    let scssCode = _scss_fs.getCodeFromFile(scssPath, this.rwsWorkspaceDir);

    return await _scss_compiler.compileScssCode(scssCode, path.dirname(scssPath), this.rwsWorkspaceDir);
  }

  async compileScssCode(scssCode, scssPath){    
    return await _scss_compiler.compileScssCode(scssCode, scssPath, this.rwsWorkspaceDir);
  }

  writeCssFile(scssFilePath, cssContent){
    return _scss_fs.writeCssFile(scssFilePath, cssContent);
  }

  getRWSWorkspaceDir() {
    return this.rwsWorkspaceDir;
  }
}

module.exports = RWSScssPlugin;
