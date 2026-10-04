#!/bin/bash
# ==============================================================================
# DigitalOcean GPU Droplet Setup Script for Voice2Memory & Google Gemma 2
# ==============================================================================
set -e

echo "=== 🚀 Installing Dependencies on DigitalOcean Droplet ==="
sudo apt-get update && sudo apt-get install -y curl ffmpeg git python3 python3-pip python3-venv

# Install Ollama
echo "=== 🧠 Installing Ollama for Open-Weight Gemma 2 ==="
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service and pull Google Gemma 2
echo "=== 📥 Pulling Google Gemma 2 (gemma2:2b) ==="
ollama serve &
sleep 5
ollama pull gemma2:2b

# Clone and run Voice2Memory
echo "=== 📦 Setting up Voice2Memory Web App ==="
if [ ! -d "voice2memory" ]; then
    git clone https://github.com/hitesh-kumar123/Voice2Memory.git voice2memory
fi

cd voice2memory

# Setup Python Virtualenv for faster-whisper
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install faster-whisper

# Install Node.js & dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm ci
npm run build

echo "=== ✅ Voice2Memory Setup Complete on DigitalOcean ==="
echo "Run: 'npm start' to start the application on port 3000"
