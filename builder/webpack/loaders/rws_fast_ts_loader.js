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
    let isIgnored = false;
    let isDebugged = false;      
    // timingStart('decorator_extraction');
    const decoratorExtract = LoadersHelper.extractRWSViewArgs(processedContent);    
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

    let templateName = null;
    let stylesPath = null;
    
    if(decoratorData.decoratorArgs){        
        const decoratorArgs = json5.parse(decoratorData.decoratorArgs)

        if(decoratorArgs.template){
            templateName = decoratorData.decoratorArgs.template || null;
        }

        if(decoratorArgs.styles){
            stylesPath = decoratorData.decoratorArgs.styles || null;
        }
        
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
            const [template, htmlFastImports, templateExists] = await LoadersHelper.getTemplate(filePath, this.addDependency, className, templateName, isDev);         

            const styles = await LoadersHelper.getStyles(filePath, this.query?.rwsWorkspaceDir, this.query?.appRootDir,this.addDependency, templateExists, stylesPath, isDev, this.query?.publicDir);  

            if(className){                
                const replacedViewDecoratorContent =  decoratorExtract.replacedDecorator;  

                if(replacedViewDecoratorContent){
                    processedContent = `${template}\n${styles}\n${replacedViewDecoratorContent}`;
                }                
            }
            
            processedContent = `${htmlFastImports ? htmlFastImports + '\n' : ''}${processedContent}`;
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