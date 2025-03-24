const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建库构建目录
const buildDir = path.join(__dirname, '../../react-bits');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// 复制组件和样式
const componentsDir = path.join(__dirname, '../components');
const componentsDestDir = path.join(buildDir, 'src/components');

if (!fs.existsSync(componentsDestDir)) {
  fs.mkdirSync(componentsDestDir, { recursive: true });
}

// 复制文件
fs.readdirSync(componentsDir).forEach(file => {
  if (file.endsWith('.jsx') || file.endsWith('.css')) {
    fs.copyFileSync(
      path.join(componentsDir, file),
      path.join(componentsDestDir, file)
    );
  }
});

// 创建package.json
const packageJson = {
  "name": "react-bits",
  "version": "0.1.0",
  "description": "React Bits UI Component Library for Cherry Studio",
  "main": "dist/index.js",
  "scripts": {
    "build": "babel src --out-dir dist --copy-files"
  },
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0",
    "react-dom": "^17.0.0 || ^18.0.0"
  },
  "dependencies": {
    "prop-types": "^15.8.1"
  },
  "devDependencies": {
    "@babel/cli": "^7.18.10",
    "@babel/core": "^7.18.10",
    "@babel/preset-env": "^7.18.10",
    "@babel/preset-react": "^7.18.6"
  }
};

fs.writeFileSync(
  path.join(buildDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// 创建index.js
const indexContent = `
import './components/index.js';
`;

fs.writeFileSync(
  path.join(buildDir, 'src/index.js'),
  indexContent
);

console.log('React Bits library files prepared successfully!');
console.log('To build the library, run:');
console.log('cd react-bits && npm install && npm run build'); 