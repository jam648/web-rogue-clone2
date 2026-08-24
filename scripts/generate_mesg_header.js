const fs = require('fs');
const path = require('path');

const mesgPath = path.join(__dirname, '..', 'mesg_J');
const content = fs.readFileSync(mesgPath, 'utf8');
const lines = content.split(/\r?\n/);

const mesg = new Array(507).fill('');

for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)\s+"([^"]*)"/);
    if (match) {
        const index = parseInt(match[1], 10);
        const text = match[2];
        if (index >= 0 && index < 507) {
            mesg[index] = text;
        }
    }
}

let header = `/* Auto-generated from mesg_J. Do not edit manually. */\n`;
header += `#ifndef MESG_J_H\n#define MESG_J_H\n\n`;
header += `extern char mesg[507][256];\n\n`;
header += `static inline void init_embedded_mesg(void) {\n`;

for (let i = 0; i < 507; i++) {
    if (mesg[i]) {
        // escape quotes and backslashes
        const escaped = mesg[i].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        header += `    snprintf(mesg[${i}], sizeof(mesg[${i}]), "%s", "${escaped}");\n`;
    } else {
        header += `    mesg[${i}][0] = '\\0';\n`;
    }
}

header += `}\n\n#endif /* MESG_J_H */\n`;

const outPath = path.join(__dirname, '..', 'src', 'mesg_J.h');
fs.writeFileSync(outPath, header, 'utf8');
console.log(`Generated ${outPath} successfully with ${mesg.filter(x => x.length > 0).length} messages.`);
