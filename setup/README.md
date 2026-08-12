# Setup: Ambiente DevSecOps Gratuito (9Router + OpenCode)

> **Stack:** Zsh + Starship + OpenCode + 9Router + VSCodium + Docker + Ollama

## Arquivos

| Arquivo | Destino | Descrição |
|---------|---------|-----------|
| `install.sh` | `./install.sh` | Instalador completo (executa tudo) |
| `opencode.json` | `~/.config/opencode/opencode.json` | Config OpenCode multi-provider |
| `.pre-commit-config.yaml` | `~/` (por projeto) | Hooks pre-commit DevSecOps |
| `zshrc-devsecops` | Append ao `~/.zshrc` | Aliases, funções, Starship |
| `starship.toml` | `~/.config/starship.toml` | Prompt Starship (Catppuccin Mocha) |
| `.env.local.template` | `~/.env.local` | Template API keys |
| `validate-env.sh` | Qualquer lugar | Valida ambiente instalado |

## Instalação Rápida

```bash
cd setup/
chmod +x install.sh
./install.sh
```

## Instalação Manual

```bash
# 1. Copiar configurações
cp opencode.json ~/.config/opencode/opencode.json
cp starship.toml ~/.config/starship.toml
cp .pre-commit-config.yaml ~/
cp .env.local.template ~/.env.local  # Editar depois

# 2. Adicionar ao .zshrc
cat zshrc-devsecops >> ~/.zshrc
source ~/.zshrc

# 3. Instalar ferramentas ( Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
curl -fsSL https://ollama.com/install.sh | sh
curl -fsSL https://starship.rs/install.sh | sh -s -- -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 4. Validar
./validate-env.sh
```

## APIs Gratuitas (obter chaves)

| Provedor | URL | Limite Free |
|----------|-----|-------------|
| Groq | console.groq.com | 14.400 req/dia |
| Gemini | aistudio.google.com | 1.500 req/dia |
| OpenRouter | openrouter.ai | Varies (muitos grátis) |

## Aliases Principais

| Alias | Comando |
|-------|---------|
| `oficina` | Abre 9Router + OpenCode |
| `sec-scan` | Semgrep + Trivy + Gitleaks |
| `sec-full` | Scan completo + Bandit |
| `gcs 'msg'` | Git commit seguro |
| `newproject name` | Cria projeto novo |
| `quick-scan` | Scan rápido |
| `dk-scan image` | Scannea Docker image |
| `bat` | cat moderno |
| `eza` | ls moderno |
| `fd` | find moderno |
| `rg` | grep moderno |
| `z dir` | cd inteligente |
