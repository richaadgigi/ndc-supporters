const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    console.log('Running patch-package...');
    execSync('npx patch-package', { stdio: 'inherit' });
} catch (e) {
    console.warn('patch-package failed or nothing to patch.');
}

const targetFile = path.join(__dirname, '../node_modules/jodit-react/build/esm/chunk-VZXEDNZT.mjs');

if (fs.existsSync(targetFile)) {
    console.log('Bypassing Jodit CSS import in jodit-react...');
    let content = fs.readFileSync(targetFile, 'utf8');
    const searchString = 'import "jodit/es2021/jodit.min.css";';
    if (content.includes(searchString)) {
        content = content.replace(searchString, `// ${searchString}`);
        fs.writeFileSync(targetFile, content);
        console.log('Successfully bypassed Jodit CSS import.');
    } else {
        console.log('Jodit CSS import already bypassed or not found.');
    }
} else {
    console.warn('Target file not found for Jodit CSS bypass:', targetFile);
}
