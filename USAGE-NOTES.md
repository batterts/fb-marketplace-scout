# Scout Usage Notes

## Current Architecture Limitation

### Browser Launch from Web UI (Docker)

**⚠️ Important**: The "Launch Browser" button in the web UI currently **only works when running Scout natively** (not in Docker).

**Why?** Docker containers don't have access to your display, so they can't show GUI applications like Chrome.

### Two Ways to Use Scout

#### Option 1: Full Docker (Dashboard Only)
```bash
./scout.sh
```
- ✅ Web dashboard at http://localhost:3000
- ✅ Inventory browser
- ✅ Price analytics
- ❌ Browser launch button won't work

**Then run browser separately:**
```bash
# In a separate terminal (on your Mac, not in Docker)
node scout-browser.js vehicles
```

#### Option 2: Native (Everything Works)
```bash
# Terminal 1: Web server
node web-server.js

# Terminal 2: Browser automation
node scout-browser.js vehicles
```

- ✅ Web dashboard
- ✅ Browser automation
- ✅ Everything works

## Recommended Workflow

### Using Docker + Native Browser

1. **Start Scout Dashboard** (in Docker):
   ```bash
   ./scout.sh
   ```
   This starts the web interface at http://localhost:3000

2. **Launch Browser** (natively on your Mac):
   ```bash
   node scout-browser.js vehicles
   ```
   This opens Chrome with the evaluation overlay

3. **Browse and Evaluate**:
   - Click on FB Marketplace listings
   - See AI evaluation overlay
   - Data saves to database

4. **View Analytics**:
   - Go to http://localhost:3000
   - Browse inventory
   - View price charts

## Future Improvement

To make the "Launch Browser" button work from Docker, we could:
- Use X11 forwarding (complex)
- Run browser on host via API (need host agent)
- Use VNC/remote desktop (overkill)

For now, the two-process approach works best!
