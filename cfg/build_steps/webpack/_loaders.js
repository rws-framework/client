const path = require('path');
const json5 = require('json5');
const fs = require('fs');
const os = require('os');

const { parseWebpackPath } = require('./_parser');

const RWSCssPlugin = require("../../../builder/webpack/rws_scss_plugin");
const chalk = require('chalk');
const { timingCounterStart, timingCounterStop } = require('./_timing');
const { rwsRuntimeHelper, rwsPath } = require('@rws-framework/console');


function getRWSLoaders(packageDir, executionDir, tsConfigData, appRootDir, entrypoint, loaderIgnoreExceptions, publicDir, cssDir) {
  const scssLoader = path.join(packageDir, 'builder/webpack/loaders/rws_fast_scss_loader.js');
  const tsLoader = path.join(packageDir, 'builder/webpack/loaders/rws_fast_ts_loader.js');
  const htmlLoader = path.join(packageDir, 'builder/webpack/loaders/rws_fast_html_loader.js');

  const tsConfigPath = tsConfigData.path;

  const allowedModules = ['@rws-framework\\/[A-Z0-9a-z]'];
  // console.log('XXX', config);

  if(loaderIgnoreExceptions){
    for(const ignoreException of loaderIgnoreExceptions){
      allowedModules.push(ignoreException);
    }
  }

  const modulePattern = `node_modules\\/(?!(${allowedModules.join('|')}))`;

  const loaders = [    
    {
      test: /\.json$/,
      type: 'javascript/auto',
      include: [
        path.resolve(appRootDir, 'node_modules/entities/lib/maps'),        
      ],
    },
    {
      test: /\.html$/,
      use: [
        {
          loader: htmlLoader,
        },
      ],
    },
    {
      test: /\.(ts)$/,
      use: [        
        {
          loader: 'ts-loader',
          options: {
            configFile: tsConfigPath, 
            compilerOptions: {
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                target: "ES2018",
                module: "commonjs"
            },                        
            allowTsInNodeModules: true,
            reportFiles: true,
            logLevel: "info",
            logInfoToStdOut: true,
            context: executionDir,
            transpileOnly: true, 
            experimentalWatchApi: true,            
            errorFormatter: (message, colors) => {
              console.log({message});
              const messageText = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
              return `\nTS Error: ${messageText}\n`;
            },         
          }
        },
        {
          loader: tsLoader,
          options: {
            rwsWorkspaceDir: executionDir,
            appRootDir,
            publicDir
          }
        }
      ],
      include: [
        ...tsConfigData.includes.map(item => item.abs()),
        path.resolve(packageDir, 'foundation', 'rws-foundation.d.ts')            
      ],
      exclude: [
        ...tsConfigData.excludes.map(item => item.abs()),
        new RegExp(modulePattern),
        path.resolve(packageDir, 'builder'),            
        /\.debug\.ts$/,
        /\.d\.ts$/        
      ]     
    },
    {
      test: /\.scss$/i,
      use: [
        {
          loader: scssLoader,
          options: {
            rwsWorkspaceDir: executionDir,
            appRootDir,
            publicDir,
            cssDir
          }
        },
      ],
    },
  ];  

  return loaders;
}

function _extractRWSViewDefs(fastOptions = {}, decoratorArgs = {})
{  
  const addedParamDefs = [];
  const addedParams = [];  

  for (const key in fastOptions){                
    addedParamDefs.push(`const ${key} = ${JSON.stringify(fastOptions[key])};`);
    addedParams.push(key);
  }

  return [addedParamDefs, addedParams];
}

function extractRWSViewArgs(content, noReplace = false, filePath = null, addDependency = null, rwsWorkspaceDir = null, appRootDir = null, isDev = false, publicDir = null) {
  // If this is being called with only basic parameters (backward compatibility)
  if (filePath === null || addDependency === null) {
    return extractRWSViewArgsSync(content, noReplace);
  }
  
  // Otherwise, call the async version
  return extractRWSViewArgsAsync(content, noReplace, filePath, addDependency, rwsWorkspaceDir, appRootDir, isDev, publicDir);
}

