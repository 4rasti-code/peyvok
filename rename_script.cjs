const fs = require('fs');
const path = require('path');

const dir = './src';
const exts = ['.js', '.jsx', '.html', '.json', '.css'];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const replacements = [
    { from: /پەیڤچن/g, to: 'پەیڤۆک' },
    { from: /Peyivcin/g, to: 'Peyvok' },
    { from: /peyivcin/g, to: 'peyvok' },
];

walkSync(dir, function(filePath, stat) {
    const ext = path.extname(filePath);
    if (exts.includes(ext)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});

const extraFiles = ['./index.html', './package.json', './README.md'];
extraFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});

console.log("Renaming completed successfully.");
