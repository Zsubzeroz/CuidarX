# CuidarX - Sistema de Gestao Clinica

Sistema multiplataforma (Web, Mobile e Tablet) para gestao completa de clinica de podologia.

Sistema SaaS de gestao clinica multi-tenant — gestao de agendamentos, fichas de anamnese com assinatura digital, financeiro, e sincronizacao em tempo real com Google Agenda.

## Funcionalidades

- **Agenda em tempo real** — sincronizacao instantanea entre Painel Web, App Mobile/Tablet e Google Agenda
- **Bloqueio de horarios** — almoço, faxina clinica, ferias, feriados (recorrencia semanal e datas especificas)
- **Fichas de anamnese** — formulario completo com suporte a caneta stylus (tablet) e assinatura digital
- **Mapa podal** — mapeamento interativo de patologias nos pes (SVG)
- **Portal de agendamento online** — pagina publica para clientes agendarem sozinhos
- **Controle financeiro** — caixa, categorias, analise de fluxo mensal/anual
- **Produtos e servicos** — catalogo com precos e duracao
- **Assistente clinico IA** — integracao com Google Gemini para anotacoes e sugestoes
- **Google Agenda** — sincronizacao bidirecional via OAuth2

## Arquitetura

```
               ┌────────────────────────┐
               │    GOOGLE AGENDA       │
               └───────────┬────────────┘
                           │
             ┌             │             ┌
             │             ▼             │
┌────────────┴───────────┐     ┌─────────┴──────────────┐
│  PAINEL WEB ADMIN /    │ ◄─► │   APP MOBILE / TABLET  │
│  SITE DO CLIENTE       │     │   (Capacitor Android)  │
└────────────────────────┘     └────────────────────────┘
         │                               │
         └───────────┬───────────────────┘
                     ▼
            Firebase Firestore
            (banco de dados)
```

O **mesmo codigo-fonte** (React + TypeScript) alimenta todas as plataformas:
- **Web**: deploy automatico via Firebase Hosting
- **Mobile/Tablet**: compilado via Capacitor para Android (APK)
- **Dados**: Firebase Firestore com listeners `onSnapshot` (tempo real)

## Colecoes Firestore

| Colecao | Descricao |
|---------|-----------|
| `patients` | Prontuarios de clientes |
| `appointments` | Agendamentos (data YYYY-MM-DD, hora HH:MM) |
| `finances` | Registros financeiros (entradas/saidas) |
| `services` | Catalogo de produtos e servicos |
| `appData/blockedDays` | Bloqueios de horarios (compativel com Painel Web Admin) |

## Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 6 |
| Mobile | Capacitor 8 (Android) |
| Backend/DB | Firebase Firestore (realtime) |
| Hosting | Firebase Hosting |
| IA | Google Gemini (Assistente Clinico) |
| Calendar | Google Calendar API (OAuth2) |
| Icons | Lucide React |

## Pre-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm ou yarn
- Android Studio + SDK (para gerar APK)
- Java 17 (JDK)

## Instalacao

```bash
# Clonar o repositorio
git clone https://github.com/Zsubzeroz/cuidarx.git
cd cuidarx

# Instalar dependencias
npm install
```

## Execucao Local

```bash
# Criar arquivo .env com suas credenciais Firebase
cp .env.example .env
# Edite .env com suas chaves

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` no navegador.

### Variaveis de Ambiente (.env)

```env
# Firebase (necessario)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

# Firebase Client-side (VITE_*)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Google Calendar (opcional)
VITE_GOOGLE_CALENDAR_CLIENT_ID=...

# Gemini AI (opcional)
GEMINI_API_KEY=...
VITE_GEMINI_API_KEY=...
```

## Build para Producao

```bash
# Build estatico (para Firebase Hosting)
npm run build:static

# Deploy para Firebase Hosting
firebase deploy --only hosting
```

## Gerar APK Android

```bash
# Sincronizar assets web com projeto Android
npx cap sync android

# IMPORTANTE: Apos cap sync, corrigir Java version em:
#   android/app/capacitor.build.gradle
#   Alterar VERSION_21 para VERSION_17 (compatibilidade com JDK 17)

# Gerar APK debug
ANDROID_HOME=$ANDROID_HOME JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
  ./gradlew assembleDebug

# Instalar em dispositivo conectado via USB
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

O APK gerado esta em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Estrutura do Projeto

```
cuidarx/
├── src/
│   ├── components/
│   │   ├── CalendarView.tsx      # Agenda diaria com bloqueios
│   │   ├── PatientView.tsx       # Cadastro de clientes
│   │   ├── AnamneseView.tsx      # Fichas de anamnese + assinatura
│   │   ├── FinanceView.tsx       # Controle financeiro
│   │   ├── ServicesView.tsx      # Catalogo de servicos
│   │   ├── AiAssistantView.tsx   # Assistente IA (Gemini)
│   │   ├── BookingPortalView.tsx # Portal publico de agendamento
│   │   ├── DashboardView.tsx     # Painel inicial
│   │   └── FootMap.tsx           # Mapa podal SVG interativo
│   ├── hooks/
│   │   ├── useRealtimeData.ts    # Listeners Firestore (5 colecoes)
│   │   └── useResponsive.ts      # Detecao responsiva
│   ├── services/
│   │   ├── firebase.ts           # Config Firebase client
│   │   ├── firestoreService.ts   # CRUD Firestore + blockedDays
│   │   └── googleCalendar.ts     # Integracao Google Calendar API
│   ├── types.ts                  # Interfaces TypeScript
│   ├── App.tsx                   # Shell principal + auto-sync Calendar
│   └── main.tsx                  # Entry point
├── android/                      # Projeto Capacitor Android
├── firebase-server.ts            # Server-side Firestore
├── server.ts                     # Express server (dev)
├── .env                          # Credenciais (nao versionado)
└── package.json
```

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build:static` | Build estatico para hosting |
| `npm run lint` | Verificacao TypeScript |
| `npx cap sync android` | Sincronizar web assets com Android |

## Licenca

Projeto privado — CuidarX. Todos os direitos reservados. Desenvolvido por Luan Estifer Rodrigues Pereira (Software Engineer).
