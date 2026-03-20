const fs = require('fs');

const files = [
  'src/menu.ts', 
  'src/character.ts', 
  'src/registration.ts', 
  'shop.html', 
  'game.html', 
  'challenges.html'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');

    // Make replacements
    let newContent = content.replace(/window\.location\.href\s*=\s*(.+?);/g, 'window.location.replace($1);');
    newContent = newContent.replace(/onclick="([^"]*)window\.location\.href='([^']+)'([^"]*)"/g, 'onclick="$1window.location.replace(\'$2\')$3"');

    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
        console.log('Updated', f);
    }
});

console.log('Done');
