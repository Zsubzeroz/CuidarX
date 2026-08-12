#!/bin/bash
# =============================================================================
# install.sh - Instalador Rápido do Ambiente DevSecOps
# =============================================================================
# Execute: chmod +x install.sh && ./install.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

info()  { echo -e "${BLUE}ℹ️  $1${NC}"; }
ok()    { echo -e "${GREEN}✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()   { echo -e "${RED}❌ $1${NC}"; }
step()  { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}"; }

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   INSTALADOR: Ambiente DevSecOps (9Router + OpenCode)          ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"

# ============================================
# FASE 0: DEPENDÊNCIAS DO SISTEMA
# ============================================
step "FASE 0: Dependências do Sistema"
info "Atualizando apt..."
sudo apt update -qq && sudo apt install -y -qq \
  build-essential \
  curl \
  wget \
  git \
  jq \
  unzip \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release \
  python3 \
  python3-pip \
  python3-venv \
  python3-dev

ok "Dependências do sistema instaladas"

# ============================================
# FASE 1: ZSH + OH-MY-ZSH + STARSHIP
# ============================================
step "FASE 1: Shell (Zsh + Oh-My-Zsh + Starship)"

# Zsh
if ! command -v zsh &>/dev/null; then
  info "Instalando Zsh..."
  sudo apt install -y -qq zsh
  ok "Zsh instalado"
else
  ok "Zsh já instalado"
fi

# Oh-My-Zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
  info "Instalando Oh-My-Zsh..."
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
  ok "Oh-My-Zsh instalado"
else
  ok "Oh-My-Zsh já instalado"
fi

# Plugins Oh-My-Zsh
OMZ_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
[ ! -d "$OMZ_CUSTOM/plugins/zsh-autosuggestions" ] && \
  git clone -q https://github.com/zsh-users/zsh-autosuggestions "$OMZ_CUSTOM/plugins/zsh-autosuggestions"
[ ! -d "$OMZ_CUSTOM/plugins/zsh-syntax-highlighting" ] && \
  git clone -q https://github.com/zsh-users/zsh-syntax-highlighting "$OMZ_CUSTOM/plugins/zsh-syntax-highlighting"
[ ! -d "$OMZ_CUSTOM/plugins/zsh-completions" ] && \
  git clone -q https://github.com/zsh-users/zsh-completions "$OMZ_CUSTOM/plugins/zsh-completions"
ok "Plugins Oh-My-Zsh instalados"

# Starship
if ! command -v starship &>/dev/null; then
  info "Instalando Starship..."
  curl -fsSL https://starship.rs/install.sh | sh -s -- -y
  ok "Starship instalado"
else
  ok "Starship já instalado"
fi

# ============================================
# FASE 2: RUST + CLI MODERNOS
# ============================================
step "FASE 2: Rust + CLI Modernos"

# Rust
if ! command -v cargo &>/dev/null; then
  info "Instalando Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
  ok "Rust instalado"
else
  ok "Rust já instalado"
fi

info "Instalando CLI modernos (cargo)..."
cargo install --locked \
  bat \
  eza \
  fd-find \
  ripgrep \
  zoxide \
  tokei \
  delta \
  hyperfine \
  bat-extras 2>/dev/null || true

ok "CLI modernos instalados"

# ============================================
# FASE 3: PYTHON + PIPX + FERRAMENTAS
# ============================================
step "FASE 3: Python + Ferramentas Segurança"

# pipx
if ! command -v pipx &>/dev/null; then
  info "Instalando pipx..."
  pip3 install -q --user pipx
  pipx ensurepath
  ok "pipx instalado"
else
  ok "pipx já instalado"
fi

export PATH="$HOME/.local/bin:$PATH"

info "Instalando ferramentas de segurança..."
pipx install --force semgrep 2>/dev/null || pipx upgrade semgrep
pipx install --force bandit
pipx install --force detect-secrets
pipx install --force gitleaks
pipx install --force pre-commit
pipx install --force safety
pipx install --force mypy
pipx install --force ruff
pipx install --force black
pipx install --force cookiecutter
pipx install --force shell-gpt
pipx install --force hadolint-py 2>/dev/null || warn "hadolint-py pode não estar disponível"

# uv (fast pip)
if ! command -v uv &>/dev/null; then
  info "Instalando uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ok "uv instalado"
fi

ok "Ferramentas Python instaladas"

# ============================================
# FASE 4: NVM + NODE.JS
# ============================================
step "FASE 4: NVM + Node.js"

if [ ! -d "$HOME/.nvm" ]; then
  info "Instalando NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install --lts
  ok "NVM + Node.js instalados"
else
  ok "NVM já instalado"
fi

# ============================================
# FASE 5: GO
# ============================================
step "FASE 5: Go"

if ! command -v go &>/dev/null; then
  info "Instalando Go..."
  GO_VERSION="1.24.4"
  wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
  sudo tar -C /usr/local -xzf /tmp/go.tar.gz
  echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> "$HOME/.zshrc"
  export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
  ok "Go ${GO_VERSION} instalado"
else
  ok "Go já instalado"
fi

# ============================================
# FASE 6: DOCKER
# ============================================
step "FASE 6: Docker"

if ! command -v docker &>/dev/null; then
  info "Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  ok "Docker instalado (faça logout/login para usar sem sudo)"
else
  ok "Docker já instalado"
fi

# ============================================
# FASE 7: OLLAMA + MODELOS
# ============================================
step "FASE 7: Ollama + Modelos de IA Local"

if ! command -v ollama &>/dev/null; then
  info "Instalando Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
  ok "Ollama instalado"
else
  ok "Ollama já instalado"
fi

# Iniciar Ollama em background se não estiver rodando
if ! curl -s --max-time 3 "http://127.0.0.1:11434/api/tags" &>/dev/null; then
  info "Iniciando Ollama server..."
  ollama serve &>/dev/null &
  sleep 3
fi

if curl -s --max-time 3 "http://127.0.0.1:11434/api/tags" &>/dev/null; then
  ok "Ollama server online"
  info "Baixando modelo qwen2.5-coder:7b (pode demorar)..."
  ollama pull qwen2.5-coder:7b
  ok "Modelo qwen2.5-coder:7b baixado"
else
  warn "Ollama offline - inicie manualmente com: ollama serve"
fi

# ============================================
# FASE 8: CONFIGURAÇÃO DE ARQUIVOS
# ============================================
step "FASE 8: Aplicando Configurações"

SETUP_DIR="$(cd "$(dirname "$0")" && pwd)"

# opencode.json
mkdir -p "$HOME/.config/opencode"
cp "$SETUP_DIR/opencode.json" "$HOME/.config/opencode/opencode.json"
ok "opencode.json configurado"

# starship.toml
mkdir -p "$HOME/.config"
cp "$SETUP_DIR/starship.toml" "$HOME/.config/starship.toml"
ok "starship.toml configurado"

# .pre-commit-config.yaml (para projetos)
cp "$SETUP_DIR/.pre-commit-config.yaml" "$HOME/.pre-commit-config.yaml"
ok ".pre-commit-config.yaml configurado"

# .env.local (template)
if [ ! -f "$HOME/.env.local" ]; then
  cp "$SETUP_DIR/.env.local.template" "$HOME/.env.local"
  ok ".env.local criado (edite com suas API keys)"
else
  warn ".env.local já existe - não sobrescrevendo"
fi

# .zshrc additions (append)
ZSHRC_ADDITIONS="$SETUP_DIR/zshrc-devsecops"
if [ -f "$ZSHRC_ADDITIONS" ]; then
  # Backup do .zshrc atual
  cp "$HOME/.zshrc" "$HOME/.zshrc.bak.$(date +%s)" 2>/dev/null || true
  echo "" >> "$HOME/.zshrc"
  echo "# ===== DEVSECOPS AMBIENTE (adicionado por install.sh) =====" >> "$HOME/.zshrc"
  cat "$ZSHRC_ADDITIONS" >> "$HOME/.zshrc"
  ok ".zshrc atualizado (backup salvo)"
fi

# ============================================
# FASE 9: GIT CONFIG
# ============================================
step "FASE 9: Git Config"

# Pre-commit hooks globais
if command -v pre-commit &>/dev/null; then
  info "Configurando pre-commit hooks globais..."
  pre-commit install --install-hooks 2>/dev/null || true
  ok "Pre-commit hooks instalados"
fi

# Git config mínimo (só se não existir)
if [ -z "$(git config --global user.name 2>/dev/null)" ]; then
  warn "Configure seu nome git: git config --global user.name 'Seu Nome'"
fi
if [ -z "$(git config --global user.email 2>/dev/null)" ]; then
  warn "Configure seu email git: git config --global user.email 'seu@email.com'"
fi

# ============================================
# FASE 10: VALIDAÇÃO FINAL
# ============================================
step "FASE 10: Validação Final"

if [ -f "$SETUP_DIR/validate-env.sh" ]; then
  chmod +x "$SETUP_DIR/validate-env.sh"
  echo ""
  echo -e "${BOLD}Executando validação...${NC}"
  echo ""
  "$SETUP_DIR/validate-env.sh"
fi

# ============================================
# RESUMO
# ============================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                    INSTALAÇÃO COMPLETA!                         ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Próximos passos:${NC}"
echo -e "  1. ${CYAN}Faça logout/login${NC} para Docker funcionar sem sudo"
echo -e "  2. ${CYAN}source ~/.zshrc${NC} para ativar o novo ambiente"
echo -e "  3. ${CYAN}edite ~/.env.local${NC} com suas API keys (Groq, Gemini, OpenRouter)"
echo -e "  4. ${CYAN}cd seu-projeto && pre-commit install${NC} para ativar hooks"
echo -e "  5. ${CYAN}validate-env.sh${NC} para verificar tudo novamente"
echo ""
echo -e "${BOLD}Aliases disponíveis:${NC}"
echo -e "  ${CYAN}oficina${NC}          - Abre 9Router + OpenCode"
echo -e "  ${CYAN}sec-scan${NC}         - Scan completo (Semgrep + Trivy + Gitleaks)"
echo -e "  ${CYAN}sec-full${NC}         - Scan + Bandit + deps check"
echo -e "  ${CYAN}gcs 'msg'${NC}        - Git commit seguro (com pre-commit)"
echo -e "  ${CYAN}newproject name${NC}  - Cria projeto seguro com scaffolding"
echo -e "  ${CYAN}quick-scan${NC}       - Scan rápido de segurança"
echo ""
echo -e "${GREEN}🚀 Ambiente DevSecOps pronto!${NC}"
