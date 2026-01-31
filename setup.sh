#!/bin/bash

echo "🔧 Setting up FB Marketplace Scout..."
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🎭 Installing Playwright browsers..."
python -m playwright install chromium

echo ""
echo "🗄️  Initializing database..."
python database.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start watching:"
echo "  ./run.sh"
echo ""
echo "Or manually:"
echo "  source venv/bin/activate"
echo "  python3 watcher.py"
echo ""
echo "Check status:"
echo "  source venv/bin/activate && python3 status.py"
echo ""
