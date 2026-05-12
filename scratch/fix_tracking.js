import fs from 'fs';
import path from 'path';

function fixTrackingInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if line contains tracking class AND Kurdish/Arabic characters
    if (/tracking-[a-z0-9[\].-]+/.test(line) && /[\u0600-\u06FF]/.test(line)) {
      // Special case: if the tracking is applied to a container but the Kurdish text is inside it,
      // it's safer to just strip tracking from any line with Kurdish text.
      const newLine = line.replace(new RegExp('\\btracking-[a-z0-9[\\].-]+\\b', 'g'), '')
                          .replace(/className="\s+/g, 'className="') // clean up extra spaces
                          .replace(/\s+"/g, '"');
      
      if (newLine !== line) {
        lines[i] = newLine;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      fixTrackingInFile(fullPath);
    }
  }
}

walkDir('src/components');
walkDir('src/views'); // if exists
if (fs.existsSync('src/App.jsx')) fixTrackingInFile('src/App.jsx');
