/**
 * Easy PMS v4 — Sistema de Gestão Hoteleira
 * Desenvolvido para clientes Easy Hotéis
 *
 * Módulos: Dashboard, Reservas, Quartos, Hóspedes,
 * Governança, Financeiro, Relatórios, Auditoria, Configurações
 *
 * Stack: React 18 + Recharts + CSS-in-JS
 * Fontes: Plus Jakarta Sans, Material Symbols Rounded
 */

import { useState, useReducer, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

/* ══════════════════════════════════════════════════════
   EASY PMS v4 — Ultimate Hotel Property Management
   Complete SaaS system for Easy Hotéis clients
   10 modules: Dashboard, Reservas, Quartos, Hóspedes,
   Governança, Financeiro, Relatórios, Auditoria,
   Configurações, Perfil
   ══════════════════════════════════════════════════════ */

// ─── THEME ───
const C = {
  bg: '#f5f6fa',
  white: '#fff',
  primary: '#2563eb',
  primaryLight: '#eff4ff',
  primaryMid: '#bfdbfe',
  primaryDark: '#1d4ed8',
  accent: '#10b981',
  accentLight: '#ecfdf5',
  accentDark: '#059669',
  warn: '#f59e0b',
  warnLight: '#fffbeb',
  warnDark: '#b45309',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  purple: '#8b5cf6',
  purpleLight: '#f5f3ff',
  cyan: '#06b6d4',
  cyanLight: '#ecfeff',
  rose: '#f43f5e',
  roseLight: '#fff1f2',
  orange: '#f97316',
  orangeLight: '#fff7ed',
  text: '#1e293b',
  textSec: '#64748b',
  textDim: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  shadow: '0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)',
  shadowMd: '0 4px 12px rgba(0,0,0,.07)',
  shadowLg: '0 10px 30px rgba(0,0,0,.1)',
};
const STATUS = {
  available: { l: 'Disponível', c: C.accent, bg: C.accentLight, ic: 'check_circle' },
  occupied: { l: 'Ocupado', c: C.primary, bg: C.primaryLight, ic: 'hotel' },
  reserved: { l: 'Reservado', c: C.purple, bg: C.purpleLight, ic: 'event' },
  maintenance: { l: 'Manutenção', c: C.warn, bg: C.warnLight, ic: 'build' },
  cleaning: { l: 'Limpeza', c: C.cyan, bg: C.cyanLight, ic: 'cleaning_services' },
  checkout: { l: 'Check-out', c: C.rose, bg: C.roseLight, ic: 'logout' },
};
const TYPES = { suite: 'Suíte', standard: 'Standard', master: 'Master', shared: 'Compartilhado' };
const PAYMENTS = ['PIX', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Transferência', 'Cortesia'];
const HK_TASKS = [
  'Trocar roupas de cama',
  'Limpar banheiro',
  'Reabastecer frigobar',
  'Aspirar quarto',
  'Trocar toalhas',
  'Verificar AC',
  'Inspeção final',
];
const ROLES = {
  admin: { l: 'Administrador', perms: ['all'] },
  manager: { l: 'Gerente', perms: ['rooms', 'guests', 'housekeeping', 'financial', 'reports'] },
  receptionist: { l: 'Recepcionista', perms: ['rooms', 'guests', 'reservations'] },
  housekeeper: { l: 'Governança', perms: ['housekeeping'] },
};
const AUDIT_TYPES = {
  checkin: { l: 'Check-in', ic: 'login', c: C.accent },
  checkout: { l: 'Check-out', ic: 'logout', c: C.danger },
  payment: { l: 'Pagamento', ic: 'payments', c: C.warn },
  reservation: { l: 'Reserva', ic: 'event', c: C.primary },
  status: { l: 'Mudança Status', ic: 'sync', c: C.purple },
  housekeeping: { l: 'Governança', ic: 'cleaning_services', c: C.cyan },
  config: { l: 'Configuração', ic: 'settings', c: C.orange },
  user: { l: 'Usuário', ic: 'person', c: C.rose },
  room_add: { l: 'Quarto Criado', ic: 'add_circle', c: C.accent },
  expense: { l: 'Despesa', ic: 'receipt', c: C.danger },
  cancellation: { l: 'Cancelamento', ic: 'cancel', c: C.danger },
};

// ─── UTILS ───
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const td = () => new Date().toISOString().split('T')[0];
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtD = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—');
const fmtDT = () => new Date().toLocaleString('pt-BR');
const fmtTs = (ts) => ts || fmtDT();
const diffD = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 864e5));
const paid = (g) => (g.payments || []).reduce((s, p) => s + p.amount, 0);
const bal = (g) => g.total - paid(g);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function I({ name, size = 18, color = C.textSec, style: s }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{ fontSize: size, color, verticalAlign: 'middle', fontVariationSettings: "'FILL' 0,'wght' 400", ...s }}
    >
      {name}
    </span>
  );
}

// ─── SEED ───
const mkUsers = () => [
  {
    id: 'u1',
    name: 'Admin',
    email: 'admin@easyhoteis.com',
    role: 'admin',
    active: true,
    created: '2026-01-01',
    lastLogin: '19/05/2026 08:30',
    avatar: 'A',
  },
  {
    id: 'u2',
    name: 'Maria Silva',
    email: 'maria@hotel.com',
    role: 'receptionist',
    active: true,
    created: '2026-03-15',
    lastLogin: '19/05/2026 07:45',
    avatar: 'M',
  },
  {
    id: 'u3',
    name: 'João Santos',
    email: 'joao@hotel.com',
    role: 'housekeeper',
    active: true,
    created: '2026-04-01',
    lastLogin: '18/05/2026 14:20',
    avatar: 'J',
  },
  {
    id: 'u4',
    name: 'Ana Souza',
    email: 'ana@hotel.com',
    role: 'manager',
    active: false,
    created: '2026-02-10',
    lastLogin: '10/05/2026 09:00',
    avatar: 'A',
  },
];

const mkConfig = () => ({
  hotelName: 'Hotel Exemplo',
  hotelDoc: '12.345.678/0001-90',
  hotelPhone: '(21) 3456-7890',
  hotelEmail: 'contato@hotelexemplo.com',
  hotelAddress: 'Rua da Praia 100, Copacabana, RJ',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  taxRate: 5,
  lateFee: 50,
  autoHK: true,
  emailNotify: true,
  smsNotify: false,
});

const mkRooms = () => [
  {
    id: 'r1',
    name: 'Suíte 101',
    type: 'suite',
    floor: 1,
    cap: 2,
    price: 280,
    status: 'occupied',
    amenities: ['AC', 'TV 55"', 'Frigobar', 'Cofre', 'Wi-Fi'],
    guest: {
      id: 'g1',
      name: 'Mariana Oliveira',
      doc: '123.456.789-00',
      phone: '(21) 99876-5432',
      email: 'mariana@gmail.com',
      checkin: '2026-05-10',
      checkout: '2026-05-20',
      total: 2800,
      payments: [{ date: '2026-05-10', amount: 1400, method: 'PIX', ref: 'PIX-001' }],
      notes: 'Aniversário dia 14',
      nationality: 'Brasileira',
      address: 'Rua das Flores 123, RJ',
    },
  },
  {
    id: 'r2',
    name: 'Suíte 102',
    type: 'suite',
    floor: 1,
    cap: 2,
    price: 280,
    status: 'available',
    amenities: ['AC', 'TV 55"', 'Frigobar', 'Wi-Fi'],
    guest: null,
  },
  {
    id: 'r3',
    name: 'Master 201',
    type: 'master',
    floor: 2,
    cap: 2,
    price: 520,
    status: 'reserved',
    amenities: ['AC', 'TV 65"', 'Frigobar', 'Cofre', 'Jacuzzi', 'Varanda', 'Wi-Fi'],
    guest: {
      id: 'g2',
      name: 'Roberto Mendes',
      doc: '987.654.321-00',
      phone: '(11) 98765-4321',
      email: 'roberto@corp.com',
      checkin: '2026-05-20',
      checkout: '2026-05-25',
      total: 2600,
      payments: [{ date: '2026-05-12', amount: 1300, method: 'Cartão Crédito', ref: 'CC-042' }],
      notes: 'VIP — Aniversário de casamento',
      nationality: 'Brasileira',
      address: 'Av. Paulista 1000, SP',
    },
  },
  {
    id: 'r4',
    name: 'Standard 202',
    type: 'standard',
    floor: 2,
    cap: 2,
    price: 180,
    status: 'cleaning',
    amenities: ['AC', 'TV 43"', 'Wi-Fi'],
    guest: null,
  },
  {
    id: 'r5',
    name: 'Standard 203',
    type: 'standard',
    floor: 2,
    cap: 2,
    price: 180,
    status: 'occupied',
    amenities: ['AC', 'TV 43"', 'Wi-Fi'],
    guest: {
      id: 'g3',
      name: 'Ana Beatriz Costa',
      doc: '456.789.123-00',
      phone: '(21) 97654-3210',
      email: 'ana@email.com',
      checkin: '2026-05-16',
      checkout: '2026-05-19',
      total: 540,
      payments: [{ date: '2026-05-16', amount: 540, method: 'Dinheiro', ref: 'DIN-007' }],
      notes: '',
      nationality: 'Brasileira',
      address: '',
    },
  },
  {
    id: 'r6',
    name: 'Dorm Sol',
    type: 'shared',
    floor: 0,
    cap: 8,
    price: 75,
    status: 'occupied',
    amenities: ['AC', 'Armário', 'Luz leitura', 'Wi-Fi'],
    guest: null,
    beds: {
      total: 8,
      guests: [
        {
          id: 'bg1',
          name: 'Lucas Ferreira',
          doc: '111.222.333-44',
          phone: '(21) 91111-2222',
          email: 'lucas@gmail.com',
          bed: 1,
          checkin: '2026-05-14',
          checkout: '2026-05-20',
          total: 450,
          payments: [{ date: '2026-05-14', amount: 450, method: 'PIX', ref: 'PIX-020' }],
          nationality: 'Brasileira',
        },
        {
          id: 'bg2',
          name: 'Sophie Martin',
          doc: 'FR-12345',
          phone: '+33 6 12 34 56',
          email: 'sophie@mail.fr',
          bed: 3,
          checkin: '2026-05-15',
          checkout: '2026-05-22',
          total: 525,
          payments: [{ date: '2026-05-15', amount: 300, method: 'Cartão Débito', ref: 'CD-011' }],
          nationality: 'Francesa',
        },
        {
          id: 'bg3',
          name: 'James Wilson',
          doc: 'US-98765',
          phone: '+1 555-0123',
          email: 'james@mail.com',
          bed: 5,
          checkin: '2026-05-16',
          checkout: '2026-05-19',
          total: 225,
          payments: [{ date: '2026-05-16', amount: 225, method: 'Dinheiro', ref: 'DIN-008' }],
          nationality: 'Americana',
        },
      ],
    },
  },
  {
    id: 'r7',
    name: 'Dorm Lua',
    type: 'shared',
    floor: 0,
    cap: 6,
    price: 85,
    status: 'available',
    amenities: ['AC', 'Armário', 'Luz leitura', 'Wi-Fi'],
    guest: null,
    beds: { total: 6, guests: [] },
  },
  {
    id: 'r8',
    name: 'Suíte 301',
    type: 'suite',
    floor: 3,
    cap: 3,
    price: 350,
    status: 'maintenance',
    amenities: ['AC', 'TV 55"', 'Frigobar', 'Cofre', 'Wi-Fi'],
    guest: null,
  },
  {
    id: 'r9',
    name: 'Standard 302',
    type: 'standard',
    floor: 3,
    cap: 2,
    price: 190,
    status: 'available',
    amenities: ['AC', 'TV 43"', 'Frigobar', 'Wi-Fi'],
    guest: null,
  },
  {
    id: 'r10',
    name: 'Master 303',
    type: 'master',
    floor: 3,
    cap: 2,
    price: 480,
    status: 'occupied',
    amenities: ['AC', 'TV 65"', 'Frigobar', 'Cofre', 'Banheira', 'Wi-Fi'],
    guest: {
      id: 'g4',
      name: 'Fernando Almeida',
      doc: '321.654.987-00',
      phone: '(21) 93456-7890',
      email: 'fernando@empresa.com',
      checkin: '2026-05-08',
      checkout: '2026-05-19',
      total: 5280,
      payments: [
        { date: '2026-05-08', amount: 2400, method: 'Transferência', ref: 'TED-001' },
        { date: '2026-05-12', amount: 1500, method: 'PIX', ref: 'PIX-033' },
      ],
      notes: 'Viagem de negócios — NF',
      nationality: 'Brasileira',
      address: 'Rua Corporate 500, RJ',
    },
  },
  {
    id: 'r11',
    name: 'Standard 103',
    type: 'standard',
    floor: 1,
    cap: 2,
    price: 195,
    status: 'checkout',
    amenities: ['AC', 'TV 43"', 'Wi-Fi'],
    guest: null,
  },
  {
    id: 'r12',
    name: 'Suíte 304',
    type: 'suite',
    floor: 3,
    cap: 2,
    price: 320,
    status: 'available',
    amenities: ['AC', 'TV 55"', 'Frigobar', 'Cofre', 'Varanda', 'Wi-Fi'],
    guest: null,
  },
];

