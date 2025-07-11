const { rwsPath } = require('@rws-framework/console');
const chalk = require('chalk');
const _scss_fs_builder = require('./_fs');
let _scss_fs = null;
const fs = require('fs');
const path = require('path');
const CSS_IMPORT_REGEX = /^(?!.*\/\/)(?!.*\/\*).*@import\s+['"]((?![^'"]*:[^'"]*).+?)['"];?/gm;
const SCSS_USE_REGEX = /^(?!.*\/\/)(?!.*\/\*).*@use\s+['"]?([^'"\s]+)['"]?;?/gm;


function processImportPath(importPath, rwsWorkspaceDir, appRootDir, fileRootDir = null, noext = false, pubDir = null) {

    _scss_fs = _scss_fs_builder(this);
    const workspaceDir = this.getRWSWorkspaceDir ? this.getRWSWorkspaceDir() : rwsWorkspaceDir;
    const appRoot = this.getRWSWorkspaceDir ? this.getRWSRootDir() : appRootDir;       

    if (importPath.split('')[0] === '~') {       
        return fillSCSSExt(replaceWithNodeModules(importPath, appRoot, null, true), noext);
    }

    if (importPath.indexOf('@rws-mixins') === 0) {        
        return path.resolve(rwsPath.findPackageDir(__dirname), 'src', 'styles', 'includes.scss');
    }

    if (importPath.indexOf('@workspace') === 0) {    
        return path.join(workspaceDir, 'src', importPath.replace('@workspace', ''));
    }

    if (importPath.indexOf('@public') === 0) {     
        return path.resolve(path.join(workspaceDir, pubDir, importPath.replace('@public', '')));
    }

    if (importPath.indexOf('@cwd') === 0) {
        return fillSCSSExt(path.join(this.appRootDir, importPath.slice(4)), noext);
    }   

    if (importPath.split('')[0] === '/' || importPath.split('')[1] === ':') {
        const originalImport = fillSCSSExt(importPath, noext);  

        if(!fs.existsSync(originalImport)){
            const absoluteImport = fillSCSSExt(path.join(workspaceDir, 'src', importPath), noext);

            return absoluteImport;            
        }
        
        return originalImport;
    }   
    
   

    if (fileRootDir) {    
        const relativized = path.join(path.resolve(fileRootDir), importPath);     

        if (importPath.split('')[0] === '.') {
            return fillSCSSExt(relativized, noext);
        }

        if (!fs.existsSync(relativized)) {
            const partSplit = relativized.split(path.sep);
            partSplit[partSplit.length - 1] = '_' + partSplit[partSplit.length - 1] + '.scss';

            const newPath = underscorePath(relativized);

            if (fs.existsSync(newPath)) {
                return newPath;
            }
        }
        return fillSCSSExt(relativized, noext);
    }

    return importPath;
}

function underscorePath(underPath, noext = false) {
    const partSplit = underPath.split(path.sep);

    const repl = (partSplit[partSplit.length - 1].split('')[0] !== '_' ? '_' : '') + partSplit[partSplit.length - 1];

    partSplit[partSplit.length - 1] = repl + (underPath.indexOf('.scss') > - 1 || noext ? '' : '.scss');



    return partSplit.join(path.sep);
}


function fillSCSSExt(scssPath, noext = false) {
    const underscoredPath = underscorePath(scssPath, noext);

    let ext = scssPath;

    if (!fs.existsSync(scssPath) && fs.existsSync(underscoredPath)) {
        ext = underscoredPath;
    }

    if (noext) {
        ext =  scssPath;
    }

    if ((!fs.existsSync(scssPath) || (fs.existsSync(scssPath) && fs.statSync(scssPath).isDirectory())) && fs.existsSync(`${scssPath}.scss`)) {
        ext = `${scssPath}.scss`;
    }

    if (fs.existsSync(`_${scssPath}.scss`)) {
        ext = `${scssPath}.scss`;
    }   

    return ext;
}

function extractScssImports(fileContent, rwsWorkspaceDir, appRootDir, importRootPath, publicDir) {
    _scss_fs = _scss_fs_builder(this);
    let match;
    const imports = [];

    while ((match = CSS_IMPORT_REGEX.exec(fileContent)) !== null) {
        const importPath = match[1];
        const importLine = match[0];

        if (fs.statSync(importRootPath).isFile()) {
            importRootPath = path.dirname(importRootPath);
        }

        const processedImportPath = processImportPath(importPath, rwsWorkspaceDir, appRootDir, importRootPath, false, publicDir);

        imports.push([processedImportPath, importLine, path.resolve(processedImportPath), rwsWorkspaceDir, appRootDir]);
    }

    return [imports, fileContent];
}

function extractScssUses(fileContent) {
    _scss_fs = _scss_fs_builder(this);
    let match;
    const uses = [];

    while ((match = SCSS_USE_REGEX.exec(fileContent)) !== null) {
        const usesPath = match[1];
        const usesLine = match[0];

        if (!uses.find((item) => {
            return item[0] == usesPath
        }) && !usesPath !== 'sass:math') {
            uses.push([usesPath, usesLine]);
        }
    }

    return [uses];
}

function detectImports(code) {
    return CSS_IMPORT_REGEX.test(code);
}

function replaceWithNodeModules(input, appRootDir, fileDir = null, absolute = false, token = '~') {
    _scss_fs = _scss_fs_builder(this);   
    return input.replace(token, absolute ? `${path.join(appRootDir, 'node_modules')}${path.sep}` : this.node_modules_dir(fileDir ? fileDir : appRootDir));
}

function processImports(imports, fileRootDir, rwsWorkspaceDir, importStorage = {}, sub = false, pubDir = null) {
    _scss_fs = _scss_fs_builder(this);

    const importResults = [];

    const getStorage = (sourceComponentPath, importedFileContent) => {
        const sourceComponentPathFormatted = sourceComponentPath.replace(path.sep, '_');

        if (!(sourceComponentPathFormatted in importStorage)) {
            importStorage[sourceComponentPathFormatted] = importedFileContent;

            return importedFileContent;
        }

        return '';
    }


    imports.forEach(importData => {
        const originalImportPath = importData[0];
        const workspaceDir = this.getRWSWorkspaceDir ? this.getRWSWorkspaceDir() : importData[3];
        const appRoot = this.getRWSWorkspaceDir ? this.getRWSRootDir() : importData[4];

        let importPath = processImportPath(originalImportPath, workspaceDir, appRoot, fileRootDir, false, pubDir);
        
        // console.log({originalImportPath, importPath});
      
        let replacedScssContent = getStorage(importPath, _scss_fs.getCodeFromFile(importPath, workspaceDir, appRoot, pubDir).replace(/\/\*[\s\S]*?\*\//g, ''));

        const recursiveImports = extractScssImports(replacedScssContent, workspaceDir, appRoot, importPath, pubDir)[0];

        if (recursiveImports.length) {
            replacedScssContent = replaceImports(processImports(recursiveImports, path.dirname(importPath), workspaceDir, importStorage, true, pubDir), replacedScssContent);
        }
        
        importResults.push({
            line: importData[1],
            code: replacedScssContent
        });
    });

    return importResults;
}

function replaceImports(processedImports, code) {
    processedImports.forEach(importObj => {
        code = code.replace(importObj.line, importObj.code);
    });

    return code;
}

module.exports = (element) => ({
    processImportPath: processImportPath.bind(element),
    fillSCSSExt: fillSCSSExt.bind(element),
    underscorePath: underscorePath.bind(element),
    detectImports: detectImports.bind(element),
    extractScssUses: extractScssUses.bind(element),
    extractScssImports: extractScssImports.bind(element),
    replaceImports: replaceImports.bind(element),
    processImports: processImports.bind(element),
    replaceWithNodeModules: replaceWithNodeModules.bind(element)
});