// _parser.js
const path = require('path');
const fs = require('fs');

function checkIfPackageIsLinked(basePath, packageName) {
    try {
        // Check package.json first
        const packageJsonPath = path.join(basePath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Check if it's in dependencies or devDependencies
            const version = packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName];
            
            // If version starts with 'file:' or 'link:', it's linked
            if (version && (version.startsWith('file:') || version.startsWith('link:'))) {
                return {
                    isLinked: true,
                    source: 'package.json',
                    linkPath: version.replace(/^(file:|link:)/, '')
                };
            }
        }

        // Check yarn.lock
        const yarnLockPath = path.join(basePath, 'yarn.lock');
        if (fs.existsSync(yarnLockPath)) {
            const yarnLockContent = fs.readFileSync(yarnLockPath, 'utf8');
            const packageEntry = yarnLockContent.split('\n\n').find(entry => 
                entry.includes(`"${packageName}@`)
            );
            
            if (packageEntry && packageEntry.includes('link:')) {
                const linkMatch = packageEntry.match(/link: (.+)/);
                return {
                    isLinked: true,
                    source: 'yarn.lock',
                    linkPath: linkMatch ? linkMatch[1] : null
                };
            }
        }

        // Check package-lock.json
        const packageLockPath = path.join(basePath, 'package-lock.json');
        if (fs.existsSync(packageLockPath)) {
            const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
            const packageInfo = packageLock.dependencies?.[packageName] || 
                              packageLock.devDependencies?.[packageName];
            
            if (packageInfo && packageInfo.link) {
                return {
                    isLinked: true,
                    source: 'package-lock.json',
                    linkPath: packageInfo.link
                };
            }
        }

        return {
            isLinked: false,
            source: null,
            linkPath: null
        };
    } catch (e) {
        console.error('Error checking package link status:', e);
        return {
            isLinked: false,
            source: null,
            linkPath: null,
            error: e.message
        };
    }
}

function parseWebpackPath(stack) {
    const currentFileLine = stack.split('\n').find(line => line.includes('_loaders.js'));
    if (!currentFileLine) return null;

    const match = currentFileLine.match(/\((.+?):\d+:\d+\)/);
    if (!match) return null;

    const originalPath = match[1];
    
    if (originalPath.includes('webpack:')) {
        const [fsPath, webpackPath] = originalPath.split('webpack:');
        const basePath = fsPath.replace('/build/', '/');
        
        // Check if @rws-framework/client is linked
        const linkInfo = checkIfPackageIsLinked(basePath, '@rws-framework/client');

        // Check both possible locations
        const possiblePaths = [
            // Check in @dev/client
            path.join(basePath, '../@dev/client', webpackPath),
            // Check in node_modules
            path.join(basePath, 'node_modules/@rws-framework/client', webpackPath.replace('/client/', '/'))
        ];

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return {
                    original: originalPath,
                    fsPath: basePath,
                    webpackPath,
                    exists: true,
                    realPath: fs.realpathSync(possiblePath),
                    resolvedPath: possiblePath,
                    location: possiblePath.includes('node_modules') ? 'node_modules' : '@dev',
                    linkInfo // Include the link information
                };
            }
        }
    }

    return null;
}

module.exports = { parseWebpackPath, checkIfPackageIsLinked };