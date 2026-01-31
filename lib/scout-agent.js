#!/usr/bin/env node
/**
 * Scout Agent - Runs on macOS host to launch browser for Docker
 *
 * This small HTTP server runs on your Mac (outside Docker) and
 * allows the Docker container to request browser launches.
 */

const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3001;
const PROJECT_DIR = __dirname;

console.log('🤖 Scout Agent Starting...');
console.log(`📂 Project: ${PROJECT_DIR}`);
console.log(`🌐 Listening on: http://localhost:${PORT}`);
console.log('');
console.log('This agent allows Docker to launch Chrome on your Mac.');
console.log('Leave this running while using Scout in Docker.');
console.log('');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      agent: 'Scout Agent',
      platform: process.platform
    }));
    return;
  }

  // Launch browser
  if (req.url === '/launch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { category } = JSON.parse(body);

        console.log(`🚀 Launch request received: "${category || 'all'}"`);

        // Launch browser on host (scout-browser.js is in same directory)
        const scriptPath = path.join(__dirname, 'scout-browser.js');
        const cmd = `node "${scriptPath}" "${category || ''}"`;

        console.log(`   Executing: ${cmd}`);

        const process = exec(cmd, { cwd: path.dirname(__dirname) }); // Run from project root

        // Stream output
        process.stdout.on('data', (data) => {
          console.log(`   [Browser] ${data.toString().trim()}`);
        });

        process.stderr.on('data', (data) => {
          console.error(`   [Browser Error] ${data.toString().trim()}`);
        });

        process.on('exit', (code) => {
          console.log(`   Browser exited with code ${code}`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          category: category || 'all',
          message: 'Browser launched on host'
        }));

      } catch (err) {
        console.error('❌ Launch error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('✅ Scout Agent Ready!');
  console.log('');
  console.log('Now start Scout with: ./scout.sh');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Scout Agent...');
  server.close(() => {
    console.log('✅ Agent stopped');
    process.exit(0);
  });
});