function extractRWSViewArgsSync(content, noReplace = false) {
  const viewReg = /@RWSView\(\s*["']([^"']+)["'](?:\s*,\s*([\s\S]*?))?\s*\)\s*(.*?\s+)?class\s+([a-zA-Z0-9_-]+)\s+extends\s+RWSViewComponent/gm;

  let m;
  let tagName = null;
  let className = null;
  let classNamePrefix = null;
  let decoratorArgs = null;

  const _defaultRWSLoaderOptions = {
    templatePath: 'template.html',
    stylesPath: 'styles.scss',
    fastOptions: { shadowOptions: { mode: 'open' } }
  }

  while ((m = viewReg.exec(content)) !== null) {
    if (m.index === viewReg.lastIndex) {
      viewReg.lastIndex++;
    }

    m.forEach((match, groupIndex) => {
      if (groupIndex === 1) {
        tagName = match;
      }

      if (groupIndex === 2) {
        if (match) {
          try {            
            decoratorArgs = JSON.parse(JSON.stringify(match));
          } catch(e){
            console.log(chalk.red('Decorator options parse error: ') + e.message + '\n Problematic line:');
            console.log(`
              @RWSView(${tagName}, ${match})
            `);
            console.log(chalk.yellowBright(`Decorator options failed to parse for "${tagName}" component.`) + ' { decoratorArgs } defaulting to null.');
            console.log(match);

            console.error(e);

            throw new Error('Failed parsing @RWSView')
          }                   
        }
      }

      if (groupIndex === 3) {
        if(match){
          classNamePrefix = match;
        }
      }

      if (groupIndex === 4) {
        className = match;
      }
    });
  }

  if(!tagName){
    return null;
  }

  let processedContent = content;
  let fastOptions = _defaultRWSLoaderOptions.fastOptions;

  if(decoratorArgs && decoratorArgs !== ''){
    try {
      decoratorArgs = json5.parse(decoratorArgs);
    }catch(e){
      // ignore parse errors for backward compatibility
    }
  }

  if (decoratorArgs && decoratorArgs.fastElementOptions) {
    fastOptions = decoratorArgs.fastElementOptions;
  }
 
  let replacedDecorator = null;

  if(!noReplace){    
    const [addedParamDefs, addedParams] = _extractRWSViewDefs(fastOptions, decoratorArgs);    
    const replacedViewDecoratorContent = processedContent.replace(
      viewReg,
      `@RWSView('$1', null, { template: rwsTemplate, styles${addedParams.length ? ', options: {' + (addedParams.join(', ')) + '}' : ''} })\n$3class $4 extends RWSViewComponent `
    );

    replacedDecorator = `${addedParamDefs.join('\n')}\n${replacedViewDecoratorContent}`;
  }

  return {
    viewDecoratorData: {
      tagName,
      className,
      classNamePrefix,
      decoratorArgs
    },
    replacedDecorator
  }
}

async function extractRWSViewArgsAsync(content, noReplace = false, filePath = null, addDependency = null, rwsWorkspaceDir = null, appRootDir = null, isDev = false, publicDir = null) {
  const viewReg = /@RWSView\(\s*["']([^"']+)["'](?:\s*,\s*([\s\S]*?))?\s*\)\s*(.*?\s+)?class\s+([a-zA-Z0-9_-]+)\s+extends\s+RWSViewComponent/gm;

  let m;
  let tagName = null;
  let className = null;
  let classNamePrefix = null;
  let decoratorArgs = null;

  const _defaultRWSLoaderOptions = {
    templatePath: 'template.html',
    stylesPath: 'styles.scss',
    fastOptions: { shadowOptions: { mode: 'open' } }
  }


  while ((m = viewReg.exec(content)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === viewReg.lastIndex) {
      viewReg.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      if (groupIndex === 1) {
        tagName = match;
      }

      if (groupIndex === 2) {
        if (match) {
          try {            
            decoratorArgs = JSON.parse(JSON.stringify(match));
          } catch(e){
            console.log(chalk.red('Decorator options parse error: ') + e.message + '\n Problematic line:');
            console.log(`
              @RWSView(${tagName}, ${match})
            `);
            console.log(chalk.yellowBright(`Decorator options failed to parse for "${tagName}" component.`) + ' { decoratorArgs } defaulting to null.');
            console.log(match);

            console.error(e);

            throw new Error('Failed parsing @RWSView')
          }                   
        }
      }

      if (groupIndex === 3) {
        if(match){
          classNamePrefix = match;
        }
      }

      if (groupIndex === 4) {
        className = match;
      }
    });
  }

  if(!tagName){
    return null;
  }

  let processedContent = content;

  let fastOptions = _defaultRWSLoaderOptions.fastOptions;

  if(decoratorArgs && decoratorArgs !== ''){
    try {
      decoratorArgs = json5.parse(decoratorArgs);
    }catch(e){

    }
  }

  if (decoratorArgs && decoratorArgs.fastElementOptions) {
    fastOptions = decoratorArgs.fastElementOptions;
  }
 
  let replacedDecorator = null;

  if(!noReplace && filePath && addDependency){    
    const [addedParamDefs, addedParams] = _extractRWSViewDefs(fastOptions, decoratorArgs);
    
    // Get template name and styles path from decorator args
    let templateName = null;
    let stylesPath = null;
    
    if(decoratorArgs && decoratorArgs.template){
        templateName = decoratorArgs.template;
    }
    if(decoratorArgs && decoratorArgs.styles){
        stylesPath = decoratorArgs.styles;
    }
    
    // Generate template and styles
    const [template, htmlFastImports, templateExists] = await getTemplate(filePath, addDependency, className, templateName, isDev);
    const styles = await getStyles(filePath, rwsWorkspaceDir, appRootDir, addDependency, templateExists, stylesPath, isDev, publicDir);
    
    // Extract original imports (everything before the @RWSView decorator)
    const beforeDecorator = processedContent.substring(0, processedContent.search(/@RWSView/));
    const afterDecoratorMatch = processedContent.match(/@RWSView[\s\S]*$/);
    const afterDecorator = afterDecoratorMatch ? afterDecoratorMatch[0] : '';
    
    const replacedViewDecoratorContent = afterDecorator.replace(
      viewReg,
      `${template}\n${styles}\n${addedParamDefs.join('\n')}\n@RWSView('$1', null, { template: rwsTemplate, styles${addedParams.length ? ', options: {' + (addedParams.join(', ')) + '}' : ''} })\n$3class $4 extends RWSViewComponent `
    );

    // console.log({replacedViewDecoratorContent});

    replacedDecorator = `${htmlFastImports ? htmlFastImports + '\n' : ''}${beforeDecorator}${replacedViewDecoratorContent}`;
  }

  return {
    viewDecoratorData: {
      tagName,
      className,
      classNamePrefix,
      decoratorArgs
    },
    replacedDecorator
  }
}