const mkHistory = () => [
  {
    id: 'h1',
    type: 'checkin',
    room: 'Suíte 101',
    guest: 'Mariana Oliveira',
    date: '10/05/2026 14:30',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h2',
    type: 'payment',
    room: 'Suíte 101',
    guest: 'Mariana Oliveira',
    date: '10/05/2026 14:32',
    user: 'Admin',
    amount: 1400,
    method: 'PIX',
    ip: '192.168.1.10',
  },
  {
    id: 'h3',
    type: 'reservation',
    room: 'Master 201',
    guest: 'Roberto Mendes',
    date: '07/05/2026 18:00',
    user: 'Maria Silva',
    ip: '192.168.1.12',
  },
  {
    id: 'h4',
    type: 'checkin',
    room: 'Master 303',
    guest: 'Fernando Almeida',
    date: '08/05/2026 16:00',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h5',
    type: 'payment',
    room: 'Master 303',
    guest: 'Fernando Almeida',
    date: '08/05/2026 16:05',
    user: 'Admin',
    amount: 2400,
    method: 'Transferência',
    ip: '192.168.1.10',
  },
  {
    id: 'h6',
    type: 'payment',
    room: 'Master 303',
    guest: 'Fernando Almeida',
    date: '12/05/2026 09:00',
    user: 'Maria Silva',
    amount: 1500,
    method: 'PIX',
    ip: '192.168.1.12',
  },
  {
    id: 'h7',
    type: 'checkin',
    room: 'Dorm Sol',
    guest: 'Lucas Ferreira (Cama 1)',
    date: '14/05/2026 15:30',
    user: 'Maria Silva',
    ip: '192.168.1.12',
  },
  {
    id: 'h8',
    type: 'checkin',
    room: 'Dorm Sol',
    guest: 'Sophie Martin (Cama 3)',
    date: '15/05/2026 16:00',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h9',
    type: 'checkin',
    room: 'Standard 203',
    guest: 'Ana Beatriz Costa',
    date: '16/05/2026 15:00',
    user: 'Maria Silva',
    ip: '192.168.1.12',
  },
  {
    id: 'h10',
    type: 'checkin',
    room: 'Dorm Sol',
    guest: 'James Wilson (Cama 5)',
    date: '16/05/2026 18:00',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h11',
    type: 'checkout',
    room: 'Standard 103',
    guest: 'Pedro Henrique',
    date: '16/05/2026 11:00',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h12',
    type: 'housekeeping',
    room: 'Standard 202',
    guest: 'Limpeza geral atribuída',
    date: '17/05/2026 08:00',
    user: 'João Santos',
    ip: '192.168.1.14',
  },
  {
    id: 'h13',
    type: 'config',
    room: '—',
    guest: 'Taxa ISS atualizada para 5%',
    date: '18/05/2026 10:00',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h14',
    type: 'user',
    room: '—',
    guest: 'Usuário Ana Souza desativado',
    date: '18/05/2026 10:30',
    user: 'Admin',
    ip: '192.168.1.10',
  },
  {
    id: 'h15',
    type: 'expense',
    room: '—',
    guest: 'Conta de luz - Maio (R$2.800)',
    date: '15/05/2026 09:00',
    user: 'Admin',
    ip: '192.168.1.10',
  },
];

const mkExpenses = () => [
  { id: 'e1', desc: 'Material de limpeza', cat: 'Limpeza', amount: 450, date: '2026-05-10', user: 'Admin' },
  { id: 'e2', desc: 'Conta de luz - Maio', cat: 'Utilidades', amount: 2800, date: '2026-05-15', user: 'Admin' },
  { id: 'e3', desc: 'Manutenção AC Suíte 301', cat: 'Manutenção', amount: 350, date: '2026-05-12', user: 'Admin' },
  { id: 'e4', desc: 'Toalhas e roupas de cama', cat: 'Suprimentos', amount: 1200, date: '2026-05-08', user: 'Admin' },
  { id: 'e5', desc: 'Salários Maio', cat: 'Salários', amount: 8500, date: '2026-05-05', user: 'Admin' },
  { id: 'e6', desc: 'Marketing Google Ads', cat: 'Marketing', amount: 600, date: '2026-05-01', user: 'Admin' },
  {
    id: 'e7',
    desc: 'Café e sucos café da manhã',
    cat: 'Alimentação',
    amount: 780,
    date: '2026-05-14',
    user: 'Maria Silva',
  },
];

const mkHK = () => [
  {
    id: 'hk1',
    room: 'Standard 202',
    roomId: 'r4',
    status: 'pending',
    priority: 'high',
    tasks: HK_TASKS.map((t) => ({ name: t, done: false })),
    assignee: 'Maria',
    notes: 'Hóspede saiu — limpeza completa',
    created: '2026-05-17 08:00',
  },
  {
    id: 'hk2',
    room: 'Standard 103',
    roomId: 'r11',
    status: 'pending',
    priority: 'high',
    tasks: HK_TASKS.map((t) => ({ name: t, done: false })),
    assignee: 'Joana',
    notes: 'Check-out feito',
    created: '2026-05-16 11:30',
  },
  {
    id: 'hk3',
    room: 'Suíte 101',
    roomId: 'r1',
    status: 'in_progress',
    priority: 'medium',
    tasks: HK_TASKS.map((t, i) => ({ name: t, done: i < 3 })),
    assignee: 'Maria',
    notes: 'Toalhas extras solicitadas',
    created: '2026-05-17 10:00',
  },
];

// ─── REDUCER ───
function reducer(st, a) {
  const log = (type, data) => ({
    id: uid(),
    type,
    date: fmtDT(),
    user: st.currentUser || 'Admin',
    ip: '192.168.1.10',
    ...data,
  });
  switch (a.type) {
    case 'CHECKIN':
      return {
        ...st,
        rooms: st.rooms.map((r) => (r.id === a.rid ? { ...r, status: 'occupied', guest: a.guest } : r)),
        history: [log('checkin', { room: a.rn, guest: a.guest.name }), ...st.history],
      };
    case 'CHECKOUT':
      return {
        ...st,
        rooms: st.rooms.map((r) => (r.id === a.rid ? { ...r, status: 'checkout', guest: null } : r)),
        history: [log('checkout', { room: a.rn, guest: a.gn }), ...st.history],
      };
    case 'STATUS':
      return {
        ...st,
        rooms: st.rooms.map((r) => (r.id === a.rid ? { ...r, status: a.s } : r)),
        history: [log('status', { room: a.rn, guest: '→ ' + STATUS[a.s].l }), ...st.history],
      };
    case 'PAY': {
      const rooms = st.rooms.map((r) => {
        if (r.id !== a.rid) return r;
        if (r.type === 'shared') {
          const gs = r.beds.guests.map((g, i) =>
            i === a.gi
              ? { ...g, payments: [...g.payments, { date: td(), amount: a.amt, method: a.met, ref: a.ref }] }
              : g,
          );
          return { ...r, beds: { ...r.beds, guests: gs } };
        }
        return {
          ...r,
          guest: {
            ...r.guest,
            payments: [...r.guest.payments, { date: td(), amount: a.amt, method: a.met, ref: a.ref }],
          },
        };
      });
      return {
        ...st,
        rooms,
        history: [log('payment', { room: a.rn, guest: a.gn, amount: a.amt, method: a.met }), ...st.history],
      };
    }
    case 'BED_IN': {
      const rooms = st.rooms.map((r) => {
        if (r.id !== a.rid) return r;
        return { ...r, status: 'occupied', beds: { ...r.beds, guests: [...r.beds.guests, a.guest] } };
      });
      return {
        ...st,
        rooms,
        history: [log('checkin', { room: a.rn, guest: a.guest.name + ' (Cama ' + a.guest.bed + ')' }), ...st.history],
      };
    }
    case 'BED_OUT': {
      const rooms = st.rooms.map((r) => {
        if (r.id !== a.rid) return r;
        const gs = r.beds.guests.filter((_, i) => i !== a.gi);
        return { ...r, status: gs.length ? 'occupied' : 'available', beds: { ...r.beds, guests: gs } };
      });
      return { ...st, rooms, history: [log('checkout', { room: a.rn, guest: a.gn }), ...st.history] };
    }
    case 'ADD_ROOM': {
      const room = { ...a.room, id: uid(), status: 'available', guest: null, amenities: a.room.amenities || [] };
      if (room.type === 'shared') room.beds = { total: room.cap, guests: [] };
      return {
        ...st,
        rooms: [...st.rooms, room],
        history: [log('room_add', { room: room.name, guest: 'Novo quarto criado' }), ...st.history],
      };
    }
    case 'ADD_EXP':
      return {
        ...st,
        expenses: [{ id: uid(), date: td(), user: st.currentUser || 'Admin', ...a.exp }, ...st.expenses],
        history: [log('expense', { room: '—', guest: a.exp.desc + ' (' + fmt(a.exp.amount) + ')' }), ...st.history],
      };
    case 'HK_TOGGLE': {
      const hk = st.housekeeping.map((h) => {
        if (h.id !== a.hid) return h;
        const tasks = h.tasks.map((t, i) => (i === a.ti ? { ...t, done: !t.done } : t));
        const allDone = tasks.every((t) => t.done);
        return { ...h, tasks, status: allDone ? 'done' : tasks.some((t) => t.done) ? 'in_progress' : 'pending' };
      });
      return { ...st, housekeeping: hk };
    }
    case 'HK_STATUS':
      return { ...st, housekeeping: st.housekeeping.map((h) => (h.id === a.hid ? { ...h, status: a.s } : h)) };
    case 'HK_ADD':
      return {
        ...st,
        housekeeping: [
          {
            id: uid(),
            status: 'pending',
            tasks: HK_TASKS.map((t) => ({ name: t, done: false })),
            created: fmtDT(),
            ...a.hk,
          },
          ...st.housekeeping,
        ],
        history: [log('housekeeping', { room: a.hk.room, guest: 'Nova tarefa: ' + a.hk.room }), ...st.history],
      };
    case 'ADD_USER':
      return {
        ...st,
        users: [
          ...st.users,
          { ...a.user, id: uid(), active: true, created: td(), lastLogin: '—', avatar: a.user.name[0].toUpperCase() },
        ],
        history: [log('user', { room: '—', guest: 'Usuário ' + a.user.name + ' criado' }), ...st.history],
      };
    case 'TOGGLE_USER':
      return {
        ...st,
        users: st.users.map((u) => (u.id === a.uid ? { ...u, active: !u.active } : u)),
        history: [
          log('user', {
            room: '—',
            guest:
              'Usuário ' +
              (st.users.find((u) => u.id === a.uid)?.name || '') +
              ' ' +
              (st.users.find((u) => u.id === a.uid)?.active ? 'desativado' : 'ativado'),
          }),
          ...st.history,
        ],
      };
    case 'DEL_USER':
      return {
        ...st,
        users: st.users.filter((u) => u.id !== a.uid),
        history: [log('user', { room: '—', guest: 'Usuário removido' }), ...st.history],
      };
    case 'UPD_CONFIG':
      return {
        ...st,
        config: { ...st.config, ...a.data },
        history: [log('config', { room: '—', guest: 'Configurações atualizadas' }), ...st.history],
      };
    case 'CANCEL_RESERVATION': {
      const r = st.rooms.find((x) => x.id === a.rid);
      return {
        ...st,
        rooms: st.rooms.map((x) => (x.id === a.rid ? { ...x, status: 'available', guest: null } : x)),
        history: [log('cancellation', { room: a.rn, guest: a.gn + ' — Reserva cancelada' }), ...st.history],
      };
    }
    default:
      return st;
  }
}

