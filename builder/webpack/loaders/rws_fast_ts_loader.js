// custom-html-loader.js
const fs = require('fs');
const chalk = require('chalk');
const _scss_cache = require('../../../cfg/build_steps/webpack/_cache');
const LoadersHelper = require('../../../cfg/build_steps/webpack/_loaders');
const md5 = require('md5');
const json5 = require('json5');

module.exports = async function(content) { 

    let processedContent = content;
    const filePath = this.resourcePath;
    const isDev = this._compiler.options.mode === 'development';       
    // timingStart('decorator_extraction');
    const decoratorExtract = await LoadersHelper.extractRWSViewArgsAsync(
        processedContent, 
        false, 
        filePath, 
        this.addDependency, 
        this.query?.rwsWorkspaceDir, 
        this.query?.appRootDir, 
        isDev, 
        this.query?.publicDir
    );    
    const decoratorData = decoratorExtract ? decoratorExtract.viewDecoratorData : null;
    
    const cachedCode = processedContent;

    const compilationVariables = this._compilation;
    const customCompilationOptions = compilationVariables?.customOptions || null;    

    const cachedTS = _scss_cache.cache(customCompilationOptions).getCachedItem(filePath, md5(cachedCode));
    
    if(cachedTS){
      return cachedTS;
    }

  

    if(!decoratorData){
        return content;
    }

    let isIgnored = false;
    let isDebugged = false;
    
    if(decoratorData.decoratorArgs){                     
        const decoratorArgs = decoratorData.decoratorArgs
        
        if(decoratorArgs.ignorePackaging){
            isIgnored = true;
        }

        if(decoratorArgs.debugPackaging){
            isDebugged = true;
        }             
    }    

    const tagName = decoratorData.tagName;
    const className = decoratorData.className;
    
    // timingStop('decorator_extraction');

    try { 
        if(tagName){                                   
            if(className){                
                const replacedViewDecoratorContent = decoratorExtract.replacedDecorator;  

                if(replacedViewDecoratorContent){
                    processedContent = replacedViewDecoratorContent;
                }                
            }
        }

        const debugTsPath = filePath.replace('.ts','.debug.ts');

        if(fs.existsSync(debugTsPath)){
            fs.unlinkSync(debugTsPath);
        }

        if(isDebugged){
            console.log(chalk.red('[RWS BUILD] Debugging into: ' + debugTsPath));
            fs.writeFile(debugTsPath, processedContent, () => {}); //for final RWS TS preview.
        }
      
        _scss_cache.cache(customCompilationOptions).cacheItem(filePath, processedContent, cachedCode);
        return processedContent;
    }catch(e){
        console.log(chalk.red('RWS Typescript loader error:'));
        console.error(e);       
        
        throw new Error('RWS Build failed on: ' + filePath);
    }
};