import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with CPF, phone and credits_balance for the clinic system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Opcional agora (para compatibilidade)
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(), // Email único (obrigatório no registro)
  password: varchar("password", { length: 255 }), // Hash da senha (bcrypt)
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(), // CPF para controle de aula experimental
  phone: varchar("phone", { length: 20 }), // Telefone de contato
  creditsBalance: int("creditsBalance").default(0).notNull(), // Saldo de créditos
  hasTrialClass: boolean("hasTrialClass").default(false).notNull(), // Já fez aula experimental
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Units (Unidades) - Physical locations of the clinic
 */
export const units = mysqlTable("units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

/**
 * Rooms (Salas) - Rooms within units
 */
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  maxCapacity: int("maxCapacity").default(4).notNull(), // Máximo de alunos por horário
  isGroupOnly: boolean("isGroupOnly").default(true).notNull(), // Se aceita apenas aulas em grupo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Professionals (Profissionais) - Doctors/instructors assigned to rooms
 */
export const professionals = mysqlTable("professionals", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(), // Nome completo
  bio: text("bio"), // Biografia
  photoUrl: text("photoUrl"), // URL da foto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = typeof professionals.$inferInsert;

/**
 * Plans (Planos) - Subscription plans with different frequencies
 */
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  frequency: mysqlEnum("frequency", ["1x", "2x", "3x"]).notNull(), // Frequência semanal
  duration: mysqlEnum("duration", ["monthly", "quarterly", "semester"]).notNull(),
  totalClasses: int("totalClasses").notNull(), // Total de aulas no plano
  priceInCents: int("priceInCents").notNull(), // Preço em centavos
  installments: int("installments").default(1).notNull(), // Número de parcelas
  installmentPriceInCents: int("installmentPriceInCents").notNull(), // Valor da parcela em centavos
  credits: int("credits").notNull(), // Créditos que o plano adiciona
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

/**
 * Appointments (Agendamentos) - Scheduled classes
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  unitId: int("unitId").notNull(),
  roomId: int("roomId").notNull(),
  professionalId: int("professionalId").notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(), // Data e hora do agendamento
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  type: mysqlEnum("type", ["trial", "single", "plan"]).notNull(), // Tipo: experimental, avulsa, plano
  cancelledAt: timestamp("cancelledAt"),
  cancelledBy: int("cancelledBy"), // ID do usuário que cancelou (pode ser admin)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Credit Transactions (Transações de Créditos) - Track all credit movements
 */
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // Pode ser positivo (adição) ou negativo (consumo)
  type: mysqlEnum("type", ["plan_purchase", "single_purchase", "appointment_booking", "appointment_cancellation", "manual_adjustment"]).notNull(),
  description: text("description"),
  appointmentId: int("appointmentId"), // Referência ao agendamento (se aplicável)
  purchaseId: int("purchaseId"), // Referência à compra (se aplicável)
  balanceAfter: int("balanceAfter").notNull(), // Saldo após a transação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * Purchases (Compras) - Track all purchases (plans and single classes)
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["plan", "single"]).notNull(),
  planId: int("planId"), // Se for compra de plano
  amountInCents: int("amountInCents").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** Set for plan purchases billed via Stripe Subscriptions (monthly installments). */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  creditsAdded: int("creditsAdded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Operating Hours (Horários de Funcionamento) - Define when the clinic operates
 */
export const operatingHours = mysqlTable("operatingHours", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  openTime: varchar("openTime", { length: 5 }).notNull(), // Formato HH:MM
  closeTime: varchar("closeTime", { length: 5 }).notNull(), // Formato HH:MM
  isOpen: boolean("isOpen").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperatingHour = typeof operatingHours.$inferSelect;
export type InsertOperatingHour = typeof operatingHours.$inferInsert;

/**
 * Manual Payments (Pagamentos Manuais) - Track manual payments (cash/PIX) confirmed by admin
 */
export const manualPayments = mysqlTable("manualPayments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  amountInCents: int("amountInCents").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "pix", "transfer"]).notNull(),
  creditsAdded: int("creditsAdded").notNull(),
  confirmedBy: int("confirmedBy").notNull(), // Admin user ID
  notes: text("notes"), // Observações
  planStartDate: timestamp("planStartDate"), // Data de início do plano
  planEndDate: timestamp("planEndDate"), // Data de término do plano
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ManualPayment = typeof manualPayments.$inferSelect;
export type InsertManualPayment = typeof manualPayments.$inferInsert;

/**
 * Recurring Schedules - Agendamentos recorrentes (ex: toda terça e quinta às 9h)
 */
export const recurringSchedules = mysqlTable("recurringSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  unitId: int("unitId").notNull(),
  roomId: int("roomId").notNull(),
  professionalId: int("professionalId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Domingo, 1=Segunda, ..., 6=Sábado
  time: varchar("time", { length: 5 }).notNull(), // Formato HH:MM (ex: "09:00")
  isActive: boolean("isActive").default(true).notNull(), // Se está ativo ou pausado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(), // ID do admin que criou
});

export type RecurringSchedule = typeof recurringSchedules.$inferSelect;
export type InsertRecurringSchedule = typeof recurringSchedules.$inferInsert;


/**
 * Password Reset Tokens - For password recovery flow
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Blocked Time Slots - Admin can block specific time slots to prevent bookings
 */
export const blockedTimeSlots = mysqlTable("blockedTimeSlots", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  roomId: int("roomId").notNull(),
  professionalId: int("professionalId").notNull(),
  blockedDate: timestamp("blockedDate").notNull(), // Data e hora do bloqueio
  reason: text("reason"), // Motivo do bloqueio (ex: "Profissional indisponível")
  createdBy: int("createdBy").notNull(), // Admin que criou o bloqueio
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockedTimeSlot = typeof blockedTimeSlots.$inferSelect;
export type InsertBlockedTimeSlot = typeof blockedTimeSlots.$inferInsert;
