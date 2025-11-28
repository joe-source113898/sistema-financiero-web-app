#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

info() {
  printf '\033[1;34m[info]\033[0m %s\n' "$*"
}

warn() {
  printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2
}

err() {
  printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2
  exit 1
}

# helper to check npm script existence
has_package_script() {
  local script_name="$1"
  if ! [ -f package.json ]; then
    return 1
  fi
  node - "$script_name" <<'NODE'
const fs = require('fs')
const script = process.argv[1]
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, script)) {
    process.exit(0)
  }
} catch (error) {
  process.exit(1)
}
process.exit(1)
NODE
}

# --- Load NVM if available ---------------------------------------------------
load_nvm() {
  local project_nvm_dir="$PROJECT_ROOT/node-nvm-tools"
  local tools_nvm_dir="$PROJECT_ROOT/tools/node-nvm"
  local global_nvm_dir="${NVM_DIR:-}"

  if [ -n "$global_nvm_dir" ] && [ -d "$global_nvm_dir" ] && [ -s "$global_nvm_dir/nvm.sh" ]; then
    # Already configured globally.
    # shellcheck disable=SC1090
    . "$global_nvm_dir/nvm.sh"
    return 0
  fi

  for dir in "$tools_nvm_dir" "$project_nvm_dir"; do
    if [ -d "$dir" ] && [ -s "$dir/nvm.sh" ]; then
      export NVM_DIR="$dir"
      # shellcheck disable=SC1090
      . "$NVM_DIR/nvm.sh"
      if [ -s "$NVM_DIR/bash_completion" ]; then
        # shellcheck disable=SC1091
        . "$NVM_DIR/bash_completion"
      fi
      info "Loaded NVM from $NVM_DIR"
      return 0
    fi
  done

  if [ -d "$project_nvm_dir" ] && [ -s "$project_nvm_dir/nvm.sh" ]; then
    export NVM_DIR="$project_nvm_dir"
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    if [ -s "$NVM_DIR/bash_completion" ]; then
      # shellcheck disable=SC1091
      . "$NVM_DIR/bash_completion"
    fi
    info "Loaded NVM from $NVM_DIR"
    return 0
  fi

  warn "NVM not found. Skipping automatic Node version management."
  return 1
}

NODE_VERSION="${NODE_VERSION:-20}"

if load_nvm; then
  if ! nvm ls "$NODE_VERSION" >/dev/null 2>&1; then
    info "Installing Node.js v$NODE_VERSION via nvm..."
    nvm install "$NODE_VERSION"
  fi
  info "Using Node.js v$NODE_VERSION"
  nvm use "$NODE_VERSION"
else
  if ! command -v node >/dev/null 2>&1; then
    err "Node.js is required. Install it or configure NVM before re-running."
  fi
fi

# --- Install dependencies & lint ---------------------------------------------
if [ -f package-lock.json ]; then
  PACKAGE_MANAGER=${PACKAGE_MANAGER:-npm}
else
  PACKAGE_MANAGER=${PACKAGE_MANAGER:-pnpm}
fi

info "Installing dependencies with $PACKAGE_MANAGER..."
case "$PACKAGE_MANAGER" in
  npm) npm install ;;
  pnpm)
    if ! command -v pnpm >/dev/null 2>&1; then
      err "pnpm is not installed. Install it or set PACKAGE_MANAGER=npm."
    fi
    pnpm install
    ;;
  *)
    err "Unsupported PACKAGE_MANAGER: $PACKAGE_MANAGER"
    ;;
esac

if has_package_script "lint"; then
  info "Running lint checks..."
  if [ "$PACKAGE_MANAGER" = "npm" ]; then
    npm run lint
  else
    pnpm lint
  fi
else
  warn "No lint script defined in package.json; skipping lint step."
fi

# --- Supabase automation -----------------------------------------------------
if ! command -v supabase >/dev/null 2>&1; then
  warn "Supabase CLI not found. Skipping supabase start/migration."
  warn "Install with: brew install supabase/tap/supabase"
  exit 0
fi

# Start Supabase only if not running
if ! supabase status >/dev/null 2>&1; then
  info "Starting Supabase local stack..."
  supabase start
else
  info "Supabase stack already running."
fi

info "Applying migrations..."
supabase migration up

info "All checks completed successfully."