async function getStyles(filePath, rwsWorkspaceDir, appRootDir, addDependency, templateExists, stylesPath = null, isDev = false, publicDir = null) {
  if(!stylesPath){
    stylesPath = 'styles/layout.scss';
  }

  let styles = 'const styles: null = null;'
  const stylesFilePath = path.join(path.dirname(filePath),  stylesPath);

  if (fs.existsSync(stylesFilePath)) {  
    const scsscontent = fs.readFileSync(stylesFilePath, 'utf-8');
    timingCounterStart();
    const plugin = new RWSCssPlugin({ rwsWorkspaceDir, appRootDir, publicDir });
    const codeData = await plugin.compileScssCode(scsscontent, path.join(path.dirname(filePath), 'styles'));
    const elapsed = timingCounterStop();
    let currentTimingList = rwsRuntimeHelper.getRWSVar('_timer_css');

    if(currentTimingList){
      currentTimingList += `\n${filePath}|${elapsed}`;
    }else{
      currentTimingList = `${filePath}|${elapsed}`;
    }

    rwsRuntimeHelper.setRWSVar('_timer_css', currentTimingList);

    const cssCode = codeData.code;

    styles = isDev ? `import './${stylesPath}';\n` : '';

    if (!templateExists) {
      styles += `import { css } from '@microsoft/fast-element';\n`;
    }
    styles += `const styles = ${templateExists ? 'T.' : ''}css\`${cssCode}\`;\n`;

    addDependency(path.join(path.dirname(filePath), '/', stylesPath));
  }

  return styles;
}

async function getTemplate(filePath, addDependency, className, templateName = null, isDev = false) {
  if(!templateName){
    templateName = 'template';
  }
  const templatePath = path.dirname(filePath) + `/${templateName}.html`;
  let htmlFastImports = null;
  const templateExists = fs.existsSync(templatePath);

  let template = 'const rwsTemplate: null = null;';

  if (templateExists) {
    const templateContent = fs.readFileSync(templatePath, 'utf-8').replace(/<!--[\s\S]*?-->/g, '');
    htmlFastImports = `import * as T from '@microsoft/fast-element';\nimport { html, css, ref, when, repeat, slotted, children } from '@microsoft/fast-element'; \nimport './${templateName}.html';\n`;
    template = `                
//@ts-ignore                
let rwsTemplate: any = T.html<${className}>\`${templateContent}\`;
`; addDependency(templatePath);
  }

  return [template, htmlFastImports, templateExists];
}

module.exports = { getRWSLoaders, extractRWSViewArgs, extractRWSViewArgsAsync, getTemplate, getStyles }
