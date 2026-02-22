#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# AskFlow FAQ Platform — Interactive Installer
# ---------------------------------------------------------------------------

# ── Color variables ────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Resolve working directory to the location of this script ───────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Track the PORT so the final message can reference it
ASKFLOW_PORT="3001"

# ===========================================================================
# Banner
# ===========================================================================
banner() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "  ┌─────────────────────────────────────┐"
    echo "  │                                     │"
    echo "  │       █████╗ ███████╗██╗  ██╗       │"
    echo "  │      ██╔══██╗██╔════╝██║ ██╔╝       │"
    echo "  │      ███████║███████╗█████╔╝        │"
    echo "  │      ██╔══██║╚════██║██╔═██╗        │"
    echo "  │      ██║  ██║███████║██║  ██╗       │"
    echo "  │      ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝       │"
    echo "  │         ███████╗██╗      ██████╗     │"
    echo "  │         ██╔════╝██║     ██╔═══██╗    │"
    echo "  │         █████╗  ██║     ██║   ██║    │"
    echo "  │         ██╔══╝  ██║     ██║   ██║    │"
    echo "  │         ██║     ███████╗╚██████╔╝    │"
    echo "  │         ╚═╝     ╚══════╝ ╚═════╝     │"
    echo "  │                                     │"
    echo "  │        FAQ Platform Installer        │"
    echo "  │                                     │"
    echo "  └─────────────────────────────────────┘"
    echo -e "${NC}"
}

# ===========================================================================
# Helpers
# ===========================================================================
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[ERROR]${NC} $*"; }

spinner() {
    local pid=$1
    local message="${2:-Working...}"
    local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    local i=0

    while kill -0 "$pid" 2>/dev/null; do
        printf "\r  ${CYAN}%s${NC} %s" "${frames[$i]}" "$message"
        i=$(( (i + 1) % ${#frames[@]} ))
        sleep 0.1
    done

    # Wait for the process and capture its exit status
    wait "$pid"
    local exit_code=$?
    printf "\r"
    return "$exit_code"
}

# ===========================================================================
# check_node — verify Node.js >= 18
# ===========================================================================
check_node() {
    info "Checking Node.js …"

    if ! command -v node &>/dev/null; then
        fail "Node.js is not installed."
        echo ""
        echo -e "  Install Node.js 18+ via ${BOLD}nvm${NC}:"
        echo ""
        echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        echo "    source ~/.bashrc"
        echo "    nvm install 18"
        echo ""
        exit 1
    fi

    local node_version
    node_version="$(node -v | sed 's/^v//')"
    local major
    major="$(echo "$node_version" | cut -d. -f1)"

    if [ "$major" -lt 18 ]; then
        fail "Node.js v${node_version} detected — version 18 or higher is required."
        echo ""
        echo -e "  Upgrade via ${BOLD}nvm${NC}:"
        echo ""
        echo "    nvm install 18"
        echo "    nvm use 18"
        echo ""
        exit 1
    fi

    success "Node.js v${node_version}"
}

# ===========================================================================
# check_git — verify git is available
# ===========================================================================
check_git() {
    info "Checking git …"

    if ! command -v git &>/dev/null; then
        fail "git is not installed."
        echo ""
        echo "  Install git with your package manager, e.g.:"
        echo ""
        echo "    sudo apt install git          # Debian / Ubuntu"
        echo "    sudo dnf install git          # Fedora"
        echo "    brew install git              # macOS"
        echo ""
        exit 1
    fi

    local git_version
    git_version="$(git --version | awk '{print $3}')"
    success "git ${git_version}"
}

# ===========================================================================
# install_deps — run npm install with spinner
# ===========================================================================
install_deps() {
    info "Installing dependencies …"

    npm install --loglevel=error > /tmp/askflow_npm_install.log 2>&1 &
    local pid=$!

    if spinner "$pid" "Running npm install …"; then
        success "Dependencies installed"
    else
        fail "npm install failed. See log below:"
        echo ""
        cat /tmp/askflow_npm_install.log
        exit 1
    fi
}

# ===========================================================================
# build_app — run npm run build
# ===========================================================================
build_app() {
    info "Building application …"

    npm run build > /tmp/askflow_npm_build.log 2>&1 &
    local pid=$!

    if spinner "$pid" "Running npm run build …"; then
        success "Build complete"
    else
        fail "Build failed. See log below:"
        echo ""
        cat /tmp/askflow_npm_build.log
        exit 1
    fi
}

# ===========================================================================
# setup_env — generate .env if it does not already exist
# ===========================================================================
setup_env() {
    info "Configuring environment …"

    if [ -f .env ]; then
        warn "Existing .env found, skipping..."
        # Read PORT from existing .env for the final message
        if grep -q '^PORT=' .env; then
            ASKFLOW_PORT="$(grep '^PORT=' .env | head -n1 | cut -d= -f2)"
        fi
        return
    fi

    # ── PORT ───────────────────────────────────────────────────────────────
    echo ""
    read -rp "  Enter application port [3001]: " user_port
    ASKFLOW_PORT="${user_port:-3001}"

    # ── JWT_SECRET ─────────────────────────────────────────────────────────
    local jwt_secret
    jwt_secret="$(openssl rand -hex 32)"

    # ── Write .env ─────────────────────────────────────────────────────────
    cat > .env <<EOF
PORT=${ASKFLOW_PORT}
JWT_SECRET=${jwt_secret}
DATABASE_PATH=./data/faq.db
EOF

    success ".env created (PORT=${ASKFLOW_PORT})"
}

# ===========================================================================
# create_dirs — ensure required directories exist
# ===========================================================================
create_dirs() {
    info "Creating directories …"
    mkdir -p data uploads
    success "data/ and uploads/ ready"
}

# ===========================================================================
# install_service — optionally install a systemd unit
# ===========================================================================
install_service() {
    echo ""
    read -rp "  Install systemd service? [y/N]: " answer
    case "${answer,,}" in
        y|yes) ;;
        *)
            info "Skipping systemd service installation."
            return
            ;;
    esac

    info "Creating systemd service …"

    local working_dir
    working_dir="$(pwd)"

    local node_path
    node_path="$(dirname "$(command -v node)")"

    sudo tee /etc/systemd/system/askflow.service > /dev/null <<EOF
[Unit]
Description=AskFlow FAQ Platform
After=network.target

[Service]
Type=simple
WorkingDirectory=${working_dir}
ExecStart=$(command -v npx) tsx server/index.ts
Environment=NODE_ENV=production
Environment=PATH=${node_path}:/usr/local/bin:/usr/bin:/bin
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable askflow.service
    sudo systemctl start askflow.service

    success "systemd service installed, enabled, and started"
}

# ===========================================================================
# Main flow
# ===========================================================================
main() {
    banner

    check_node
    check_git
    install_deps
    build_app
    setup_env
    create_dirs
    install_service

    # ── Success message ────────────────────────────────────────────────────
    echo ""
    echo -e "${GREEN}${BOLD}  ✓ AskFlow installation complete!${NC}"
    echo ""
    echo -e "  Open ${CYAN}${BOLD}http://localhost:${ASKFLOW_PORT}${NC} in your browser to complete setup."
    echo ""
}

main "$@"
