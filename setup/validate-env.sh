#!/bin/bash
# =============================================================================
# validate-env.sh - Validação do Ambiente DevSecOps (9Router + OpenCode)
# =============================================================================
# Execute: chmod +x validate-env.sh && ./validate-env.sh
# =============================================================================

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Contadores
PASS=0
FAIL=0
WARN=0

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================
check_cmd() {
  local cmd=$1
  local name=${2:-$1}
  if command -v "$cmd" &>/dev/null; then
    local ver
    ver=$($cmd --version 2>/dev/null | head -1 | grep -oP '[\d.]+' | head -1)
    echo -e "  ${GREEN}✅${NC} $name ${CYAN}${ver:-instalado}${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}❌${NC} $name ${RED}NÃO encontrado${NC}"
    ((FAIL++))
  fi
}

check_service() {
  local name=$1
  local url=$2
  if curl -s --max-time 3 "$url" &>/dev/null; then
    echo -e "  ${GREEN}✅${NC} $name ${CYAN}online${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}❌${NC} $name ${RED}offline${NC}"
    ((FAIL++))
  fi
}

check_env() {
  local var=$1
  local name=${2:-$var}
  if [ -n "${!var:-}" ]; then
    echo -e "  ${GREEN}✅${NC} $name ${CYAN}configurado${NC}"
    ((PASS++))
  else
    echo -e "  ${YELLOW}⚠️${NC} $name ${YELLOW}não configurado (opcional)${NC}"
    ((WARN++))
  fi
}

