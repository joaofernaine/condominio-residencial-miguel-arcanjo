/**
 * DATA STUBS — Estruturas e tipos das telas do Portal do Condomínio.
 *
 * ⚠️ Todos os dados hardcoded foram REMOVIDOS. As telas estão prontas para
 *    receber dados reais via Supabase (ver `src/lib/supabase.ts`).
 *
 * Substitua cada array/objeto vazio abaixo por queries reais:
 *   - React Query (`useQuery`) para leitura
 *   - `supabase.from(...).insert/update/delete` para escrita
 */

import type { ComponentType } from "react";

// ----------------- TYPES -----------------

export type Role = "resident" | "admin";
export type FinancialStatus = "Em dia" | "Pendente" | "Atrasado";
export type ReservationStatus = "Pendente" | "Confirmada" | "Recusada";

export type Poll = {
  id: string;
  question: string;
  detail: string;
  yes: number;
  no: number;
  votedBy: string[];
};

export type Apartment = {
  unit: string;
  resident: string;
  status: FinancialStatus;
};

export type ResidentAccount = {
  email: string;
  name: string;
  createdAt: string;
};

export type Reservation = {
  id: string;
  unit: string;
  resident: string;
  email: string;
  spaceId: string;
  spaceName: string;
  date: string; // ISO yyyy-mm-dd
  status: ReservationStatus;
  reason?: string;
  createdAt: string;
};

export type VoteRecord = {
  unit: string;
  resident: string;
  choice: "yes" | "no";
  timestamp: string;
};

export type Amenity = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

export type PublicNotice = {
  tag: string;
  date: string;
  title: string;
  body: string;
};

export type ProjectMilestone = {
  pct: number;
  date: string;
  caption: string;
  color: string;
};

export type ProjectEntry = {
  title: string;
  date: string;
  detail: string;
  progress: number;
  milestones?: ProjectMilestone[];
};

export type ReservationSpace = {
  id: string;
  name: string;
  capacity: string;
  price: string;
};

export type DocumentEntry = { title: string; size: string };
export type DocumentMonth = { key: string; name: string; docs: DocumentEntry[] };
export type DocumentYear = { year: number; months: DocumentMonth[] };

export type Classified = {
  tag: string;
  title: string;
  body: string;
  author: string;
  contact: string;
};

// ----------------- STATIC CONFIG (UI/i18n) -----------------

export const FIRST_ACCESS_EMAIL = "";
export const FIRST_ACCESS_TEMP_PASSWORD = "";

export const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const MONTH_NAMES_PT_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const RESERVATION_STATUS_STYLES: Record<ReservationStatus, string> = {
  Pendente: "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/30",
  Confirmada: "bg-[color:var(--sage)]/15 text-[color:var(--sage)] border-[color:var(--sage)]/30",
  Recusada: "bg-destructive/10 text-destructive border-destructive/30",
};

// ----------------- DATA STUBS (vazios — plugar no Supabase) -----------------

// TODO: SELECT em `amenities` (icon_key, title, body)
export const amenities: Amenity[] = [];

// TODO: SELECT em `notices` WHERE is_public = true
export const publicNotices: PublicNotice[] = [];

// TODO: SELECT em `projects` agrupado por status
export const projects: {
  completed: ProjectEntry[];
  inProgress: ProjectEntry[];
  planned: ProjectEntry[];
} = {
  completed: [],
  inProgress: [],
  planned: [],
};

// TODO: SELECT em `documents` agrupado por ano/mês
export const DOCUMENTS_BY_YEAR: DocumentYear[] = [];

// TODO: SELECT em `reservation_spaces`
export const RESERVATION_SPACES: ReservationSpace[] = [];

// TODO: SELECT date FROM `reservations` WHERE status = 'Confirmada'
export const RESERVED_DATES = new Set<string>();

// TODO: SELECT em `classifieds`
export const CLASSIFIEDS: Classified[] = [];

// TODO: SELECT em `polls` (agregados yes/no via RPC ou view)
export const INITIAL_POLLS: Poll[] = [];

// TODO: SELECT em `poll_votes` JOIN `apartments` (admin-only via RLS)
export const MOCK_VOTE_DETAILS: Record<string, VoteRecord[]> = {};

// TODO: SELECT em `reservations`
export const INITIAL_RESERVATIONS: Reservation[] = [];

// TODO: SELECT em `apartments`
export const INITIAL_APARTMENTS: Apartment[] = [];

// TODO: SELECT em `profiles` (nomes/emails) — auth via `auth.users`
export const INITIAL_RESIDENTS: ResidentAccount[] = [];