// ─── CSS ───
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes pop{0%{transform:scale(.96);opacity:0}100%{transform:scale(1);opacity:1}}
.af{animation:fadeIn .3s ease both}.as{animation:slideR .25s ease both}.ap{animation:pop .2s ease both}
.hc{transition:box-shadow .2s,transform .15s}.hc:hover{box-shadow:${C.shadowMd};transform:translateY(-1px)}
select,input,textarea,button{font-family:'Plus Jakarta Sans',sans-serif}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
.tab-pill{padding:6px 14px;border-radius:20;border:1px solid ${C.border};cursor:pointer;font-size:12px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s}
.tab-pill.active{border:none;color:#fff}
`;

// ─── UI ATOMS ───
function Btn({ children, onClick, v = 'default', sm, xs, icon, disabled, full, style: sx }) {
  const m = {
    default: { bg: C.white, c: C.text, b: '1px solid ' + C.border },
    primary: { bg: C.primary, c: '#fff', b: 'none' },
    accent: { bg: C.accent, c: '#fff', b: 'none' },
    danger: { bg: C.danger, c: '#fff', b: 'none' },
    warn: { bg: C.warn, c: '#fff', b: 'none' },
    ghost: { bg: 'transparent', c: C.textSec, b: '1px solid ' + C.border },
    soft: { bg: C.primaryLight, c: C.primary, b: '1px solid ' + C.primaryMid },
    softAccent: { bg: C.accentLight, c: C.accentDark, b: '1px solid #a7f3d0' },
    softDanger: { bg: C.dangerLight, c: C.danger, b: '1px solid #fecaca' },
    softWarn: { bg: C.warnLight, c: C.warnDark, b: '1px solid #fde68a' },
  }[v] || { bg: C.white, c: C.text, b: '1px solid ' + C.border };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: xs ? '4px 10px' : sm ? '7px 14px' : '10px 20px',
        borderRadius: xs ? 6 : 10,
        background: m.bg,
        color: m.c,
        border: m.b,
        fontWeight: 600,
        fontSize: xs ? 11 : sm ? 12 : 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all .15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        justifyContent: full ? 'center' : undefined,
        ...sx,
      }}
    >
      {icon && <I name={icon} size={xs ? 14 : sm ? 15 : 16} color={m.c} />}
      {children}
    </button>
  );
}
function Input({ label, ...p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{label}</label>}
      <input
        {...p}
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid ' + C.border,
          background: C.white,
          color: C.text,
          fontSize: 14,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          ...(p.style || {}),
        }}
        onFocus={(e) => (e.target.style.borderColor = C.primary)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
}
function Sel({ label, children, ...p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{label}</label>}
      <select
        {...p}
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid ' + C.border,
          background: C.white,
          color: C.text,
          fontSize: 14,
          outline: 'none',
        }}
      >
        {children}
      </select>
    </div>
  );
}
function Textarea({ label, ...p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{label}</label>}
      <textarea
        {...p}
        rows={3}
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid ' + C.border,
          background: C.white,
          color: C.text,
          fontSize: 14,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          resize: 'vertical',
          ...(p.style || {}),
        }}
        onFocus={(e) => (e.target.style.borderColor = C.primary)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
}
function Badge({ status, lg }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span
      style={{
        padding: lg ? '6px 14px' : '4px 12px',
        borderRadius: 20,
        background: s.bg,
        color: s.c,
        fontSize: lg ? 12 : 11,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <I name={s.ic} size={lg ? 14 : 12} color={s.c} />
      {s.l}
    </span>
  );
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'rgba(15,23,42,.4)',
        backdropFilter: 'blur(4px)',
        padding: '40px 16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="ap"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 20,
          width: '100%',
          maxWidth: wide ? 800 : 520,
          boxShadow: C.shadowLg,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid ' + C.borderLight,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: C.bg,
              border: 'none',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <I name="close" size={18} color={C.textSec} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}
function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div
      className="hc"
      style={{
        background: C.white,
        borderRadius: 16,
        padding: 20,
        border: '1px solid ' + C.borderLight,
        boxShadow: C.shadow,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: color + '10',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: color + '12',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <I name={icon} size={20} color={color} />
        </div>
        <span
          style={{ fontSize: 11, color: C.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{sub}</div>}
      {trend !== undefined && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend >= 0 ? C.accent : C.danger,
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <I name={trend >= 0 ? 'trending_up' : 'trending_down'} size={14} color={trend >= 0 ? C.accent : C.danger} />
          {trend >= 0 ? '+' : ''}
          {trend}%
        </div>
      )}
    </div>
  );
}
function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: C.primaryLight,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <I name={icon} size={32} color={C.primary} />
      </div>
      <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: C.textDim, fontSize: 14, marginBottom: 20 }}>{desc}</p>
      {action && (
        <Btn v="primary" icon="add" onClick={onAction}>
          {action}
        </Btn>
      )}
    </div>
  );
}
function PageHead({ title, sub, actions }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-.3px' }}>{title}</h1>
        {sub && <p style={{ fontSize: 14, color: C.textSec, marginTop: 4 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
const allGuests = (rooms) => {
  const gs = [];
  rooms.forEach((r) => {
    if (r.type === 'shared' && r.beds)
      r.beds.guests.forEach((g) =>
        gs.push({ ...g, roomName: r.name, roomId: r.id, roomType: r.type, roomPrice: r.price }),
      );
    else if (r.guest) gs.push({ ...r.guest, roomName: r.name, roomId: r.id, roomType: r.type, roomPrice: r.price });
  });
  return gs;
};
function Pills({ items, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((it) => (
        <button
          key={it.k}
          onClick={() => onChange(it.k)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: active === it.k ? 'none' : '1px solid ' + C.border,
            cursor: 'pointer',
            background: active === it.k ? it.c || C.primary : C.white,
            color: active === it.k ? '#fff' : C.textSec,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'all .15s',
          }}
        >
          {it.l}
          {it.count !== undefined && <span style={{ marginLeft: 4, opacity: 0.8 }}>({it.count})</span>}
        </button>
      ))}
    </div>
  );
}

// ─── NAV ───
function Sidebar({ active, onChange, rooms }) {
  const items = [
    { id: 'dashboard', icon: 'dashboard', label: 'Painel' },
    { id: 'reservations', icon: 'calendar_month', label: 'Reservas' },
    { id: 'rooms', icon: 'meeting_room', label: 'Quartos', badge: rooms.length },
    { id: 'guests', icon: 'group', label: 'Hóspedes' },
    { id: 'housekeeping', icon: 'cleaning_services', label: 'Governança' },
    { id: 'financial', icon: 'account_balance', label: 'Financeiro' },
    { id: 'reports', icon: 'analytics', label: 'Relatórios' },
    { id: 'audit', icon: 'verified_user', label: 'Auditoria' },
    { id: 'settings', icon: 'settings', label: 'Configurações' },
  ];
  return (
    <aside
      style={{
        width: 240,
        background: C.white,
        borderRight: '1px solid ' + C.border,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid ' + C.borderLight }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg,' + C.primary + ',' + C.accent + ')',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <I name="hotel" size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.text, letterSpacing: '-.3px' }}>Easy PMS</div>
            <div
              style={{
                fontSize: 10,
                color: C.textDim,
                fontWeight: 500,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Property Management
            </div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: active === it.id ? C.primaryLight : 'transparent',
              color: active === it.id ? C.primary : C.textSec,
              fontWeight: active === it.id ? 700 : 500,
              fontSize: 13,
              marginBottom: 2,
              transition: 'all .15s',
              textAlign: 'left',
            }}
          >
            <I name={it.icon} size={20} color={active === it.id ? C.primary : C.textDim} />
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: active === it.id ? C.primary + '20' : C.bg,
                  color: active === it.id ? C.primary : C.textDim,
                }}
              >
                {it.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid ' + C.borderLight }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: C.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <I name="person" size={18} color={C.primary} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Admin</div>
            <div style={{ fontSize: 11, color: C.textDim }}>Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
function MobileNav({ active, onChange }) {
  const items = [
    { id: 'dashboard', icon: 'dashboard', l: 'Painel' },
    { id: 'rooms', icon: 'meeting_room', l: 'Quartos' },
    { id: 'guests', icon: 'group', l: 'Hósp.' },
    { id: 'housekeeping', icon: 'cleaning_services', l: 'Gov.' },
    { id: 'financial', icon: 'account_balance', l: 'Fin.' },
    { id: 'settings', icon: 'settings', l: 'Config' },
  ];
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: C.white,
        borderTop: '1px solid ' + C.border,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '6px 0 env(safe-area-inset-bottom,8px)',
        zIndex: 100,
      }}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <I name={it.icon} size={22} color={active === it.id ? C.primary : C.textDim} />
          <span
            style={{
              fontSize: 10,
              fontWeight: active === it.id ? 700 : 500,
              color: active === it.id ? C.primary : C.textDim,
            }}
          >
            {it.l}
          </span>
        </button>
      ))}
    </nav>
  );
}

// ─── FORMS ───
function CheckinForm({ room, onSubmit }) {
  const [f, sF] = useState({
    name: '',
    doc: '',
    phone: '',
    email: '',
    checkout: '',
    paid: 0,
    method: 'PIX',
    notes: '',
    nationality: 'Brasileira',
    address: '',
  });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  const nights = f.checkout ? diffD(td(), f.checkout) : 1;
  const total = room.price * nights;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Nome completo *" value={f.name} onChange={(e) => u('name', e.target.value)} />
        </div>
        <Input label="CPF / Passaporte" value={f.doc} onChange={(e) => u('doc', e.target.value)} />
        <Input label="Telefone" value={f.phone} onChange={(e) => u('phone', e.target.value)} />
        <Input label="Email" value={f.email} onChange={(e) => u('email', e.target.value)} />
        <Sel label="Nacionalidade" value={f.nationality} onChange={(e) => u('nationality', e.target.value)}>
          <option>Brasileira</option>
          <option>Argentina</option>
          <option>Americana</option>
          <option>Francesa</option>
          <option>Alemã</option>
          <option>Chilena</option>
          <option>Colombiana</option>
          <option>Outra</option>
        </Sel>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Endereço" value={f.address} onChange={(e) => u('address', e.target.value)} />
        </div>
        <Input label="Data de saída *" type="date" value={f.checkout} onChange={(e) => u('checkout', e.target.value)} />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div
            style={{
              background: C.accentLight,
              borderRadius: 10,
              padding: '10px 16px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 12, color: C.textSec }}>Total: </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.accentDark }}>{fmt(total)}</span>
            <span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>({nights}n)</span>
          </div>
        </div>
        <Input label="Valor pago agora" type="number" value={f.paid} onChange={(e) => u('paid', +e.target.value)} />
        <Sel label="Método" value={f.method} onChange={(e) => u('method', e.target.value)}>
          {PAYMENTS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Sel>
      </div>
      <Textarea label="Observações" value={f.notes} onChange={(e) => u('notes', e.target.value)} />
      <Btn
        v="primary"
        full
        icon="login"
        disabled={!f.name || !f.checkout}
        onClick={() =>
          onSubmit({
            name: f.name,
            doc: f.doc,
            phone: f.phone,
            email: f.email,
            nationality: f.nationality,
            address: f.address,
            notes: f.notes,
            checkin: td(),
            checkout: f.checkout,
            total,
            payments:
              f.paid > 0
                ? [
                    {
                      date: td(),
                      amount: +f.paid,
                      method: f.method,
                      ref: f.method.slice(0, 3).toUpperCase() + '-' + uid().slice(0, 3),
                    },
                  ]
                : [],
          })
        }
      >
        Confirmar Check-in
      </Btn>
    </div>
  );
}

function PayModal({ guest, onPay, onClose }) {
  const [amt, setAmt] = useState(bal(guest));
  const [met, setMet] = useState('PIX');
  return (
    <Modal title={'Pagamento — ' + guest.name} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            background: C.bg,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {[
            { l: 'Total', v: fmt(guest.total) },
            { l: 'Pago', v: fmt(paid(guest)), c: C.accent },
            { l: 'Saldo', v: fmt(bal(guest)), c: bal(guest) > 0 ? C.danger : C.accent },
          ].map((x, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: C.textDim }}>{x.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: x.c || C.text }}>{x.v}</div>
            </div>
          ))}
        </div>
        {guest.payments && guest.payments.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, marginBottom: 8 }}>Histórico</div>
            {guest.payments.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid ' + C.borderLight,
                  fontSize: 13,
                }}
              >
                <span style={{ color: C.textSec }}>
                  {fmtD(p.date)} · {p.method} <span style={{ color: C.textDim, fontSize: 11 }}>({p.ref})</span>
                </span>
                <span style={{ fontWeight: 600, color: C.accent }}>{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Valor" type="number" value={amt} onChange={(e) => setAmt(+e.target.value)} />
          <Sel label="Método" value={met} onChange={(e) => setMet(e.target.value)}>
            {PAYMENTS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Sel>
        </div>
        <Btn
          v="primary"
          full
          icon="payments"
          disabled={!amt || amt <= 0}
          onClick={() => {
            onPay(amt, met);
            onClose();
          }}
        >
          Registrar Pagamento
        </Btn>
      </div>
    </Modal>
  );
}

function GuestDetail({ guest, isBed, onPay, onCheckout }) {
  const b = bal(guest);
  return (
    <div
      className="af"
      style={{
        background: C.bg,
        borderRadius: 14,
        padding: 18,
        marginBottom: 10,
        border: '1px solid ' + C.borderLight,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 16 }}>
            {isBed && <span style={{ color: C.primary }}>Cama {guest.bed} · </span>}
            {guest.name}
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>
            {guest.doc} · {guest.phone}
          </div>
          {guest.email && <div style={{ fontSize: 12, color: C.textDim }}>{guest.email}</div>}
          {guest.nationality && guest.nationality !== 'Brasileira' && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: C.purpleLight,
                color: C.purple,
                fontWeight: 600,
                marginTop: 4,
                display: 'inline-block',
              }}
            >
              {guest.nationality}
            </span>
          )}
        </div>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 8, marginBottom: 12 }}
      >
        {[
          { l: 'Entrada', v: fmtD(guest.checkin) },
          { l: 'Saída', v: fmtD(guest.checkout) },
          { l: 'Total', v: fmt(guest.total) },
          { l: 'Pago', v: fmt(paid(guest)), c: C.accent },
        ].map((x, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: 'uppercase' }}>{x.l}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: x.c || C.text }}>{x.v}</div>
          </div>
        ))}
      </div>
      {b > 0 && (
        <div
          style={{
            background: C.warnLight,
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#92400e',
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <I name="warning" size={16} color="#92400e" />
          Saldo devedor: {fmt(b)}
        </div>
      )}
      {guest.notes && (
        <div
          style={{
            fontSize: 12,
            color: C.textSec,
            fontStyle: 'italic',
            marginBottom: 12,
            padding: '8px 12px',
            background: C.white,
            borderRadius: 8,
            borderLeft: '3px solid ' + C.primary,
          }}
        >
          {guest.notes}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {b > 0 && (
          <Btn sm v="soft" icon="payments" onClick={onPay}>
            Pagamento
          </Btn>
        )}
        <Btn sm v="softDanger" icon="logout" onClick={onCheckout}>
          Check-out
        </Btn>
      </div>
    </div>
  );
}

// ═══════ DASHBOARD ═══════
function Dashboard({ rooms, history, expenses, hk, onNav }) {
  const guests = allGuests(rooms);
  const rev = guests.reduce((s, g) => s + paid(g), 0);
  const pend = guests.reduce((s, g) => s + bal(g), 0);
  const totalExp = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const occ = rooms.filter((r) => r.status === 'occupied').length;
  const tot = rooms.length;
  const occRate = pct(occ, tot);
  const hkPend = (hk || []).filter((h) => h.status !== 'done').length;
  const upCO = guests
    .filter((g) => {
      const d = diffD(td(), g.checkout);
      return d >= 0 && d <= 3;
    })
    .sort((a, b) => a.checkout.localeCompare(b.checkout));
  const debtors = guests.filter((g) => bal(g) > 0).sort((a, b) => bal(b) - bal(a));
  const statusData = Object.entries(STATUS)
    .map(([k, v]) => ({ name: v.l, value: rooms.filter((r) => r.status === k).length, color: v.c }))
    .filter((d) => d.value > 0);
  const revByType = Object.entries(TYPES)
    .map(([k, v]) => ({ name: v, valor: guests.filter((g) => g.roomType === k).reduce((s, g) => s + paid(g), 0) }))
    .filter((d) => d.valor > 0);
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const ds = d.toISOString().split('T')[0];
    const dRev = guests.reduce(
      (s, g) => (g.payments || []).reduce((ss, p) => (p.date === ds ? ss + p.amount : ss), s),
      0,
    );
    return { day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()], valor: dRev };
  });

  return (
    <div>
      <PageHead
        title="Painel de Controle"
        sub={new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />
      <div
        className="af"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon="hotel"
          label="Ocupação"
          value={occRate + '%'}
          sub={occ + ' de ' + tot + ' quartos'}
          color={C.primary}
          trend={5}
        />
        <StatCard icon="group" label="Hóspedes" value={guests.length} sub="ativos" color={C.accent} />
        <StatCard icon="payments" label="Receita" value={fmt(rev)} color={C.accent} trend={12} />
        <StatCard icon="pending" label="Pendente" value={fmt(pend)} color={C.warn} />
        <StatCard icon="receipt_long" label="Despesas" value={fmt(totalExp)} color={C.danger} />
        <StatCard icon="cleaning_services" label="Governança" value={hkPend} sub="pendentes" color={C.cyan} />
      </div>
      <div
        className="af"
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 20,
          border: '1px solid ' + C.borderLight,
          boxShadow: C.shadow,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Mapa de Ocupação</div>
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 12, marginBottom: 12 }}>
          {statusData.map((d, i) => (
            <div
              key={i}
              title={d.name + ': ' + d.value}
              style={{ width: (d.value / tot) * 100 + '%', background: d.color, transition: 'width .5s' }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {statusData.map((d, i) => (
            <span key={i} style={{ fontSize: 12, color: C.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
              {d.name} <strong>{d.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Receita por Categoria</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revByType}>
              <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: C.textDim, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'}
              />
              <Tooltip
                contentStyle={{
                  background: C.white,
                  border: '1px solid ' + C.border,
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: C.shadowMd,
                }}
                formatter={(v) => fmt(v)}
              />
              <Bar dataKey="valor" fill={C.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Receita Últimos 7 Dias</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis dataKey="day" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: C.textDim, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'}
              />
              <Tooltip
                contentStyle={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 10, fontSize: 12 }}
                formatter={(v) => fmt(v)}
              />
              <Area type="monotone" dataKey="valor" stroke={C.accent} fill="url(#gRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Check-outs Próximos</span>
            <Btn xs v="ghost" onClick={() => onNav('guests')}>
              Ver todos
            </Btn>
          </div>
          {upCO.length === 0 && (
            <div style={{ color: C.textDim, fontSize: 13, padding: 12, textAlign: 'center' }}>
              Nenhum nas próximas 72h
            </div>
          )}
          {upCO.slice(0, 5).map((g, i) => (
            <div
              key={i}
              className="as"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid ' + C.borderLight,
                animationDelay: i * 0.05 + 's',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{g.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{g.roomName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.warn }}>{fmtD(g.checkout)}</div>
                {bal(g) > 0 && <div style={{ fontSize: 11, color: C.danger }}>Deve {fmt(bal(g))}</div>}
              </div>
            </div>
          ))}
        </div>
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Pagamentos Pendentes</span>
            <Btn xs v="ghost" onClick={() => onNav('financial')}>
              Ver todos
            </Btn>
          </div>
          {debtors.length === 0 && (
            <div style={{ color: C.textDim, fontSize: 13, padding: 12, textAlign: 'center' }}>Todos em dia!</div>
          )}
          {debtors.slice(0, 5).map((g, i) => (
            <div
              key={i}
              className="as"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid ' + C.borderLight,
                animationDelay: i * 0.05 + 's',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{g.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{g.roomName}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>{fmt(bal(g))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════ RESERVATIONS ═══════
function Reservations({ rooms, dispatch }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year] = useState(new Date().getFullYear());
  const [selDay, setSelDay] = useState(null);
  const [ciModal, setCiModal] = useState(null);
  const dim = new Date(year, month + 1, 0).getDate();
  const fd = new Date(year, month, 1).getDay();
  const mns = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const tdn = new Date().getDate();
  const isT = (d) => d === tdn && month === new Date().getMonth();
  const gdi = (day) => {
    const ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const g = allGuests(rooms);
    return {
      guests: g.filter((x) => x.checkin <= ds && x.checkout > ds),
      checkins: g.filter((x) => x.checkin === ds),
      checkouts: g.filter((x) => x.checkout === ds),
      date: ds,
    };
  };
  return (
    <div>
      <PageHead
        title="Reservas"
        sub="Calendário de ocupação"
        actions={
          <Btn v="primary" icon="add" onClick={() => setCiModal('pick')}>
            Nova Reserva
          </Btn>
        }
      />
      <div
        className="af"
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 24,
          border: '1px solid ' + C.borderLight,
          boxShadow: C.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Btn v="ghost" sm icon="chevron_left" onClick={() => setMonth((p) => (p === 0 ? 11 : p - 1))} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            {mns[month]} {year}
          </h3>
          <Btn v="ghost" sm icon="chevron_right" onClick={() => setMonth((p) => (p === 11 ? 0 : p + 1))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div
              key={d}
              style={{
                padding: '8px 0',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: C.textDim,
                textTransform: 'uppercase',
              }}
            >
              {d}
            </div>
          ))}
          {Array.from({ length: fd }, (_, i) => (
            <div key={'e' + i} />
          ))}
          {Array.from({ length: dim }, (_, i) => {
            const day = i + 1,
              info = gdi(day),
              hg = info.guests.length > 0,
              hci = info.checkins.length > 0,
              hco = info.checkouts.length > 0;
            return (
              <div
                key={day}
                onClick={() => setSelDay(info)}
                style={{
                  padding: '8px 4px',
                  textAlign: 'center',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isT(day) ? C.primaryLight : hg ? C.accentLight + '80' : 'transparent',
                  border: isT(day) ? '2px solid ' + C.primary : '1px solid ' + C.borderLight,
                  transition: 'all .15s',
                  minHeight: 52,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: isT(day) ? 800 : 600, color: isT(day) ? C.primary : C.text }}>
                  {day}
                </div>
                {hg && (
                  <div style={{ fontSize: 10, color: C.accentDark, fontWeight: 600 }}>
                    {info.guests.length}
                    <I name="person" size={10} color={C.accentDark} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                  {hci && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />}
                  {hco && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.danger }} />}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent }} />
            Check-in
          </span>
          <span style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger }} />
            Check-out
          </span>
        </div>
      </div>
      {selDay && (
        <Modal title={fmtD(selDay.date)} onClose={() => setSelDay(null)}>
          {selDay.checkins.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 8 }}>Check-ins</div>
              {selDay.checkins.map((g, i) => (
                <div
                  key={i}
                  style={{
                    background: C.accentLight,
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  <strong>{g.name}</strong> — {g.roomName}
                </div>
              ))}
            </div>
          )}
          {selDay.checkouts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 8 }}>Check-outs</div>
              {selDay.checkouts.map((g, i) => (
                <div
                  key={i}
                  style={{
                    background: C.dangerLight,
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  <strong>{g.name}</strong> — {g.roomName}
                </div>
              ))}
            </div>
          )}
          {selDay.guests.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 8 }}>
                Hospedados ({selDay.guests.length})
              </div>
              {selDay.guests.map((g, i) => (
                <div
                  key={i}
                  style={{
                    background: C.primaryLight,
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 6,
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <strong>{g.name}</strong>
                    <br />
                    <span style={{ fontSize: 11, color: C.textDim }}>{g.roomName}</span>
                  </span>
                  <span style={{ color: C.primary, fontWeight: 600 }}>{fmtD(g.checkout)}</span>
                </div>
              ))}
            </div>
          )}
          {selDay.guests.length === 0 && selDay.checkins.length === 0 && selDay.checkouts.length === 0 && (
            <EmptyState icon="event_available" title="Dia livre" desc="Nenhuma movimentação" />
          )}
        </Modal>
      )}
      {ciModal && (
        <Modal title="Nova Reserva" onClose={() => setCiModal(null)}>
          <Sel
            label="Selecione o quarto"
            onChange={(e) => {
              if (e.target.value) setCiModal(e.target.value);
            }}
            value={typeof ciModal === 'string' && ciModal !== 'pick' ? ciModal : ''}
          >
            <option value="">Selecione...</option>
            {rooms
              .filter(
                (r) =>
                  r.status === 'available' || (r.type === 'shared' && r.beds && r.beds.guests.length < r.beds.total),
              )
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {TYPES[r.type]} — {fmt(r.price)}/noite
                </option>
              ))}
          </Sel>
          {ciModal && ciModal !== 'pick' && rooms.find((r) => r.id === ciModal) && (
            <div style={{ marginTop: 16 }}>
              <CheckinForm
                room={rooms.find((r) => r.id === ciModal)}
                onSubmit={(g) => {
                  const r = rooms.find((x) => x.id === ciModal);
                  if (r.type === 'shared')
                    dispatch({
                      type: 'BED_IN',
                      rid: r.id,
                      rn: r.name,
                      guest: { ...g, id: uid(), bed: (r.beds?.guests.length || 0) + 1 },
                    });
                  else dispatch({ type: 'CHECKIN', rid: r.id, rn: r.name, guest: { ...g, id: uid() } });
                  setCiModal(null);
                }}
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ═══════ ROOMS ═══════
function Rooms({ rooms, dispatch }) {
  const [filter, setFilter] = useState('all');
  const [typeF, setTypeF] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [addM, setAddM] = useState(false);
  const [payM, setPayM] = useState(null);
  const filtered = rooms.filter(
    (r) =>
      (filter === 'all' || r.status === filter) &&
      (typeF === 'all' || r.type === typeF) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase())),
  );
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();
  const dr = typeof detail === 'string' && !detail.startsWith('ci_') ? rooms.find((r) => r.id === detail) : null;
  return (
    <div>
      <PageHead
        title="Quartos"
        sub={rooms.length + ' quartos'}
        actions={
          <Btn v="primary" icon="add" onClick={() => setAddM(true)}>
            Novo Quarto
          </Btn>
        }
      />
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <I
          name="search"
          size={18}
          color={C.textDim}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          placeholder="Buscar quarto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 42px',
            borderRadius: 12,
            border: '1px solid ' + C.border,
            background: C.white,
            color: C.text,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <Pills
        items={[{ k: 'all', l: 'Todos' }, ...Object.entries(STATUS).map(([k, v]) => ({ k, l: v.l, c: v.c }))]}
        active={filter}
        onChange={setFilter}
      />
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        <Pills
          items={[{ k: 'all', l: 'Todos tipos' }, ...Object.entries(TYPES).map(([k, v]) => ({ k, l: v }))]}
          active={typeF}
          onChange={setTypeF}
        />
      </div>
      {floors.map((fl) => {
        const fR = filtered.filter((r) => r.floor === fl);
        if (!fR.length) return null;
        return (
          <div key={fl} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.textDim,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <I name="layers" size={14} color={C.textDim} />
              {fl === 0 ? 'Térreo' : fl + 'º Andar'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {fR.map((r) => {
                const s = STATUS[r.status],
                  isS = r.type === 'shared',
                  gc = isS ? r.beds?.guests.length || 0 : r.guest ? 1 : 0;
                return (
                  <div
                    key={r.id}
                    className="hc"
                    onClick={() => setDetail(r.id)}
                    style={{
                      background: C.white,
                      borderRadius: 16,
                      padding: 18,
                      cursor: 'pointer',
                      border: '1px solid ' + C.borderLight,
                      boxShadow: C.shadow,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 4,
                        height: '100%',
                        background: s.c,
                        borderRadius: '16px 0 0 16px',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                        paddingLeft: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                          {TYPES[r.type]} · {r.cap} {isS ? 'camas' : 'pax'}
                        </div>
                      </div>
                      <Badge status={r.status} />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        paddingLeft: 10,
                      }}
                    >
                      <div>
                        <span style={{ color: C.primary, fontWeight: 800, fontSize: 18 }}>{fmt(r.price)}</span>
                        <span style={{ fontSize: 11, color: C.textDim }}>/{isS ? 'cama' : 'noite'}</span>
                      </div>
                      {gc > 0 && (
                        <div style={{ fontSize: 12, color: C.textSec, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <I name="person" size={14} color={C.textSec} />
                          {gc}
                          {isS && '/' + r.beds.total}
                        </div>
                      )}
                    </div>
                    {isS && r.beds && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 12, paddingLeft: 10 }}>
                        {Array.from({ length: r.beds.total }, (_, i) => {
                          const oc = r.beds.guests.some((g) => g.bed === i + 1);
                          return (
                            <div
                              key={i}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                background: oc ? C.primaryLight : C.accentLight,
                                border: '1.5px solid ' + (oc ? C.primary : C.accent) + '40',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 700,
                                color: oc ? C.primary : C.accent,
                              }}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {r.amenities && r.amenities.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10, paddingLeft: 10 }}>
                        {r.amenities.slice(0, 4).map((a, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: C.bg,
                              color: C.textDim,
                            }}
                          >
                            {a}
                          </span>
                        ))}
                        {r.amenities.length > 4 && (
                          <span style={{ fontSize: 10, color: C.textDim }}>+{r.amenities.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <EmptyState icon="search_off" title="Nenhum quarto" desc="Altere os filtros" />}

      {dr && (
        <Modal title={dr.name} onClose={() => setDetail(null)} wide>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <Badge status={dr.status} lg />
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: C.bg,
                color: C.textSec,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {TYPES[dr.type]}
            </span>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: C.bg,
                color: C.textSec,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Andar {dr.floor}
            </span>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: C.primaryLight,
                color: C.primary,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {fmt(dr.price)}/{dr.type === 'shared' ? 'cama' : 'noite'}
            </span>
          </div>
          {dr.amenities && dr.amenities.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {dr.amenities.map((a, i) => (
                <span
                  key={i}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: C.bg,
                    color: C.textSec,
                    fontSize: 12,
                    border: '1px solid ' + C.borderLight,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          )}
          {dr.type !== 'shared' && dr.guest && (
            <GuestDetail
              guest={dr.guest}
              onPay={() => setPayM({ guest: dr.guest, rid: dr.id, rn: dr.name })}
              onCheckout={() => {
                dispatch({ type: 'CHECKOUT', rid: dr.id, rn: dr.name, gn: dr.guest.name });
                setDetail(null);
              }}
            />
          )}
          {dr.type === 'shared' && dr.beds && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                Camas — {dr.beds.guests.length}/{dr.beds.total} ocupadas
              </div>
              {dr.beds.guests.map((g, i) => (
                <GuestDetail
                  key={i}
                  guest={g}
                  isBed
                  onPay={() => setPayM({ guest: g, rid: dr.id, rn: dr.name, gi: i })}
                  onCheckout={() => {
                    dispatch({ type: 'BED_OUT', rid: dr.id, rn: dr.name, gi: i, gn: g.name });
                  }}
                />
              ))}
              {dr.beds.guests.length === 0 && (
                <div
                  style={{
                    color: C.textDim,
                    fontSize: 13,
                    padding: 20,
                    textAlign: 'center',
                    background: C.bg,
                    borderRadius: 12,
                  }}
                >
                  Todas as camas livres
                </div>
              )}
            </div>
          )}
          {dr.status === 'reserved' && dr.guest && (
            <div style={{ background: C.purpleLight, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: C.purple, marginBottom: 8 }}>Reserva de {dr.guest.name}</div>
              <div style={{ fontSize: 13, color: C.textSec }}>
                Check-in: {fmtD(dr.guest.checkin)} · Check-out: {fmtD(dr.guest.checkout)}
              </div>
              <div style={{ fontSize: 13, color: C.textSec }}>
                Total: {fmt(dr.guest.total)} · Pago: {fmt(paid(dr.guest))}
              </div>
              {dr.guest.notes && (
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 6, fontStyle: 'italic' }}>
                  {dr.guest.notes}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid ' + C.borderLight,
            }}
          >
            {(dr.type === 'shared'
              ? dr.beds && dr.beds.guests.length < dr.beds.total && dr.status !== 'maintenance'
              : ['available', 'reserved'].includes(dr.status)) && (
              <Btn v="primary" icon="login" onClick={() => setDetail('ci_' + dr.id)}>
                Check-in
              </Btn>
            )}
            {dr.status === 'available' && (
              <Btn
                v="soft"
                icon="event"
                onClick={() => {
                  dispatch({ type: 'STATUS', rid: dr.id, rn: dr.name, s: 'reserved' });
                }}
              >
                Reservar
              </Btn>
            )}
            {dr.status === 'reserved' && (
              <Btn
                v="softDanger"
                icon="cancel"
                onClick={() => {
                  dispatch({ type: 'CANCEL_RESERVATION', rid: dr.id, rn: dr.name, gn: dr.guest?.name || '—' });
                  setDetail(null);
                }}
              >
                Cancelar Reserva
              </Btn>
            )}
            {['checkout', 'cleaning'].includes(dr.status) && (
              <Btn
                v="softAccent"
                icon="check_circle"
                onClick={() => {
                  dispatch({ type: 'STATUS', rid: dr.id, rn: dr.name, s: 'available' });
                  setDetail(null);
                }}
              >
                Liberar
              </Btn>
            )}
            {['available', 'checkout', 'cleaning'].includes(dr.status) && (
              <Btn
                v="ghost"
                icon="build"
                onClick={() => {
                  dispatch({ type: 'STATUS', rid: dr.id, rn: dr.name, s: 'maintenance' });
                  setDetail(null);
                }}
              >
                Manutenção
              </Btn>
            )}
            {dr.status === 'maintenance' && (
              <Btn
                v="softAccent"
                icon="check_circle"
                onClick={() => {
                  dispatch({ type: 'STATUS', rid: dr.id, rn: dr.name, s: 'available' });
                  setDetail(null);
                }}
              >
                Liberar
              </Btn>
            )}
          </div>
        </Modal>
      )}
      {typeof detail === 'string' && detail.startsWith('ci_') && (
        <Modal
          title={'Check-in — ' + rooms.find((r) => r.id === detail.replace('ci_', ''))?.name}
          onClose={() => setDetail(null)}
        >
          <CheckinForm
            room={rooms.find((r) => r.id === detail.replace('ci_', ''))}
            onSubmit={(g) => {
              const r = rooms.find((x) => x.id === detail.replace('ci_', ''));
              if (r.type === 'shared')
                dispatch({
                  type: 'BED_IN',
                  rid: r.id,
                  rn: r.name,
                  guest: { ...g, id: uid(), bed: (r.beds?.guests.length || 0) + 1 },
                });
              else dispatch({ type: 'CHECKIN', rid: r.id, rn: r.name, guest: { ...g, id: uid() } });
              setDetail(null);
            }}
          />
        </Modal>
      )}
      {payM && (
        <PayModal
          guest={payM.guest}
          onPay={(amt, met) => {
            dispatch({
              type: 'PAY',
              rid: payM.rid,
              rn: payM.rn,
              gn: payM.guest.name,
              gi: payM.gi,
              amt,
              met,
              ref: met.slice(0, 3).toUpperCase() + '-' + uid().slice(0, 3),
            });
          }}
          onClose={() => setPayM(null)}
        />
      )}
      {addM && (
        <Modal title="Novo Quarto" onClose={() => setAddM(false)}>
          <AddRoom
            onSubmit={(r) => {
              dispatch({ type: 'ADD_ROOM', room: r });
              setAddM(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
function AddRoom({ onSubmit }) {
  const [f, sF] = useState({ name: '', type: 'suite', floor: 1, cap: 2, price: 200, amenities: '' });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Nome do quarto" value={f.name} onChange={(e) => u('name', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Sel label="Tipo" value={f.type} onChange={(e) => u('type', e.target.value)}>
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Sel>
        <Input label="Andar" type="number" value={f.floor} onChange={(e) => u('floor', +e.target.value)} />
        <Input label="Capacidade" type="number" value={f.cap} onChange={(e) => u('cap', +e.target.value)} />
        <Input label="Preço/noite" type="number" value={f.price} onChange={(e) => u('price', +e.target.value)} />
      </div>
      <Input label="Comodidades (vírgula)" value={f.amenities} onChange={(e) => u('amenities', e.target.value)} />
      <Btn
        v="primary"
        full
        icon="add"
        disabled={!f.name}
        onClick={() => onSubmit({ ...f, amenities: f.amenities ? f.amenities.split(',').map((a) => a.trim()) : [] })}
      >
        Adicionar Quarto
      </Btn>
    </div>
  );
}

// ═══════ GUESTS ═══════
function Guests({ rooms, dispatch }) {
  const [search, setSearch] = useState('');
  const [payM, setPayM] = useState(null);
  const guests = allGuests(rooms);
  const filtered = guests.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.roomName.toLowerCase().includes(search.toLowerCase()) ||
      g.doc?.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div>
      <PageHead title="Hóspedes" sub={guests.length + ' hóspedes ativos'} />
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <I
          name="search"
          size={18}
          color={C.textDim}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          placeholder="Buscar nome, quarto ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: 12,
            border: '1px solid ' + C.border,
            background: C.white,
            color: C.text,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: C.shadow,
          }}
        />
      </div>
      {filtered.length === 0 && <EmptyState icon="group_off" title="Nenhum hóspede" desc="Nenhum hóspede ativo" />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((g, i) => {
          const b = bal(g);
          return (
            <div
              key={i}
              className="as hc"
              style={{
                background: C.white,
                borderRadius: 14,
                padding: 18,
                border: '1px solid ' + C.borderLight,
                boxShadow: C.shadow,
                animationDelay: i * 0.03 + 's',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: C.primaryLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <I name="person" size={22} color={C.primary} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: C.textDim }}>
                      {g.roomName} · {g.doc}
                    </div>
                    <div style={{ fontSize: 12, color: C.textDim }}>
                      {g.phone}
                      {g.email ? ' · ' + g.email : ''}
                    </div>
                    {g.nationality && g.nationality !== 'Brasileira' && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: C.purpleLight,
                          color: C.purple,
                          fontWeight: 600,
                          marginTop: 2,
                          display: 'inline-block',
                        }}
                      >
                        {g.nationality}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: C.textSec }}>
                    {fmtD(g.checkin)} → {fmtD(g.checkout)}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.primary, marginTop: 4 }}>
                    {fmt(paid(g))}{' '}
                    <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim }}>/ {fmt(g.total)}</span>
                  </div>
                  {b > 0 && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginTop: 2 }}>Deve {fmt(b)}</div>
                  )}
                  {b > 0 && (
                    <Btn
                      xs
                      v="soft"
                      icon="payments"
                      style={{ marginTop: 6 }}
                      onClick={() => setPayM({ guest: g, rid: g.roomId, rn: g.roomName })}
                    >
                      Pagar
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {payM && (
        <PayModal
          guest={payM.guest}
          onPay={(amt, met) => {
            dispatch({
              type: 'PAY',
              rid: payM.rid,
              rn: payM.rn,
              gn: payM.guest.name,
              amt,
              met,
              ref: met.slice(0, 3).toUpperCase() + '-' + uid().slice(0, 3),
            });
          }}
          onClose={() => setPayM(null)}
        />
      )}
    </div>
  );
}

// ═══════ HOUSEKEEPING ═══════
function Housekeeping({ hk, dispatch, rooms }) {
  const [addM, setAddM] = useState(false);
  const sm = {
    pending: { l: 'Pendente', c: C.warn, bg: C.warnLight },
    in_progress: { l: 'Em Andamento', c: C.primary, bg: C.primaryLight },
    done: { l: 'Concluído', c: C.accent, bg: C.accentLight },
  };
  const pr = { high: { l: 'Alta', c: C.danger }, medium: { l: 'Média', c: C.warn }, low: { l: 'Baixa', c: C.accent } };
  const groups = {
    pending: (hk || []).filter((h) => h.status === 'pending'),
    in_progress: (hk || []).filter((h) => h.status === 'in_progress'),
    done: (hk || []).filter((h) => h.status === 'done'),
  };
  return (
    <div>
      <PageHead
        title="Governança"
        sub="Controle de limpeza e manutenção"
        actions={
          <Btn v="primary" icon="add" onClick={() => setAddM(true)}>
            Nova Tarefa
          </Btn>
        }
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard icon="pending_actions" label="Pendentes" value={groups.pending.length} color={C.warn} />
        <StatCard icon="sync" label="Em Andamento" value={groups.in_progress.length} color={C.primary} />
        <StatCard icon="task_alt" label="Concluídas" value={groups.done.length} color={C.accent} />
      </div>
      {['pending', 'in_progress', 'done'].map((status) => {
        const items = groups[status];
        const s = sm[status];
        return (
          <div key={status} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.c }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.l}</span>
              <span style={{ fontSize: 12, color: C.textDim }}>({items.length})</span>
            </div>
            {items.length === 0 && (
              <div
                style={{
                  background: C.bg,
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                  color: C.textDim,
                  fontSize: 13,
                }}
              >
                Nenhuma tarefa
              </div>
            )}
            {items.map((h) => {
              const dc = h.tasks.filter((t) => t.done).length,
                pc = Math.round((dc / h.tasks.length) * 100),
                p = pr[h.priority] || pr.medium;
              return (
                <div
                  key={h.id}
                  className="hc"
                  style={{
                    background: C.white,
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 10,
                    border: '1px solid ' + C.borderLight,
                    boxShadow: C.shadow,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{h.room}</div>
                      <div style={{ fontSize: 12, color: C.textDim }}>
                        {h.assignee && h.assignee + ' · '}
                        {h.created}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: p.c + '15',
                        color: p.c,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {p.l}
                    </span>
                  </div>
                  {h.notes && (
                    <div
                      style={{
                        fontSize: 12,
                        color: C.textSec,
                        marginBottom: 12,
                        padding: '8px 12px',
                        background: C.bg,
                        borderRadius: 8,
                      }}
                    >
                      {h.notes}
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.textDim }}>
                        {dc}/{h.tasks.length} tarefas
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pc === 100 ? C.accent : C.primary }}>
                        {pc}%
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: C.bg }}>
                      <div
                        style={{
                          width: pc + '%',
                          height: '100%',
                          borderRadius: 3,
                          background: pc === 100 ? C.accent : C.primary,
                          transition: 'width .3s',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {h.tasks.map((t, i) => (
                      <label
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 8px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: t.done ? C.accentLight + '60' : 'transparent',
                          transition: 'all .15s',
                        }}
                        onClick={() => dispatch({ type: 'HK_TOGGLE', hid: h.id, ti: i })}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: '2px solid ' + (t.done ? C.accent : C.border),
                            background: t.done ? C.accent : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {t.done && <I name="check" size={14} color="#fff" />}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color: t.done ? C.textDim : C.text,
                            textDecoration: t.done ? 'line-through' : 'none',
                          }}
                        >
                          {t.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {addM && (
        <Modal title="Nova Tarefa" onClose={() => setAddM(false)}>
          <HKForm
            rooms={rooms}
            onSubmit={(d) => {
              dispatch({ type: 'HK_ADD', hk: d });
              setAddM(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
function HKForm({ rooms, onSubmit }) {
  const [f, sF] = useState({ room: '', roomId: '', priority: 'medium', assignee: '', notes: '' });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Sel
        label="Quarto"
        value={f.roomId}
        onChange={(e) => {
          const r = rooms.find((x) => x.id === e.target.value);
          u('roomId', e.target.value);
          u('room', r?.name || '');
        }}
      >
        <option value="">Selecione...</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </Sel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Sel label="Prioridade" value={f.priority} onChange={(e) => u('priority', e.target.value)}>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </Sel>
        <Input label="Responsável" value={f.assignee} onChange={(e) => u('assignee', e.target.value)} />
      </div>
      <Textarea label="Observações" value={f.notes} onChange={(e) => u('notes', e.target.value)} />
      <Btn v="primary" full icon="add" disabled={!f.roomId} onClick={() => onSubmit(f)}>
        Criar Tarefa
      </Btn>
    </div>
  );
}

// ═══════ FINANCIAL ═══════
function Financial({ rooms, expenses, dispatch }) {
  const [expM, setExpM] = useState(false);
  const guests = allGuests(rooms);
  const rev = guests.reduce((s, g) => s + paid(g), 0);
  const pend = guests.reduce((s, g) => s + bal(g), 0);
  const totalExp = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const profit = rev - totalExp;
  const byMethod = {};
  guests.forEach((g) =>
    (g.payments || []).forEach((p) => {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    }),
  );
  const methodData = Object.entries(byMethod)
    .map(([k, v]) => ({ name: k, valor: v }))
    .sort((a, b) => b.valor - a.valor);
  const byCat = {};
  (expenses || []).forEach((e) => {
    byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
  });
  const catData = Object.entries(byCat).map(([k, v]) => ({ name: k, valor: v }));
  const pieColors = [C.danger, C.warn, C.purple, C.primary, C.cyan, C.rose, C.orange, C.accent];
  return (
    <div>
      <PageHead
        title="Financeiro"
        sub="Receitas e despesas"
        actions={
          <Btn v="primary" icon="add" onClick={() => setExpM(true)}>
            Nova Despesa
          </Btn>
        }
      />
      <div
        className="af"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard icon="trending_up" label="Receita" value={fmt(rev)} color={C.accent} trend={12} />
        <StatCard icon="schedule" label="Pendente" value={fmt(pend)} color={C.warn} />
        <StatCard icon="trending_down" label="Despesas" value={fmt(totalExp)} color={C.danger} />
        <StatCard icon="account_balance" label="Lucro" value={fmt(profit)} color={profit >= 0 ? C.accent : C.danger} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Receita por Método</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={methodData} layout="vertical">
              <XAxis
                type="number"
                tick={{ fill: C.textDim, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: C.textSec, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={{ background: C.white, border: '1px solid ' + C.border, borderRadius: 10, fontSize: 12 }}
                formatter={(v) => fmt(v)}
              />
              <Bar dataKey="valor" fill={C.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Despesas por Categoria</div>
          {catData.length === 0 ? (
            <EmptyState icon="receipt_long" title="Sem despesas" desc="Registre a primeira" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="valor"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  strokeWidth={2}
                  stroke={C.white}
                >
                  {catData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: C.white,
                    border: '1px solid ' + C.border,
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v) => fmt(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {expenses && expenses.length > 0 && (
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 20,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Últimas Despesas</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Descrição', 'Categoria', 'Responsável', 'Data', 'Valor'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                        borderBottom: '2px solid ' + C.borderLight,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid ' + C.borderLight }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.text }}>{e.desc}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          background: C.bg,
                          fontSize: 11,
                          color: C.textSec,
                        }}
                      >
                        {e.cat}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: C.textSec }}>{e.user || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: C.textSec }}>{fmtD(e.date)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: C.danger }}>
                      {fmt(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {expM && (
        <Modal title="Nova Despesa" onClose={() => setExpM(false)}>
          <ExpForm
            onSubmit={(e) => {
              dispatch({ type: 'ADD_EXP', exp: e });
              setExpM(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
function ExpForm({ onSubmit }) {
  const [f, sF] = useState({ desc: '', cat: 'Manutenção', amount: 0 });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  const cats = ['Manutenção', 'Limpeza', 'Alimentação', 'Salários', 'Utilidades', 'Marketing', 'Suprimentos', 'Outros'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Descrição" value={f.desc} onChange={(e) => u('desc', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Sel label="Categoria" value={f.cat} onChange={(e) => u('cat', e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Sel>
        <Input label="Valor (R$)" type="number" value={f.amount} onChange={(e) => u('amount', +e.target.value)} />
      </div>
      <Btn v="primary" full icon="add" disabled={!f.desc || !f.amount} onClick={() => onSubmit(f)}>
        Registrar Despesa
      </Btn>
    </div>
  );
}

// ═══════ REPORTS ═══════
function Reports({ rooms, history, expenses }) {
  const guests = allGuests(rooms);
  const rev = guests.reduce((s, g) => s + paid(g), 0);
  const pend = guests.reduce((s, g) => s + bal(g), 0);
  const totalExp = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const occ = rooms.filter((r) => r.status === 'occupied').length;
  const tot = rooms.length;
  const sharedBeds = rooms.filter((r) => r.type === 'shared').reduce((s, r) => s + (r.beds?.total || 0), 0);
  const sharedOcc = rooms.filter((r) => r.type === 'shared').reduce((s, r) => s + (r.beds?.guests.length || 0), 0);
  const privRooms = rooms.filter((r) => r.type !== 'shared');
  const privOcc = privRooms.filter((r) => r.status === 'occupied').length;
  const avgDaily = occ > 0 ? rev / occ : 0;
  const revPAR = tot > 0 ? rev / tot : 0;
  const avgStay = guests.length > 0 ? guests.reduce((s, g) => s + diffD(g.checkin, g.checkout), 0) / guests.length : 0;
  const intlGuests = guests.filter((g) => g.nationality && g.nationality !== 'Brasileira').length;

  const byType = Object.entries(TYPES).map(([k, v]) => {
    const tR = rooms.filter((r) => r.type === k);
    const tG = guests.filter((g) => g.roomType === k);
    const tRev = tG.reduce((s, g) => s + paid(g), 0);
    const tPend = tG.reduce((s, g) => s + bal(g), 0);
    let tOcc;
    if (k === 'shared') {
      tOcc = tR.reduce((s, r) => s + (r.beds?.guests.length || 0), 0);
      const tTotal = tR.reduce((s, r) => s + (r.beds?.total || 0), 0);
      return {
        type: v,
        units: tTotal + ' camas',
        occ: tOcc,
        guests: tG.length,
        rev: tRev,
        pend: tPend,
        rate: tTotal ? pct(tOcc, tTotal) : 0,
      };
    }
    tOcc = tR.filter((r) => r.status === 'occupied').length;
    return {
      type: v,
      units: tR.length + ' quartos',
      occ: tOcc,
      guests: tG.length,
      rev: tRev,
      pend: tPend,
      rate: tR.length ? pct(tOcc, tR.length) : 0,
    };
  });

  const floors = [...new Set(rooms.map((r) => r.floor))].sort().map((f) => {
    const fR = rooms.filter((r) => r.floor === f);
    const fO = fR.filter((r) => r.status === 'occupied').length;
    return {
      floor: f === 0 ? 'Térreo' : f + 'º Andar',
      rooms: fR.length,
      occ: fO,
      rate: fR.length ? pct(fO, fR.length) : 0,
    };
  });

  const nationData = {};
  guests.forEach((g) => {
    const n = g.nationality || 'N/A';
    nationData[n] = (nationData[n] || 0) + 1;
  });
  const nationChart = Object.entries(nationData)
    .map(([k, v]) => ({ name: k, valor: v }))
    .sort((a, b) => b.valor - a.valor);
  const nColors = [C.primary, C.accent, C.purple, C.warn, C.danger, C.cyan, C.rose, C.orange];

  const TH = ({ children }) => (
    <th
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: 11,
        fontWeight: 700,
        color: C.textDim,
        textTransform: 'uppercase',
        letterSpacing: '.5px',
        borderBottom: '2px solid ' + C.borderLight,
        background: C.bg,
      }}
    >
      {children}
    </th>
  );
  const TD = ({ children, color, bold }) => (
    <td
      style={{
        padding: '12px 16px',
        fontSize: 13,
        color: color || C.textSec,
        fontWeight: bold ? 700 : 400,
        borderBottom: '1px solid ' + C.borderLight,
      }}
    >
      {children}
    </td>
  );

  return (
    <div>
      <PageHead title="Relatórios" sub="Análise completa da operação" />
      <div
        className="af"
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 24,
          border: '1px solid ' + C.borderLight,
          boxShadow: C.shadow,
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <I name="analytics" size={20} color={C.primary} />
          Indicadores (KPIs)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(135px,1fr))', gap: 16 }}>
          {[
            { l: 'Total Quartos', v: tot },
            { l: 'Ocupação Geral', v: pct(occ, tot) + '%', c: C.primary },
            { l: 'Quartos Priv. Ocup.', v: privOcc + '/' + privRooms.length, c: C.primary },
            { l: 'Camas Dorm Ocup.', v: sharedOcc + '/' + sharedBeds, c: C.cyan },
            { l: 'Hóspedes Ativos', v: guests.length, c: C.accent },
            { l: 'Hósp. Internacionais', v: intlGuests, c: C.purple },
            { l: 'Receita Total', v: fmt(rev), c: C.accent },
            { l: 'Pendente', v: fmt(pend), c: C.warn },
            { l: 'Despesas', v: fmt(totalExp), c: C.danger },
            { l: 'Lucro Líquido', v: fmt(rev - totalExp), c: rev - totalExp >= 0 ? C.accent : C.danger },
            { l: 'ADR (Diária Média)', v: fmt(avgDaily), c: C.primary },
            { l: 'RevPAR', v: fmt(revPAR), c: C.primary },
            { l: 'Estadia Média', v: avgStay.toFixed(1) + ' noites', c: C.cyan },
          ].map((x, i) => (
            <div key={i}>
              <div
                style={{
                  fontSize: 10,
                  color: C.textDim,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                  marginBottom: 4,
                }}
              >
                {x.l}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: x.c || C.text }}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 24,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
            overflowX: 'auto',
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.text,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <I name="category" size={20} color={C.primary} />
            Por Tipo de Quarto
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 550 }}>
            <thead>
              <tr>
                <TH>Tipo</TH>
                <TH>Unidades</TH>
                <TH>Ocup.</TH>
                <TH>Hósp.</TH>
                <TH>Taxa</TH>
                <TH>Receita</TH>
                <TH>Pend.</TH>
              </tr>
            </thead>
            <tbody>
              {byType.map((r, i) => (
                <tr key={i}>
                  <TD color={C.text} bold>
                    {r.type}
                  </TD>
                  <TD>{r.units}</TD>
                  <TD>{r.occ}</TD>
                  <TD>{r.guests}</TD>
                  <TD color={r.rate > 70 ? C.accent : r.rate > 40 ? C.warn : C.danger} bold>
                    {r.rate}%
                  </TD>
                  <TD color={C.accent} bold>
                    {fmt(r.rev)}
                  </TD>
                  <TD color={r.pend > 0 ? C.warn : C.textDim}>{fmt(r.pend)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 24,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.text,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <I name="public" size={20} color={C.purple} />
            Nacionalidades
          </h3>
          {nationChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={nationChart}
                  dataKey="valor"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  strokeWidth={2}
                  stroke={C.white}
                >
                  {nationChart.map((_, i) => (
                    <Cell key={i} fill={nColors[i % nColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: C.white,
                    border: '1px solid ' + C.border,
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: C.textDim, textAlign: 'center', padding: 40 }}>Sem dados</div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            {nationChart.map((n, i) => (
              <span key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: nColors[i % nColors.length] }} />
                {n.name}: <strong>{n.valor}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="af"
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 24,
          border: '1px solid ' + C.borderLight,
          boxShadow: C.shadow,
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <I name="apartment" size={20} color={C.primary} />
          Ocupação por Andar
        </h3>
        {floors.map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.floor}</span>
              <span style={{ fontSize: 12, color: C.textSec }}>
                {f.occ}/{f.rooms} ({f.rate}%)
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: C.bg }}>
              <div
                style={{
                  width: f.rate + '%',
                  height: '100%',
                  borderRadius: 5,
                  background: f.rate > 70 ? C.accent : f.rate > 40 ? C.warn : C.danger,
                  transition: 'width .5s',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="af"
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 24,
          border: '1px solid ' + C.borderLight,
          boxShadow: C.shadow,
          overflowX: 'auto',
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <I name="group" size={20} color={C.primary} />
          Detalhamento de Hóspedes
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <TH>Hóspede</TH>
              <TH>Quarto</TH>
              <TH>Nacional.</TH>
              <TH>Entrada</TH>
              <TH>Saída</TH>
              <TH>Noites</TH>
              <TH>Total</TH>
              <TH>Pago</TH>
              <TH>Saldo</TH>
            </tr>
          </thead>
          <tbody>
            {guests.map((g, i) => (
              <tr key={i}>
                <TD color={C.text} bold>
                  {g.name}
                </TD>
                <TD>{g.roomName}</TD>
                <TD>{g.nationality || '—'}</TD>
                <TD>{fmtD(g.checkin)}</TD>
                <TD>{fmtD(g.checkout)}</TD>
                <TD>{diffD(g.checkin, g.checkout)}</TD>
                <TD>{fmt(g.total)}</TD>
                <TD color={C.accent} bold>
                  {fmt(paid(g))}
                </TD>
                <TD color={bal(g) > 0 ? C.danger : C.accent} bold>
                  {fmt(bal(g))}
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════ AUDIT ═══════
function Audit({ history }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const types = AUDIT_TYPES;
  const filtered = (filter === 'all' ? history : history.filter((h) => h.type === filter)).filter(
    (h) =>
      !search || [h.guest, h.room, h.user, h.type].some((x) => (x || '').toLowerCase().includes(search.toLowerCase())),
  );
  const stats = {};
  history.forEach((h) => {
    stats[h.type] = (stats[h.type] || 0) + 1;
  });
  return (
    <div>
      <PageHead title="Auditoria" sub={history.length + ' registros de atividade'} />
      <div
        className="af"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {Object.entries(types)
          .filter(([k]) => stats[k])
          .map(([k, v]) => (
            <div
              key={k}
              onClick={() => setFilter(filter === k ? 'all' : k)}
              className="hc"
              style={{
                background: filter === k ? v.c + '12' : C.white,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
                border: '1px solid ' + (filter === k ? v.c + '40' : C.borderLight),
                textAlign: 'center',
                transition: 'all .15s',
              }}
            >
              <I name={v.ic} size={20} color={v.c} />
              <div style={{ fontSize: 18, fontWeight: 800, color: v.c, marginTop: 4 }}>{stats[k]}</div>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: 'uppercase' }}>{v.l}</div>
            </div>
          ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <I
            name="search"
            size={18}
            color={C.textDim}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            placeholder="Buscar atividade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: 12,
              border: '1px solid ' + C.border,
              background: C.white,
              color: C.text,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {filter !== 'all' && (
          <Btn sm v="ghost" icon="close" onClick={() => setFilter('all')}>
            Limpar filtro
          </Btn>
        )}
      </div>
      {filtered.length === 0 && (
        <EmptyState icon="history" title="Nenhum registro" desc="As atividades aparecerão aqui" />
      )}
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          border: '1px solid ' + C.borderLight,
          boxShadow: C.shadow,
          overflow: 'hidden',
        }}
      >
        {filtered.map((h, i) => {
          const t = types[h.type] || { l: h.type, ic: 'info', c: C.textSec };
          return (
            <div
              key={i}
              className="as"
              onClick={() => setDetail(h)}
              style={{
                display: 'flex',
                gap: 14,
                padding: '14px 20px',
                borderBottom: '1px solid ' + C.borderLight,
                cursor: 'pointer',
                animationDelay: Math.min(i * 0.02, 0.5) + 's',
                transition: 'background .15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.bg)}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: t.c + '12',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <I name={t.ic} size={20} color={t.c} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.l}</span>
                  <span style={{ fontSize: 11, color: C.textDim, whiteSpace: 'nowrap' }}>{h.date}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                  {h.guest}
                  {h.room && h.room !== '—' ? ' · ' + h.room : ''}
                </div>
                {h.amount && (
                  <div style={{ fontSize: 12, color: C.warn, fontWeight: 600, marginTop: 2 }}>
                    {fmt(h.amount)} via {h.method}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                  por {h.user || 'Sistema'}
                  {h.ip ? ' · IP: ' + h.ip : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {detail && (
        <Modal title="Detalhes da Atividade" onClose={() => setDetail(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                l: 'Tipo',
                v: (types[detail.type] || { l: detail.type }).l,
                ic: (types[detail.type] || { ic: 'info' }).ic,
                c: (types[detail.type] || { c: C.textSec }).c,
              },
              { l: 'Data/Hora', v: detail.date, ic: 'schedule', c: C.primary },
              { l: 'Descrição', v: detail.guest, ic: 'description', c: C.text },
              { l: 'Quarto', v: detail.room || '—', ic: 'meeting_room', c: C.purple },
              { l: 'Usuário', v: detail.user || 'Sistema', ic: 'person', c: C.accent },
              { l: 'IP', v: detail.ip || '—', ic: 'language', c: C.textSec },
              ...(detail.amount
                ? [{ l: 'Valor', v: fmt(detail.amount) + ' via ' + (detail.method || '—'), ic: 'payments', c: C.warn }]
                : []),
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid ' + C.borderLight,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: row.c + '12',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <I name={row.ic} size={18} color={row.c} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: 'uppercase' }}>
                    {row.l}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{row.v}</div>
                </div>
              </div>
            ))}
            <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 12, color: C.textDim }}>
              ID: {detail.id}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════ SETTINGS ═══════
function Settings({ config, users, dispatch }) {
  const [tab, setTab] = useState('hotel');
  const [addU, setAddU] = useState(false);
  const [editU, setEditU] = useState(null);
  const [cf, setCf] = useState(config);
  const u = (k, v) => setCf((p) => ({ ...p, [k]: v }));
  const saveConfig = () => dispatch({ type: 'UPD_CONFIG', data: cf });

  return (
    <div>
      <PageHead title="Configurações" sub="Gerenciamento do sistema" />
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { k: 'hotel', l: 'Dados do Hotel', ic: 'business' },
          { k: 'operation', l: 'Operação', ic: 'tune' },
          { k: 'users', l: 'Usuários', ic: 'group' },
          { k: 'notifications', l: 'Notificações', ic: 'notifications' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 12,
              border: tab === t.k ? 'none' : '1px solid ' + C.border,
              cursor: 'pointer',
              background: tab === t.k ? C.primary : C.white,
              color: tab === t.k ? '#fff' : C.textSec,
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              transition: 'all .15s',
            }}
          >
            <I name={t.ic} size={16} color={tab === t.k ? '#fff' : C.textDim} />
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'hotel' && (
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 24,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Dados do Hotel</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Nome do Hotel" value={cf.hotelName} onChange={(e) => u('hotelName', e.target.value)} />
            </div>
            <Input label="CNPJ" value={cf.hotelDoc} onChange={(e) => u('hotelDoc', e.target.value)} />
            <Input label="Telefone" value={cf.hotelPhone} onChange={(e) => u('hotelPhone', e.target.value)} />
            <Input label="Email" value={cf.hotelEmail} onChange={(e) => u('hotelEmail', e.target.value)} />
            <Input label="Fuso horário" value={cf.timezone} onChange={(e) => u('timezone', e.target.value)} />
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Endereço" value={cf.hotelAddress} onChange={(e) => u('hotelAddress', e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn v="primary" icon="save" onClick={saveConfig}>
              Salvar Alterações
            </Btn>
          </div>
        </div>
      )}

      {tab === 'operation' && (
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 24,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Configurações de Operação</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Horário Check-in"
              type="time"
              value={cf.checkInTime}
              onChange={(e) => u('checkInTime', e.target.value)}
            />
            <Input
              label="Horário Check-out"
              type="time"
              value={cf.checkOutTime}
              onChange={(e) => u('checkOutTime', e.target.value)}
            />
            <Input
              label="Taxa ISS (%)"
              type="number"
              value={cf.taxRate}
              onChange={(e) => u('taxRate', +e.target.value)}
            />
            <Input
              label="Multa atraso (R$)"
              type="number"
              value={cf.lateFee}
              onChange={(e) => u('lateFee', +e.target.value)}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Automações</div>
            {[
              { k: 'autoHK', l: 'Criar tarefa de governança automaticamente após check-out', ic: 'cleaning_services' },
              { k: 'emailNotify', l: 'Enviar notificações por email', ic: 'email' },
              { k: 'smsNotify', l: 'Enviar notificações por SMS', ic: 'sms' },
            ].map((t) => (
              <label
                key={t.k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 8,
                  background: cf[t.k] ? C.accentLight : C.bg,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  border: '1px solid ' + (cf[t.k] ? C.accent + '30' : C.borderLight),
                }}
                onClick={() => u(t.k, !cf[t.k])}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: '2px solid ' + (cf[t.k] ? C.accent : C.border),
                    background: cf[t.k] ? C.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {cf[t.k] && <I name="check" size={14} color="#fff" />}
                </div>
                <I name={t.ic} size={18} color={cf[t.k] ? C.accentDark : C.textDim} />
                <span style={{ fontSize: 13, color: cf[t.k] ? C.text : C.textSec, fontWeight: cf[t.k] ? 600 : 400 }}>
                  {t.l}
                </span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn v="primary" icon="save" onClick={saveConfig}>
              Salvar Alterações
            </Btn>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Gestão de Usuários</h3>
            <Btn v="primary" icon="person_add" onClick={() => setAddU(true)}>
              Novo Usuário
            </Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(users || []).map((usr, i) => (
              <div
                key={usr.id}
                className="as hc"
                style={{
                  background: C.white,
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid ' + C.borderLight,
                  boxShadow: C.shadow,
                  animationDelay: i * 0.04 + 's',
                  opacity: usr.active ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: usr.active ? C.primaryLight : C.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 800,
                        color: usr.active ? C.primary : C.textDim,
                      }}
                    >
                      {usr.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{usr.name}</div>
                      <div style={{ fontSize: 12, color: C.textDim }}>{usr.email}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 6,
                            background: C.primaryLight,
                            color: C.primary,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {ROLES[usr.role]?.l || usr.role}
                        </span>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 6,
                            background: usr.active ? C.accentLight : C.dangerLight,
                            color: usr.active ? C.accentDark : C.danger,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {usr.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <div style={{ fontSize: 11, color: C.textDim }}>Último acesso</div>
                      <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{usr.lastLogin}</div>
                    </div>
                    <Btn
                      xs
                      v={usr.active ? 'softWarn' : 'softAccent'}
                      icon={usr.active ? 'block' : 'check_circle'}
                      onClick={() => dispatch({ type: 'TOGGLE_USER', uid: usr.id })}
                    >
                      {usr.active ? 'Desativar' : 'Ativar'}
                    </Btn>
                    {usr.role !== 'admin' && (
                      <Btn xs v="softDanger" icon="delete" onClick={() => dispatch({ type: 'DEL_USER', uid: usr.id })}>
                        Remover
                      </Btn>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: '10px 14px', background: C.bg, borderRadius: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textDim,
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '.5px',
                    }}
                  >
                    Permissões
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(ROLES[usr.role]?.perms || []).map((p, j) => (
                      <span
                        key={j}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          background: C.white,
                          color: C.textSec,
                          fontSize: 11,
                          border: '1px solid ' + C.borderLight,
                        }}
                      >
                        {p === 'all' ? 'Acesso total' : p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {addU && (
            <Modal title="Novo Usuário" onClose={() => setAddU(false)}>
              <UserForm
                onSubmit={(usr) => {
                  dispatch({ type: 'ADD_USER', user: usr });
                  setAddU(false);
                }}
              />
            </Modal>
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <div
          className="af"
          style={{
            background: C.white,
            borderRadius: 16,
            padding: 24,
            border: '1px solid ' + C.borderLight,
            boxShadow: C.shadow,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Central de Notificações</h3>
          {[
            {
              title: 'Check-in / Check-out',
              desc: 'Notificações quando hóspedes fazem check-in ou check-out',
              icon: 'swap_horiz',
              enabled: true,
            },
            {
              title: 'Pagamentos',
              desc: 'Alertas de novos pagamentos e saldos pendentes',
              icon: 'payments',
              enabled: true,
            },
            {
              title: 'Governança',
              desc: 'Atualizações sobre tarefas de limpeza concluídas',
              icon: 'cleaning_services',
              enabled: cf.autoHK,
            },
            { title: 'Reservas', desc: 'Novas reservas e cancelamentos', icon: 'event', enabled: true },
            { title: 'Manutenção', desc: 'Alertas de quartos em manutenção', icon: 'build', enabled: false },
          ].map((n, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px',
                borderRadius: 12,
                marginBottom: 8,
                background: C.bg,
                border: '1px solid ' + C.borderLight,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: n.enabled ? C.primaryLight : C.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <I name={n.icon} size={20} color={n.enabled ? C.primary : C.textDim} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{n.desc}</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: n.enabled ? C.accent : C.border,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all .2s',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: C.white,
                    position: 'absolute',
                    top: 2,
                    left: n.enabled ? 22 : 2,
                    transition: 'left .2s',
                    boxShadow: C.shadow,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserForm({ onSubmit }) {
  const [f, sF] = useState({ name: '', email: '', role: 'receptionist', password: '' });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Nome completo" value={f.name} onChange={(e) => u('name', e.target.value)} />
      <Input label="Email" type="email" value={f.email} onChange={(e) => u('email', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Sel label="Perfil" value={f.role} onChange={(e) => u('role', e.target.value)}>
          {Object.entries(ROLES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.l}
            </option>
          ))}
        </Sel>
        <Input
          label="Senha inicial"
          type="password"
          value={f.password}
          onChange={(e) => u('password', e.target.value)}
        />
      </div>
      <div style={{ background: C.bg, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginBottom: 6, textTransform: 'uppercase' }}>
          Permissões do perfil
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(ROLES[f.role]?.perms || []).map((p, i) => (
            <span
              key={i}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                background: C.white,
                color: C.textSec,
                fontSize: 11,
                border: '1px solid ' + C.borderLight,
              }}
            >
              {p === 'all' ? 'Acesso total' : p}
            </span>
          ))}
        </div>
      </div>
      <Btn v="primary" full icon="person_add" disabled={!f.name || !f.email} onClick={() => onSubmit(f)}>
        Criar Usuário
      </Btn>
    </div>
  );
}

// ═══════ MAIN APP ═══════
export default function EasyPMS() {
  const [state, dispatch] = useReducer(reducer, {
    rooms: mkRooms(),
    history: mkHistory(),
    expenses: mkExpenses(),
    housekeeping: mkHK(),
    users: mkUsers(),
    config: mkConfig(),
    currentUser: 'Admin',
  });
  const [tab, setTab] = useState('dashboard');
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.text }}>
      <style>{CSS}</style>
      {!isMobile && <Sidebar active={tab} onChange={setTab} rooms={state.rooms} />}
      {isMobile && (
        <header
          style={{
            background: C.white,
            borderBottom: '1px solid ' + C.border,
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg,' + C.primary + ',' + C.accent + ')',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <I name="hotel" size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Easy PMS</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn xs v="ghost" icon="analytics" onClick={() => setTab('reports')} />
            <Btn xs v="ghost" icon="verified_user" onClick={() => setTab('audit')} />
          </div>
        </header>
      )}
      <main style={{ marginLeft: isMobile ? 0 : 240, padding: isMobile ? '16px 16px 80px' : '32px', maxWidth: 1200 }}>
        {tab === 'dashboard' && (
          <Dashboard
            rooms={state.rooms}
            history={state.history}
            expenses={state.expenses}
            hk={state.housekeeping}
            onNav={setTab}
          />
        )}
        {tab === 'reservations' && <Reservations rooms={state.rooms} dispatch={dispatch} />}
        {tab === 'rooms' && <Rooms rooms={state.rooms} dispatch={dispatch} />}
        {tab === 'guests' && <Guests rooms={state.rooms} dispatch={dispatch} />}
        {tab === 'housekeeping' && <Housekeeping hk={state.housekeeping} dispatch={dispatch} rooms={state.rooms} />}
        {tab === 'financial' && <Financial rooms={state.rooms} expenses={state.expenses} dispatch={dispatch} />}
        {tab === 'reports' && <Reports rooms={state.rooms} history={state.history} expenses={state.expenses} />}
        {tab === 'audit' && <Audit history={state.history} />}
        {tab === 'settings' && <Settings config={state.config} users={state.users} dispatch={dispatch} />}
      </main>
      {isMobile && <MobileNav active={tab} onChange={setTab} />}
    </div>
  );
}
