const path = require('path');
const fs = require('fs');

module.exports = function(content){
    const filePath = this.resourcePath;
    const componentDir = path.dirname(filePath);
    const componentPath = path.resolve(componentDir, 'component.ts');

    if(fs.existsSync(componentPath)){
        const time = new Date();
        fs.utimes(componentPath, time, time, () => {});
    }
    
    return '';
}