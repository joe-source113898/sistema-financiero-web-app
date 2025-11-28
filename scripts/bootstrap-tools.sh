#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_DIR="${TOOLS_DIR:-$PROJECT_ROOT/tools}"
NODE_VERSION="${NODE_VERSION:-20}"
NVM_INSTALL_VERSION="${NVM_INSTALL_VERSION:-v0.39.7}"
NVM_DIR="$TOOLS_DIR/node-nvm"

info() {
  printf '\033[1;34m[info]\033[0m %s\n' "$*"
}

err() {
  printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2
  exit 1
}

mkdir -p "$TOOLS_DIR"

if ! command -v curl >/dev/null 2>&1; then
  err "curl es necesario para descargar NVM."
fi

if [ ! -d "$NVM_DIR" ] || [ ! -s "$NVM_DIR/nvm.sh" ]; then
  info "Instalando NVM en $NVM_DIR..."
  mkdir -p "$NVM_DIR"
  export NVM_DIR
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_INSTALL_VERSION/install.sh" | bash
else
  info "NVM ya existe en $NVM_DIR, actualizando..."
  export NVM_DIR
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_INSTALL_VERSION/install.sh" | bash
fi

# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"
if [ -s "$NVM_DIR/bash_completion" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/bash_completion"
fi

if ! nvm ls "$NODE_VERSION" >/dev/null 2>&1; then
  info "Instalando Node.js v$NODE_VERSION..."
  nvm install "$NODE_VERSION"
fi

info "Usando Node.js v$NODE_VERSION"
nvm use "$NODE_VERSION"

info "Ejecutando scripts/run-local-setup.sh..."
NODE_VERSION="$NODE_VERSION" "$PROJECT_ROOT/scripts/run-local-setup.sh"
