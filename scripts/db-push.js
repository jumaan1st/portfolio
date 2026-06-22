const { spawn } = require('child_process');
const path = require('path');

console.log('Starting automated drizzle-kit push...');

// Use npm or npx cmd wrapper for Windows compatibility
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['drizzle-kit', 'push'];

const child = spawn(cmd, args, {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    shell: true
});

child.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    if (output.includes('Do you still want to push changes?')) {
        console.log('\n[Automated Solver] Selecting Yes to data loss...');
        child.stdin.write('\u001b[B\r\n');
    } else if (output.includes('Is ') || output.includes('table created') || output.includes('rename table') || output.includes('❯')) {
        console.log('\n[Automated Solver] Answering default option...');
        child.stdin.write('\r\n');
    }
});

child.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
});

child.on('close', (code) => {
    console.log(`drizzle-kit push exited with code ${code}`);
    process.exit(code);
});
