# 🦶 CuidarX — Prontuário Podológico & Portal do Paciente

[![GitHub Repo](https://img.shields.io/badge/GitHub-Zsubzeroz%2FCuidarX-181717?style=flat&logo=github)](https://github.com/Zsubzeroz/CuidarX)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)

**CuidarX** é uma aplicação web moderna e responsiva projetada especificamente para consultórios e clínicas de podologia. O sistema integra um prontuário clínico detalhado com anamnese, acompanhamento de sessões e galeria de fotos, além de uma **Área do Cliente** exclusiva para o paciente acompanhar sua evolução podológica.

- 🌐 **Repositório:** [https://github.com/Zsubzeroz/CuidarX](https://github.com/Zsubzeroz/CuidarX)
- 📱 **Portal do Cliente:** [https://cuidarx-20052026.web.app/cliente](https://cuidarx-20052026.web.app/cliente)

---

## 📸 Principais Funcionalidades

### 🩺 1. Painel Clínico da Podóloga
- **Prontuário e Ficha do Paciente:** Cadastro completo, anamnese, diagnósticos (onicocriptose, calosidades, verrugas plantares, etc.) e dados de contato.
- **Linha do Tempo de Tratamento:** Registro cronológico de sessões, procedimentos aplicados e curativos.
- **Evolução Fotográfica com Comparador:** Registro fotográfico de *Antes*, *Depois* e *Progresso* para acompanhamento clínico.
- **Agenda & Triagem:** Visualização dos agendamentos diários com status de atendimento.
- **Compartilhamento Rápido:** Geração de QR Code e mensagens formatadas para WhatsApp direcionando o paciente ao seu prontuário digital.
- **Modo Responsivo Completo:** Interface adaptada para computadores, tablets e smartphones (com alternador de simulação móvel).

### 🤳 2. Portal do Paciente (`/cliente`)
- **Comparador Fotográfico Interativo (Antes x Depois):** Controle deslizante que permite ao paciente visualizar a regeneração da lâmina ungueal ou tecido.
- **Próximas Consultas:** Detalhes de dia, horário e confirmação de presença.
- **Orientações Pós-Consulta (*Home Care*):** Recomendações personalizadas para assepsia, secagem, corte adequado e troca de curativos.
- **Canais de Emergência:** Contato direto via WhatsApp e chamada telefônica para a clínica.

---

## 🛠️ Tecnologias Utilizadas

- **Interface & Interação:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização & Design System:** [Tailwind CSS 4](https://tailwindcss.com/), tipografia editorial (Fraunces + Inter)
- **Ícones & Animações:** [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Nuvem & Banco de Dados:** [Firebase SDK](https://firebase.google.com/) (Cloud Firestore em tempo real, Firebase Auth e Analytics)
- **Segurança:** Regras de segurança estruturadas (`firestore.rules`) e especificação de entidades (`firebase-blueprint.json`)

---

## 📁 Estrutura do Projeto

```text
cuidarx/
├── src/
│   ├── components/            # Componentes modulares
│   │   ├── AgendaTab.tsx       # Controle de agendamentos diários
│   │   ├── ClientPortal.tsx    # Portal exclusivo do paciente (/cliente)
│   │   ├── ClientShareModal.tsx# Compartilhamento via QR Code e WhatsApp
│   │   ├── DetailScreen.tsx    # Prontuário detalhado e linha do tempo
│   │   ├── NewPatientModal.tsx # Cadastro de novos pacientes
│   │   ├── NewSessionModal.tsx # Registro de nova sessão e fotos
│   │   ├── PatientCard.tsx     # Cartão resumido na lista clínica
│   │   ├── PhotoInspectionModal.tsx # Galeria de evolução
│   │   ├── ProfileTab.tsx      # Configurações do profissional
│   │   └── RecordsTab.tsx      # Listagem e filtragem de fichas
│   ├── data/                  # Dados iniciais e mocks de demonstração
│   ├── firebase.ts            # Inicialização e persistência no Firebase
│   ├── types.ts               # Tipagens TypeScript compartilhadas
│   ├── App.tsx                # Roteador principal e layout responsivo
│   └── main.tsx               # Ponto de entrada React
├── firebase-blueprint.json    # Esquema intermediário de coleções Firestore
├── firestore.rules            # Regras de segurança do Firestore
└── package.json               # Dependências e scripts
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- `npm` ou `yarn`

### Passo a passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/Zsubzeroz/CuidarX.git
   cd CuidarX
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Executar em ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acessar a aplicação no navegador:**
   - **Painel Clínico:** [http://localhost:3000/](http://localhost:3000/)
   - **Área do Paciente:** [http://localhost:3000/cliente](http://localhost:3000/cliente)

---

## ☁️ Configuração do Firebase

O projeto está conectado ao Firebase sob o ID **`cuidarx-20052026`**:
- **Firestore Database:** Armazena as fichas clínicas (`patients/{patientId}`) e sessões de tratamento.
- **Regras de Segurança:** Configuradas no arquivo `firestore.rules`.

---

## 📄 Licença
Este projeto está sob a licença MIT.
