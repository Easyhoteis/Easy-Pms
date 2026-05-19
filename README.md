# Easy PMS v4

Sistema de gestão hoteleira (Property Management System) desenvolvido para clientes da Easy Hotéis.

## Stack

- React 18 + Vite 5
- Recharts (gráficos)
- CSS-in-JS (inline styles)
- Plus Jakarta Sans + Material Symbols

## Módulos

- **Dashboard** — Visão geral com gráficos de ocupação e receita
- **Reservas** — Calendário mensal com detalhes por dia
- **Quartos** — Gestão de status, check-in/out, mapa de camas
- **Hóspedes** — Busca e gestão de pagamentos
- **Governança** — Kanban de limpeza com checklist de 7 itens
- **Financeiro** — Receitas, despesas, gráficos por método/categoria
- **Relatórios** — 13 KPIs, gráficos de nacionalidade e ocupação
- **Auditoria** — Timeline completa com filtros e busca
- **Configurações** — Hotel, operação, usuários, notificações

## Executar

```bash
npm install
npm run dev
```

## Deploy

Faz build e sobe na Vercel:

```bash
npm run build
```

Build output fica em `dist/`.

## Estrutura

```
src/
├── App.jsx              # Páginas e componentes
├── main.jsx             # Entry point
├── data/seedData.js     # Dados de demonstração
├── hooks/useAppReducer  # Estado global (useReducer)
├── styles/              # Tema e CSS global
└── utils/               # Constantes, formatação, helpers
```