section() {
  echo ""
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================
# INÍCIO DA VALIDAÇÃO
# ============================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   VALIDAÇÃO DO AMBIENTE DEVSECOPS - 9Router + OpenCode         ║${NC}"
echo -e "${BOLD}${CYAN}║   $(date '+%Y-%m-%d %H:%M:%S')                                         ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"

# ============================================
# 1. SISTEMA OPERACIONAL
# ============================================
section "1. SISTEMA OPERACIONAL"
echo -e "  ${BOLD}Kernel:${NC} $(uname -r)"
echo -e "  ${BOLD}Distro:${NC} $(lsb_release -ds 2>/dev/null || cat /etc/os-release 2>/dev/null | grep PRETTY | cut -d'"' -f2 || echo 'Desconhecido')"
echo -e "  ${BOLD}RAM:${NC} $(free -h | awk '/Mem:/ {print $2}')"
echo -e "  ${BOLD}CPU:${NC} $(nproc) cores"
echo -e "  ${BOLD}Disk:${NC} $(df -h / | awk 'NR==2{print $4}') livre"

# ============================================
# 2. FERRAMENTAS CORE (Shell/Editor)
# ============================================
section "2. FERRAMENTAS CORE"
check_cmd "zsh" "Zsh"
check_cmd "starship" "Starship Prompt"
check_cmd "git" "Git"
check_cmd "curl" "cURL"
check_cmd "jq" "jq (JSON parser)"
check_cmd "direnv" "direnv"

# Oh-My-Zsh
if [ -d "$HOME/.oh-my-zsh" ]; then
  echo -e "  ${GREEN}✅${NC} Oh-My-Zsh ${CYAN}instalado${NC}"
  ((PASS++))
else
  echo -e "  ${RED}❌${NC} Oh-My-Zsh ${RED}não encontrado${NC}"
  ((FAIL++))
fi

# VSCodium/Codium
for editor in codium vscodium code; do
  if command -v "$editor" &>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Editor: ${CYAN}$editor${NC}"
    ((PASS++))
    break
  fi
done

# ============================================
# 3. 9ROUTER & OPENCODE
# ============================================
section "3. 9ROUTER & OPENCODE"
check_cmd "opencode" "OpenCode CLI"
check_service "9Router" "http://127.0.0.1:20128/v1/models"

# Verificar modelos disponíveis
if curl -s --max-time 5 "http://127.0.0.1:20128/v1/models" | jq -e '.data | length > 0' &>/dev/null; then
  local model_count
  model_count=$(curl -s "http://127.0.0.1:20128/v1/models" | jq '.data | length')
  echo -e "  ${GREEN}✅${NC} Modelos disponíveis: ${CYAN}$model_count${NC}"
  ((PASS++))
else
  echo -e "  ${RED}❌${NC} Nenhum modelo encontrado no 9Router"
  ((FAIL++))
fi

# ============================================
# 4. RUNTIME / LINGUAGENS
# ============================================
section "4. RUNTIME / LINGUAGENS"

# Python
check_cmd "python3" "Python 3"
check_cmd "pip3" "pip3"
check_cmd "pipx" "pipx"
check_cmd "uv" "uv (fast pip)"

# Node.js / NVM
if [ -d "$HOME/.nvm" ]; then
  echo -e "  ${GREEN}✅${NC} NVM ${CYAN}instalado${NC}"
  ((PASS++))
  check_cmd "node" "Node.js"
  check_cmd "npm" "npm"
  check_cmd "yarn" "yarn"
  check_cmd "pnpm" "pnpm"
else
  echo -e "  ${YELLOW}⚠️${NC} NVM ${YELLOW}não encontrado${NC}"
  ((WARN++))
fi

# Go
check_cmd "go" "Go"
if command -v go &>/dev/null; then
  echo -e "  ${GREEN}✅${NC} Go ${CYAN}$(go version | awk '{print $3}')${NC}"
  ((PASS++))
fi

# Rust
check_cmd "cargo" "Rust/Cargo"
if command -v rustup &>/dev/null; then
  echo -e "  ${GREEN}✅${NC} Rustup ${CYAN}$(rustc --version | awk '{print $2}')${NC}"
  ((PASS++))
fi

# ============================================
# 5. SEGURANÇA (CLI)
# ============================================
section "5. FERRAMENTAS DE SEGURANÇA"
check_cmd "semgrep" "Semgrep (SAST)"
check_cmd "trivy" "Trivy (Vulnerabilities)"
check_cmd "bandit" "Bandit (Python SAST)"
check_cmd "gitleaks" "Gitleaks (Secrets)"
check_cmd "detect-secrets" "detect-secrets"
check_cmd "pre-commit" "Pre-commit hooks"
check_cmd "syft" "Syft (SBOM)"
check_cmd "grype" "Grype (SBOM vuln)"
check_cmd "osv-scanner" "OSV Scanner"
check_cmd "shellcheck" "ShellCheck"
check_cmd "trivy" "Trivy (Container/IaC)"
check_cmd "hadolint" "Hadolint (Dockerfile)"
check_cmd "checkov" "Checkov (IaC)"

# ============================================
# 6. DOCKER
# ============================================
section "6. DOCKER"
check_cmd "docker" "Docker"
if command -v docker &>/dev/null; then
  # Verificar se Docker daemon está rodando
  if docker info &>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Docker Daemon ${CYAN}rodando${NC}"
    ((PASS++))
    echo -e "  ${BOLD}  Containers:${NC} $(docker ps -q | wc -l) rodando"
    echo -e "  ${BOLD}  Images:${NC} $(docker images -q | wc -l) instaladas"
  else
    echo -e "  ${RED}❌${NC} Docker Daemon ${RED}parado${NC}"
    ((FAIL++))
  fi
  check_cmd "docker compose" "Docker Compose"
fi

# ============================================
# 7. IA LOCAL (Ollama)
# ============================================
section "7. IA LOCAL (Ollama)"
check_cmd "ollama" "Ollama"
if command -v ollama &>/dev/null; then
  # Verificar se Ollama está rodando
  if curl -s --max-time 3 "http://127.0.0.1:11434/api/tags" &>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Ollama Server ${CYAN}online${NC}"
    ((PASS++))
    echo -e "  ${BOLD}  Modelos:${NC}"
    ollama list 2>/dev/null | head -10 | while read -r line; do
      echo -e "    ${CYAN}$line${NC}"
    done
  else
    echo -e "  ${YELLOW}⚠️${NC} Ollama ${YELLOW}instalado mas offline${NC}"
    ((WARN++))
  fi
fi

# ============================================
# 8. CLI MODERNOS
# ============================================
section "8. CLI MODERNOS"
check_cmd "bat" "bat (cat moderno)"
check_cmd "eza" "eza (ls moderno)"
check_cmd "fd" "fd (find moderno)"
check_cmd "rg" "ripgrep (grep moderno)"
check_cmd "zoxide" "zoxide (cd inteligente)"
check_cmd "btop" "btop (top moderno)"
check_cmd "fzf" "fzf (fuzzy finder)"
check_cmd "delta" "delta (git diff melhorado)"
check_cmd "hyperfine" "hyperfine (benchmark)"
check_cmd "tokei" "tokei (linhas de código)"
check_cmd "neovim" "Neovim (editor)"

# ============================================
# 9. VARIÁVEIS DE AMBIENTE
# ============================================
section "9. VARIÁVEIS DE AMBIENTE"
check_env "GROQ_API_KEY" "Groq API Key"
check_env "GEMINI_API_KEY" "Gemini API Key"
check_env "OPENROUTER_API_KEY" "OpenRouter API Key"
check_env "OLLAMA_HOST" "Ollama Host"

# ============================================
# 10. TESTE RÁPIDO DE IA
# ============================================
section "10. TESTE RÁPIDO DE IA"

# Testar 9Router
echo -e "  ${BOLD}Testando 9Router (opencode-combo)...${NC}"
response=$(curl -s --max-time 10 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-65bc34004df127e0-dhqpd9-c8a64072" \
  -d '{"model":"opencode-combo","messages":[{"role":"user","content":"Say OK in 1 word"}],"max_tokens":10}' \
  "http://127.0.0.1:20128/v1/chat/completions" 2>/dev/null)

if echo "$response" | jq -e '.choices[0].message.content' &>/dev/null; then
  echo -e "  ${GREEN}✅${NC} 9Router respondeu: ${CYAN}$(echo "$response" | jq -r '.choices[0].message.content')${NC}"
  ((PASS++))
else
  echo -e "  ${RED}❌${NC} 9Router não respondeu"
  ((FAIL++))
fi

# Testar Ollama (se disponível)
if curl -s --max-time 3 "http://127.0.0.1:11434/api/tags" &>/dev/null; then
  echo -e "  ${BOLD}Testando Ollama local...${NC}"
  ollama_response=$(curl -s --max-time 15 \
    -d '{"model":"qwen2.5-coder:7b","prompt":"Say OK","stream":false}' \
    "http://127.0.0.1:11434/api/generate" 2>/dev/null)
  if echo "$ollama_response" | jq -e '.response' &>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Ollama respondeu: ${CYAN}$(echo "$ollama_response" | jq -r '.response' | head -c 50)${NC}"
    ((PASS++))
  else
    echo -e "  ${YELLOW}⚠️${NC} Ollama não respondeu (modelo não baixado?)"
    ((WARN++))
  fi
fi

# ============================================
# 11. VERIFICAR ARQUIVOS DE CONFIGURAÇÃO
# ============================================
section "11. ARQUIVOS DE CONFIGURAÇÃO"

for file in \
  "$HOME/.config/opencode/opencode.json" \
  "$HOME/.pre-commit-config.yaml" \
  "$HOME/.config/starship.toml" \
  "$HOME/.gitconfig" \
  "$HOME/.env.local"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✅${NC} $(basename "$file") ${CYAN}$file${NC}"
    ((PASS++))
  else
    echo -e "  ${YELLOW}⚠️${NC} $(basename "$file") ${YELLOW}não encontrado${NC}"
    ((WARN++))
  fi
done

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                        RESUMO FINAL                             ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}✅ PASS:${NC} $PASS"
echo -e "  ${RED}❌ FAIL:${NC} $FAIL"
echo -e "  ${YELLOW}⚠️  WARN:${NC} $WARN"
echo ""

# Calcular porcentagem de sucesso
total=$((PASS + FAIL))
if [ $total -gt 0 ]; then
  pct=$((PASS * 100 / total))
  if [ $pct -ge 80 ]; then
    echo -e "  ${BOLD}${GREEN}🎯 AMBIENTE OPERACIONAL: $pct%${NC}"
    echo -e "  ${GREEN}Ambiente pronto para uso!${NC}"
  elif [ $pct -ge 50 ]; then
    echo -e "  ${BOLD}${YELLOW}⚠️  AMBIENTE PARCIAL: $pct%${NC}"
    echo -e "  ${YELLOW}Algumas ferramentas faltando - verificar acima${NC}"
  else
    echo -e "  ${BOLD}${RED}❌ AMBIENTE INCOMPLETO: $pct%${NC}"
    echo -e "  ${RED}Execute as instruções de instalação no guia${NC}"
  fi
fi

echo ""
echo -e "${BOLD}${BLUE}Próximos passos:${NC}"
echo -e "  1. Copie os arquivos de setup: ${CYAN}cp setup/* ~/ && source ~/.zshrc${NC}"
echo -e "  2. Instale ollama e o modelo: ${CYAN}ollama pull qwen2.5-coder:7b${NC}"
echo -e "  3. Execute: ${CYAN}pre-commit install${NC}"
echo -e "  4. Valide novamente: ${CYAN}./validate-env.sh${NC}"
echo ""
