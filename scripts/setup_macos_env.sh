#!/usr/bin/env bash

set -euo pipefail

echo "[1/7] Checking Homebrew..."
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew not found. Installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  echo "Homebrew found: $(brew --version | head -n1)"
fi

echo "[2/7] Installing core packages (node, ffmpeg, mkcert, mediamtx)..."
brew update
brew install node ffmpeg mkcert mediamtx || true

echo "[3/7] Installing Xcode Command Line Tools (if needed)..."
if ! xcode-select -p >/dev/null 2>&1; then
  xcode-select --install || true
else
  echo "Xcode CLT already installed."
fi

echo "[4/7] Installing nvm and LTS Node..."
if [ ! -d "$HOME/.nvm" ]; then
  brew install nvm || true
  mkdir -p "$HOME/.nvm"
  if ! grep -q "NVM_DIR" "$HOME/.zshrc" 2>/dev/null; then
    {
      echo ''
      echo '# nvm setup'
      echo 'export NVM_DIR="$HOME/.nvm"'
      echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"'
      echo '[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"'
    } >> "$HOME/.zshrc"
  fi
fi

# shellcheck disable=SC1090
if [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then . "/opt/homebrew/opt/nvm/nvm.sh"; fi
if command -v nvm >/dev/null 2>&1; then
  nvm install --lts
  nvm use --lts
else
  echo "nvm not available (skipping). Using Homebrew node instead."
fi

echo "[5/7] Enabling corepack and pnpm..."
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@latest --activate || true
else
  npm i -g pnpm || true
fi

echo "[6/7] Generating local HTTPS certificates with mkcert..."
pushd "$(dirname "$0")/.." >/dev/null
mkdir -p certs
mkcert -install || true
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1 || true
popd >/dev/null

echo "[7/7] Verifying installations..."
echo "node: $(node -v || echo not installed)"
echo "npm:  $(npm -v || echo not installed)"
echo "pnpm: $(pnpm -v || echo not installed)"
echo "ffmpeg: $(ffmpeg -version 2>/dev/null | head -n1 || echo not installed)"
echo "mkcert: $(mkcert -version 2>/dev/null || echo not installed)"
echo "mediamtx: $(command -v mediamtx >/dev/null 2>&1 && echo installed || echo not installed)"

echo "\nDone. Your macOS dev environment is prepared."


