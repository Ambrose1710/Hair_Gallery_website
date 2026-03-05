// Run this script once to generate your admin password hash.
// Usage: node scripts/generate-hash.mjs
// Then copy the output and paste it as ADMIN_PASSWORD_HASH in Vercel's environment variables.

import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter your admin password: ', (password) => {
    const hash = bcrypt.hashSync(password, 10);
    console.log('\n✅ Your ADMIN_PASSWORD_HASH is:\n');
    console.log(hash);
    console.log('\nCopy the line above and paste it into Vercel → Settings → Environment Variables as ADMIN_PASSWORD_HASH\n');
    rl.close();
});
