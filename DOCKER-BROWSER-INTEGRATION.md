# Docker + Browser Integration

## How It Works

Scout runs in Docker, but Chrome needs to run on your Mac. We use a **Scout Agent** to bridge the gap.

```
┌─────────────────────────────────────────────────┐
│                  Your Mac                        │
│                                                  │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │ Scout Agent  │◄────────┤  Scout Web      │  │
│  │ Port 3001    │ HTTP    │  (Docker)       │  │
│  └──────┬───────┘         │  Port 3000      │  │
│         │                 └─────────────────┘  │
│         │                                       │
│         ▼                                       │
│  ┌──────────────┐                              │
│  │   Chrome     │                              │
│  │   Browser    │                              │
│  └──────────────┘                              │
└─────────────────────────────────────────────────┘
```

## Architecture

### Scout Agent (Host)
- Small Node.js HTTP server
- Runs on your Mac (port 3001)
- Receives browser launch requests from Docker
- Executes `node scout-browser.js` on the host
- Streams browser output to console

### Scout Web (Docker)
- Express.js API server (port 3000)
- Detects it's running in Docker
- Sends HTTP requests to Scout Agent
- Uses `host.docker.internal` to reach host

### Browser (Host)
- Puppeteer + Chrome/Chromium
- Runs natively on macOS
- Shows GUI (can't run in Docker)
- Injects evaluation overlay

## Automatic Setup

When you run `./scout.sh`, it:

1. ✅ Starts Docker services (Ollama + Web)
2. ✅ Starts Scout Agent on host
3. ✅ Opens browser to http://localhost:3000

Everything is connected automatically!

## Manual Setup (if needed)

### Terminal 1: Scout Agent
```bash
node scout-agent.js
```
Keep this running.

### Terminal 2: Scout (Docker)
```bash
./scout.sh
```

### Using the "Launch Browser" Button

1. Open http://localhost:3000
2. Select category (Vehicles, etc.)
3. Click **Launch Browser**
4. Docker → Agent → Chrome opens automatically!

## Advantages

✅ **Docker isolation** - Web server and Ollama containerized
✅ **Native Chrome** - Full GUI support on macOS
✅ **Seamless integration** - One-click browser launch
✅ **Easy deployment** - Just run `./scout.sh`
✅ **Cross-platform** - Works on macOS, Linux, Windows

## Under the Hood

### Docker to Host Communication

Docker uses `host.docker.internal` (special hostname):
```javascript
// In Docker container
fetch('http://host.docker.internal:3001/launch', {
  method: 'POST',
  body: JSON.stringify({ category: 'vehicles' })
});
```

### Agent Launch Flow

```javascript
// Scout Agent (on Mac)
app.post('/launch', (req, res) => {
  const { category } = req.body;

  // Execute on host
  exec(`node scout-browser.js "${category}"`, ...);

  res.json({ success: true });
});
```

### Auto-Detection

```javascript
// Web server detects Docker
const isDocker = fs.existsSync('/.dockerenv');

if (isDocker) {
  // Use Scout Agent
  await fetch('http://host.docker.internal:3001/launch', ...);
} else {
  // Direct execution
  exec('node scout-browser.js ...', ...);
}
```

## Troubleshooting

### "Scout Agent not running"

**Problem**: Docker can't connect to host agent

**Solution**:
```bash
# Check if agent is running
lsof -i :3001

# Start it manually
node scout-agent.js
```

### Browser doesn't open

**Check agent logs**:
```bash
tail -f scout-agent.log
```

**Check Docker logs**:
```bash
docker-compose logs scout-web
```

### Agent keeps stopping

**Run in foreground** (for debugging):
```bash
node scout-agent.js
```

## Stopping Everything

```bash
./scout-stop.sh
```

This stops:
- Docker containers
- Scout Agent
- Cleans up PID files

## Native Mode (No Docker)

If you prefer to run everything natively:

```bash
# Terminal 1: Web server
node web-server.js

# Terminal 2: Browser
node scout-browser.js vehicles
```

No agent needed - everything runs on your Mac directly.

## Why This Approach?

### Alternatives Considered

❌ **X11 Forwarding** - Complex on macOS
❌ **VNC in Docker** - Overkill, slow
❌ **Headless Chrome** - No GUI interaction
✅ **Scout Agent** - Simple, works everywhere

### Benefits

- **Simple**: Just an HTTP server
- **Fast**: Direct host execution
- **Reliable**: Standard Node.js
- **Debuggable**: Easy to troubleshoot
- **Portable**: Works on any platform

## Future Enhancements

Potential improvements:

- [ ] WebSocket connection for real-time updates
- [ ] Agent status indicator in web UI
- [ ] Auto-restart agent on crash
- [ ] Multiple browser instances
- [ ] Remote browser control (run Scout on server)
