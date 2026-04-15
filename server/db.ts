import {
  eq,
  and,
  gte,
  lte,
  lt,
  desc,
  asc,
  sql,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  count,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  units,
  rooms,
  professionals,
  planOffers,
  planCatalog,
  planFrequencies,
  planDurations,
  planTypes,
  planUnits,
  appointments,
  creditTransactions,
  purchases,
  operatingHours,
  InsertUnit,
  Unit,
  InsertRoom,
  Room,
  InsertProfessional,
  InsertAppointment,
  InsertCreditTransaction,
  InsertPurchase,
  InsertOperatingHour,
  type Purchase,
  type Appointment,
} from "../drizzle/schema";
import type { Plan } from "../drizzle/schema";
import { ENV } from "./_core/env";

export type PlanWithUnits = Plan & {
  units: { id: number; name: string }[];
};

/** Admin: inclui vínculos plano↔unidade com soft-delete em `planUnits` */
export type PlanWithUnitsAdmin = PlanWithUnits & {
  inactiveLinkedUnits: { id: number; name: string }[];
  /** `planTypes.label` do catálogo */
  planTypeCatalogLabel: string;
  planTypeOccupiesWholeRoom: boolean;
};

async function fetchUnitsByPlanIds(
  planIds: number[],
): Promise<Map<number, { id: number; name: string }[]>> {
  const db = await getDb();
  const byPlan = new Map<number, { id: number; name: string }[]>();
  if (!db || planIds.length === 0) return byPlan;

  const rows = await db
    .select({
      planOfferId: planUnits.planOfferId,
      unitId: units.id,
      unitName: units.name,
    })
    .from(planUnits)
    .innerJoin(units, eq(planUnits.unitId, units.id))
    .where(
      and(
        inArray(planUnits.planOfferId, planIds),
        isNull(planUnits.deletedAt),
        isNull(units.deletedAt),
      ),
    );

  for (const r of rows) {
    const list = byPlan.get(r.planOfferId) ?? [];
    list.push({ id: r.unitId, name: r.unitName });
    byPlan.set(r.planOfferId, list);
  }
  return byPlan;
}

/** Vínculos com `planUnits.deletedAt` preenchido (unidade ainda ativa) — só admin */
async function fetchInactiveLinkedUnitsByPlanIds(
  planIds: number[],
): Promise<Map<number, { id: number; name: string }[]>> {
  const db = await getDb();
  const byPlan = new Map<number, { id: number; name: string }[]>();
  if (!db || planIds.length === 0) return byPlan;

  const rows = await db
    .select({
      planOfferId: planUnits.planOfferId,
      unitId: units.id,
      unitName: units.name,
    })
    .from(planUnits)
    .innerJoin(units, eq(planUnits.unitId, units.id))
    .where(
      and(
        inArray(planUnits.planOfferId, planIds),
        isNotNull(planUnits.deletedAt),
        isNull(units.deletedAt),
      ),
    );

  for (const r of rows) {
    const list = byPlan.get(r.planOfferId) ?? [];
    list.push({ id: r.unitId, name: r.unitName });
    byPlan.set(r.planOfferId, list);
  }
  return byPlan;
}

let _db: ReturnType<typeof drizzle> | null = null;

/** Return DB host from DATABASE_URL for logging (no password). */
export function getDatabaseHostForLog(): string {
  const u = process.env.DATABASE_URL;
  if (!u) return "(DATABASE_URL not set)";
  try {
    const url = new URL(u.replace(/^mysql:/, "http:"));
    return `${url.hostname}:${url.port || "3306"}`;
  } catch {
    return "(invalid URL)";
  }
}

/** Test DB connection and log result. Call at startup in production. */
export async function logDatabaseConnection(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Database] DATABASE_URL not set");
    return;
  }
  const host = getDatabaseHostForLog();
  try {
    const db = drizzle(url);
    await db.execute(sql`SELECT 1`);
    console.log("[Database] Connected to", host);
  } catch (err) {
    console.error("[Database] Failed to connect to", host, err);
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  // Agora aceita tanto openId (OAuth) quanto email (registro tradicional)
  if (!user.openId && !user.email) {
    throw new Error("User openId or email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Gerar email temporário para usuários OAuth sem email
    const email =
      user.email || (user.openId ? `${user.openId}@oauth.temp` : null);

    const values: InsertUser = {
      openId: user.openId || null,
      email,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "cpf",
      "phone",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCpf(cpf: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.cpf, cpf))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCredits(userId: number, newBalance: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ creditsBalance: newBalance })
    .where(eq(users.id, userId));
}

export async function markUserTrialClassUsed(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ hasTrialClass: true })
    .where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);

  return result;
}

export async function searchUsers(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .where(
      sql`${users.name} LIKE ${`%${searchTerm}%`} OR ${users.email} LIKE ${`%${searchTerm}%`} OR ${users.cpf} LIKE ${`%${searchTerm}%`}`,
    )
    .limit(50);

  return result;
}

// ==================== UNIT OPERATIONS ====================

export async function getAllUnits() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(units).where(isNull(units.deletedAt));
}

/** Unidade ativa (não excluída) — listagens e checkout */
export async function getActiveUnitById(unitId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(units)
    .where(and(eq(units.id, unitId), isNull(units.deletedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Inclui unidades excluídas (ex.: exibir nome em agendamentos antigos) */
export async function getUnitById(unitId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUnit(unit: InsertUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(units).values(unit);
  const insertId = result[0]?.insertId;
  if (!insertId) {
    throw new Error("Failed to create unit: no insert id");
  }
  return Number(insertId);
}

// ==================== ROOM OPERATIONS ====================

export async function getRoomsByUnitId(unitId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rooms).where(eq(rooms.unitId, unitId));
}

export async function getRoomById(roomId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRoom(room: InsertRoom) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(rooms).values(room);
  return result;
}

// ==================== PROFESSIONAL OPERATIONS ====================

export async function getProfessionalsByRoomId(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(professionals)
    .where(eq(professionals.roomId, roomId));
}

export async function getProfessionalById(professionalId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(professionals)
    .where(eq(professionals.id, professionalId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProfessionals() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(professionals);
}

export async function createProfessional(professional: InsertProfessional) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(professionals).values(professional);
  return result;
}

// ==================== PLAN OPERATIONS (catálogo + ofertas) ====================

function mapJoinedPlanRow(row: {
  id: number;
  catalogId: number;
  name: string;
  description: string | null;
  frequencyCode: string;
  durationCode: string;
  planTypeCode: string;
  totalClasses: number;
  priceInCents: number;
  installments: number;
  installmentPriceInCents: number;
  credits: number;
  isActive: boolean;
  createdAt: Date;
  deletedAt: Date | null;
}): Plan {
  return {
    id: row.id,
    catalogId: row.catalogId,
    name: row.name,
    description: row.description,
    frequency: row.frequencyCode as Plan["frequency"],
    duration: row.durationCode as Plan["duration"],
    planType: row.planTypeCode as Plan["planType"],
    totalClasses: row.totalClasses,
    priceInCents: row.priceInCents,
    installments: row.installments,
    installmentPriceInCents: row.installmentPriceInCents,
    credits: row.credits,
    isActive: row.isActive,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  };
}

async function resolveDimensionIds(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  codes: {
    frequency: Plan["frequency"];
    duration: Plan["duration"];
    planType: Plan["planType"];
  },
): Promise<{ frequencyId: number; durationId: number; planTypeId: number }> {
  const [fr] = await db
    .select({ id: planFrequencies.id })
    .from(planFrequencies)
    .where(eq(planFrequencies.code, codes.frequency))
    .limit(1);
  const [du] = await db
    .select({ id: planDurations.id })
    .from(planDurations)
    .where(eq(planDurations.code, codes.duration))
    .limit(1);
  const [ty] = await db
    .select({ id: planTypes.id })
    .from(planTypes)
    .where(eq(planTypes.code, codes.planType))
    .limit(1);
  if (!fr || !du || !ty) {
    throw new Error("Dimensão de plano inválida");
  }
  return {
    frequencyId: fr.id,
    durationId: du.id,
    planTypeId: ty.id,
  };
}

export async function getAllPlans(): Promise<PlanWithUnits[]> {
  const db = await getDb();
  if (!db) return [];

  const planRows = await db
    .select({
      id: planOffers.id,
      catalogId: planOffers.catalogId,
      name: planCatalog.name,
      description: planCatalog.description,
      frequencyCode: planFrequencies.code,
      durationCode: planDurations.code,
      planTypeCode: planTypes.code,
      totalClasses: planOffers.totalClasses,
      priceInCents: planOffers.priceInCents,
      installments: planOffers.installments,
      installmentPriceInCents: planOffers.installmentPriceInCents,
      credits: planOffers.credits,
      isActive: planOffers.isActive,
      createdAt: planOffers.createdAt,
      deletedAt: planOffers.deletedAt,
    })
    .from(planOffers)
    .innerJoin(planCatalog, eq(planOffers.catalogId, planCatalog.id))
    .innerJoin(planFrequencies, eq(planOffers.frequencyId, planFrequencies.id))
    .innerJoin(planDurations, eq(planOffers.durationId, planDurations.id))
    .innerJoin(planTypes, eq(planOffers.planTypeId, planTypes.id))
    .where(
      and(
        eq(planOffers.isActive, true),
        isNull(planOffers.deletedAt),
        isNull(planCatalog.deletedAt),
      ),
    );
  const ids = planRows.map((p) => p.id);
  const unitMap = await fetchUnitsByPlanIds(ids);
  return planRows.map((p) => ({
    ...mapJoinedPlanRow(p),
    units: unitMap.get(p.id) ?? [],
  }));
}

export async function getPlanById(
  planId: number,
): Promise<PlanWithUnits | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      id: planOffers.id,
      catalogId: planOffers.catalogId,
      name: planCatalog.name,
      description: planCatalog.description,
      frequencyCode: planFrequencies.code,
      durationCode: planDurations.code,
      planTypeCode: planTypes.code,
      totalClasses: planOffers.totalClasses,
      priceInCents: planOffers.priceInCents,
      installments: planOffers.installments,
      installmentPriceInCents: planOffers.installmentPriceInCents,
      credits: planOffers.credits,
      isActive: planOffers.isActive,
      createdAt: planOffers.createdAt,
      deletedAt: planOffers.deletedAt,
    })
    .from(planOffers)
    .innerJoin(planCatalog, eq(planOffers.catalogId, planCatalog.id))
    .innerJoin(planFrequencies, eq(planOffers.frequencyId, planFrequencies.id))
    .innerJoin(planDurations, eq(planOffers.durationId, planDurations.id))
    .innerJoin(planTypes, eq(planOffers.planTypeId, planTypes.id))
    .where(
      and(
        eq(planOffers.id, planId),
        isNull(planOffers.deletedAt),
        isNull(planCatalog.deletedAt),
      ),
    )
    .limit(1);
  if (result.length === 0) return undefined;
  const p = result[0];
  const unitMap = await fetchUnitsByPlanIds([planId]);
  return {
    ...mapJoinedPlanRow(p),
    units: unitMap.get(planId) ?? [],
  };
}

export type CreatePlanInput = {
  name: string;
  description?: string | null;
  frequency: Plan["frequency"];
  duration: Plan["duration"];
  planType: Plan["planType"];
  totalClasses: number;
  priceInCents: number;
  installments: number;
  installmentPriceInCents: number;
  credits: number;
  isActive?: boolean;
};

export async function createPlan(input: CreatePlanInput): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dim = await resolveDimensionIds(db, {
    frequency: input.frequency,
    duration: input.duration,
    planType: input.planType,
  });

  return await db.transaction(async (tx) => {
    const catIns = await tx.insert(planCatalog).values({
      name: input.name,
      description: input.description ?? null,
    });
    const catalogId = Number(catIns[0].insertId);

    const offIns = await tx.insert(planOffers).values({
      catalogId,
      frequencyId: dim.frequencyId,
      durationId: dim.durationId,
      planTypeId: dim.planTypeId,
      totalClasses: input.totalClasses,
      priceInCents: input.priceInCents,
      installments: input.installments,
      installmentPriceInCents: input.installmentPriceInCents,
      credits: input.credits,
      isActive: input.isActive ?? true,
    });
    return Number(offIns[0].insertId);
  });
}

export async function getAllPlansIncludingInactive(): Promise<PlanWithUnitsAdmin[]> {
  const db = await getDb();
  if (!db) return [];

  const planRows = await db
    .select({
      id: planOffers.id,
      catalogId: planOffers.catalogId,
      name: planCatalog.name,
      description: planCatalog.description,
      frequencyCode: planFrequencies.code,
      durationCode: planDurations.code,
      planTypeCode: planTypes.code,
      planTypeCatalogLabel: planTypes.label,
      planTypeOccupiesWholeRoom: planTypes.occupiesWholeRoom,
      totalClasses: planOffers.totalClasses,
      priceInCents: planOffers.priceInCents,
      installments: planOffers.installments,
      installmentPriceInCents: planOffers.installmentPriceInCents,
      credits: planOffers.credits,
      isActive: planOffers.isActive,
      createdAt: planOffers.createdAt,
      deletedAt: planOffers.deletedAt,
    })
    .from(planOffers)
    .innerJoin(planCatalog, eq(planOffers.catalogId, planCatalog.id))
    .innerJoin(planFrequencies, eq(planOffers.frequencyId, planFrequencies.id))
    .innerJoin(planDurations, eq(planOffers.durationId, planDurations.id))
    .innerJoin(planTypes, eq(planOffers.planTypeId, planTypes.id))
    .where(isNull(planOffers.deletedAt))
    .orderBy(desc(planOffers.id));
  const ids = planRows.map((p) => p.id);
  const unitMap = await fetchUnitsByPlanIds(ids);
  const inactiveMap = await fetchInactiveLinkedUnitsByPlanIds(ids);
  return planRows.map((p) => ({
    ...mapJoinedPlanRow(p),
    planTypeCatalogLabel: p.planTypeCatalogLabel,
    planTypeOccupiesWholeRoom: p.planTypeOccupiesWholeRoom,
    units: unitMap.get(p.id) ?? [],
    inactiveLinkedUnits: inactiveMap.get(p.id) ?? [],
  }));
}

export async function setUnitsForPlan(planOfferId: number, unitIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const unique = Array.from(new Set(unitIds));
  const now = new Date();

  await db.transaction(async (tx) => {
    if (unique.length === 0) {
      await tx
        .update(planUnits)
        .set({ deletedAt: now })
        .where(
          and(
            eq(planUnits.planOfferId, planOfferId),
            isNull(planUnits.deletedAt),
          ),
        );
      return;
    }

    await tx
      .update(planUnits)
      .set({ deletedAt: now })
      .where(
        and(
          eq(planUnits.planOfferId, planOfferId),
          notInArray(planUnits.unitId, unique),
          isNull(planUnits.deletedAt),
        ),
      );

    for (const uid of unique) {
      const existing = await tx
        .select()
        .from(planUnits)
        .where(
          and(
            eq(planUnits.planOfferId, planOfferId),
            eq(planUnits.unitId, uid),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await tx.insert(planUnits).values({ planOfferId, unitId: uid });
      } else if (existing[0].deletedAt != null) {
        await tx
          .update(planUnits)
          .set({ deletedAt: null })
          .where(
            and(
              eq(planUnits.planOfferId, planOfferId),
              eq(planUnits.unitId, uid),
            ),
          );
      }
    }
  });
}

export async function setPlansForUnit(unitId: number, planOfferIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const unique = Array.from(new Set(planOfferIds));
  const now = new Date();

  await db.transaction(async (tx) => {
    if (unique.length === 0) {
      await tx
        .update(planUnits)
        .set({ deletedAt: now })
        .where(
          and(eq(planUnits.unitId, unitId), isNull(planUnits.deletedAt)),
        );
      return;
    }

    await tx
      .update(planUnits)
      .set({ deletedAt: now })
      .where(
        and(
          eq(planUnits.unitId, unitId),
          notInArray(planUnits.planOfferId, unique),
          isNull(planUnits.deletedAt),
        ),
      );

    for (const pid of unique) {
      const existing = await tx
        .select()
        .from(planUnits)
        .where(
          and(
            eq(planUnits.planOfferId, pid),
            eq(planUnits.unitId, unitId),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await tx.insert(planUnits).values({ planOfferId: pid, unitId });
      } else if (existing[0].deletedAt != null) {
        await tx
          .update(planUnits)
          .set({ deletedAt: null })
          .where(
            and(
              eq(planUnits.planOfferId, pid),
              eq(planUnits.unitId, unitId),
            ),
          );
      }
    }
  });
}

export async function isUnitAllowedForPlan(
  planOfferId: number,
  unitId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const row = await db
    .select({ x: planUnits.planOfferId })
    .from(planUnits)
    .innerJoin(planOffers, eq(planUnits.planOfferId, planOffers.id))
    .innerJoin(planCatalog, eq(planOffers.catalogId, planCatalog.id))
    .innerJoin(units, eq(planUnits.unitId, units.id))
    .where(
      and(
        eq(planUnits.planOfferId, planOfferId),
        eq(planUnits.unitId, unitId),
        isNull(planUnits.deletedAt),
        isNull(planOffers.deletedAt),
        isNull(planCatalog.deletedAt),
        isNull(units.deletedAt),
      ),
    )
    .limit(1);
  return row.length > 0;
}

export type UpdatePlanInput = Partial<{
  name: string;
  description: string | null;
  frequency: Plan["frequency"];
  duration: Plan["duration"];
  planType: Plan["planType"];
  totalClasses: number;
  priceInCents: number;
  installments: number;
  installmentPriceInCents: number;
  credits: number;
  isActive: boolean;
}>;

export async function updatePlan(planOfferId: number, data: UpdatePlanInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select({
      catalogId: planOffers.catalogId,
    })
    .from(planOffers)
    .where(and(eq(planOffers.id, planOfferId), isNull(planOffers.deletedAt)))
    .limit(1);
  if (!existing) return;

  const freq =
    data.frequency !== undefined
      ? (
          await db
            .select({ id: planFrequencies.id })
            .from(planFrequencies)
            .where(eq(planFrequencies.code, data.frequency))
            .limit(1)
        )[0]?.id
      : undefined;
  const dur =
    data.duration !== undefined
      ? (
          await db
            .select({ id: planDurations.id })
            .from(planDurations)
            .where(eq(planDurations.code, data.duration))
            .limit(1)
        )[0]?.id
      : undefined;
  const pty =
    data.planType !== undefined
      ? (
          await db
            .select({ id: planTypes.id })
            .from(planTypes)
            .where(eq(planTypes.code, data.planType))
            .limit(1)
        )[0]?.id
      : undefined;

  if (data.frequency !== undefined && freq === undefined) {
    throw new Error("Frequência inválida");
  }
  if (data.duration !== undefined && dur === undefined) {
    throw new Error("Duração inválida");
  }
  if (data.planType !== undefined && pty === undefined) {
    throw new Error("Tipo de plano inválido");
  }

  if (data.name !== undefined || data.description !== undefined) {
    const catPatch: Record<string, unknown> = {};
    if (data.name !== undefined) catPatch.name = data.name;
    if (data.description !== undefined) catPatch.description = data.description;
    await db
      .update(planCatalog)
      .set(catPatch)
      .where(eq(planCatalog.id, existing.catalogId));
  }

  const offerPatch: Record<string, unknown> = {};
  if (data.totalClasses !== undefined) offerPatch.totalClasses = data.totalClasses;
  if (data.priceInCents !== undefined) offerPatch.priceInCents = data.priceInCents;
  if (data.installments !== undefined) offerPatch.installments = data.installments;
  if (data.installmentPriceInCents !== undefined) {
    offerPatch.installmentPriceInCents = data.installmentPriceInCents;
  }
  if (data.credits !== undefined) offerPatch.credits = data.credits;
  if (data.isActive !== undefined) offerPatch.isActive = data.isActive;
  if (freq !== undefined) offerPatch.frequencyId = freq;
  if (dur !== undefined) offerPatch.durationId = dur;
  if (pty !== undefined) offerPatch.planTypeId = pty;

  if (Object.keys(offerPatch).length > 0) {
    await db
      .update(planOffers)
      .set(offerPatch)
      .where(and(eq(planOffers.id, planOfferId), isNull(planOffers.deletedAt)));
  }
}

export async function softDeletePlan(planOfferId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const [row] = await db
    .select({ catalogId: planOffers.catalogId })
    .from(planOffers)
    .where(and(eq(planOffers.id, planOfferId), isNull(planOffers.deletedAt)))
    .limit(1);
  if (!row) return;

  await db
    .update(planOffers)
    .set({ deletedAt: now })
    .where(and(eq(planOffers.id, planOfferId), isNull(planOffers.deletedAt)));
  await db
    .update(planCatalog)
    .set({ deletedAt: now })
    .where(eq(planCatalog.id, row.catalogId));
}

export type PlanCatalogAdminRow = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  offerCount: number;
};

/** Itens de catálogo ativos com contagem de ofertas (planOffers não excluídas). */
export async function getAllPlanCatalogAdmin(): Promise<PlanCatalogAdminRow[]> {
  const db = await getDb();
  if (!db) return [];

  const catalogs = await db
    .select()
    .from(planCatalog)
    .where(isNull(planCatalog.deletedAt))
    .orderBy(desc(planCatalog.id));

  if (catalogs.length === 0) return [];

  const ids = catalogs.map((c) => c.id);
  const countRows = await db
    .select({
      catalogId: planOffers.catalogId,
      cnt: count(planOffers.id),
    })
    .from(planOffers)
    .where(and(inArray(planOffers.catalogId, ids), isNull(planOffers.deletedAt)))
    .groupBy(planOffers.catalogId);

  const countMap = new Map(
    countRows.map((r) => [r.catalogId, Number(r.cnt)]),
  );
  return catalogs.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    createdAt: c.createdAt,
    deletedAt: c.deletedAt,
    offerCount: countMap.get(c.id) ?? 0,
  }));
}

export async function updatePlanCatalogById(
  catalogId: number,
  data: { name: string; description: string | null },
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select({ id: planCatalog.id })
    .from(planCatalog)
    .where(and(eq(planCatalog.id, catalogId), isNull(planCatalog.deletedAt)))
    .limit(1);
  if (!existing) return false;

  await db
    .update(planCatalog)
    .set({ name: data.name, description: data.description })
    .where(eq(planCatalog.id, catalogId));
  return true;
}

export async function softDeleteUnit(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(units)
    .set({ deletedAt: new Date() })
    .where(and(eq(units.id, unitId), isNull(units.deletedAt)));
  return result;
}

export async function updateUnit(
  unitId: number,
  data: Partial<Pick<InsertUnit, "name" | "address">>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(units)
    .set(data)
    .where(and(eq(units.id, unitId), isNull(units.deletedAt)));
}

export async function updateRoom(
  roomId: number,
  data: Partial<
    Pick<InsertRoom, "unitId" | "name" | "maxCapacity" | "isGroupOnly">
  >,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(rooms).set(data).where(eq(rooms.id, roomId));
}

export async function getAllUnitsWithRooms() {
  const db = await getDb();
  if (!db) return [];

  const allUnits = await db
    .select()
    .from(units)
    .where(isNull(units.deletedAt))
    .orderBy(asc(units.name));
  const out: (Unit & { rooms: Room[] })[] = [];
  for (const u of allUnits) {
    const roomList = await db
      .select()
      .from(rooms)
      .where(eq(rooms.unitId, u.id))
      .orderBy(asc(rooms.name));
    out.push({ ...u, rooms: roomList });
  }
  return out;
}

// ==================== APPOINTMENT OPERATIONS ====================

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("[DB] Creating appointment:", appointment);

  const result = await db.insert(appointments).values(appointment);
  const insertId = result[0]?.insertId;

  console.log("[DB] Appointment created with ID:", insertId);

  if (!insertId) {
    throw new Error("Failed to create appointment: no insert ID returned");
  }

  // Return the created appointment
  const created = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, insertId))
    .limit(1);

  console.log("[DB] Created appointment:", created[0]);

  return created[0];
}

export async function getAppointmentById(appointmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppointmentsByIds(
  appointmentIds: number[],
): Promise<Map<number, Appointment>> {
  const map = new Map<number, Appointment>();
  if (appointmentIds.length === 0) return map;
  const db = await getDb();
  if (!db) return map;

  const rows = await db
    .select()
    .from(appointments)
    .where(inArray(appointments.id, appointmentIds));
  for (const a of rows) {
    map.set(a.id, a);
  }
  return map;
}

export async function getAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.appointmentDate));
}

export async function getUpcomingAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        eq(appointments.status, "scheduled"),
        gte(appointments.appointmentDate, now),
      ),
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(appointments)
    .orderBy(desc(appointments.appointmentDate));
}

export async function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate),
      ),
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function getAppointmentsByRoomAndDate(roomId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];

  // Get appointments for the entire day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.roomId, roomId),
        eq(appointments.status, "scheduled"),
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay),
      ),
    )
    .orderBy(asc(appointments.appointmentDate));
}

/** Mapa planTypeId → ocupa sala inteira (peso = maxCapacity no horário). */
export async function getPlanTypeOccupiesWholeRoomMap(
  planTypeIds: number[],
): Promise<Map<number, boolean>> {
  const db = await getDb();
  const result = new Map<number, boolean>();
  if (!db || planTypeIds.length === 0) return result;

  const rows = await db
    .select({
      id: planTypes.id,
      occupiesWholeRoom: planTypes.occupiesWholeRoom,
    })
    .from(planTypes)
    .where(inArray(planTypes.id, planTypeIds));

  for (const r of rows) {
    result.set(r.id, r.occupiesWholeRoom);
  }
  return result;
}

/**
 * Soma de “vagas” ocupadas no mesmo horário: tipo com occupiesWholeRoom conta `maxCapacity`, demais contam 1.
 */
export function sumSlotOccupancy(
  room: Room,
  sameTimeAppointments: Appointment[],
  occupiesWholeByPlanTypeId: Map<number, boolean>,
): number {
  let total = 0;
  for (const apt of sameTimeAppointments) {
    if (apt.status === "cancelled") continue;
    const ptId = apt.planTypeId;
    if (ptId != null && occupiesWholeByPlanTypeId.get(ptId)) {
      total += room.maxCapacity;
    } else {
      total += 1;
    }
  }
  return total;
}

export async function getSlotOccupancyWeight(
  room: Room,
  planTypeId: number | null,
): Promise<number> {
  if (planTypeId == null) return 1;
  const map = await getPlanTypeOccupiesWholeRoomMap([planTypeId]);
  return map.get(planTypeId) ? room.maxCapacity : 1;
}

/**
 * Última compra concluída com plano nesta unidade — define o tipo de aula para agendamento com créditos.
 */
export async function resolvePlanTypeIdForBooking(
  userId: number,
  unitId: number,
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select({ planTypeId: planOffers.planTypeId })
    .from(purchases)
    .innerJoin(planOffers, eq(purchases.planId, planOffers.id))
    .where(
      and(
        eq(purchases.userId, userId),
        eq(purchases.unitId, unitId),
        eq(purchases.status, "completed"),
        isNotNull(purchases.planId),
      ),
    )
    .orderBy(desc(purchases.createdAt))
    .limit(1);

  return rows[0]?.planTypeId ?? null;
}

export async function cancelAppointment(
  appointmentId: number,
  cancelledBy: number,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy,
    })
    .where(eq(appointments.id, appointmentId));
}

/** Get scheduled appointments whose appointmentDate is before the given cutoff (e.g. for auto-completing past appointments). */
export async function getScheduledAppointmentsBefore(cutoff: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "scheduled"),
        lt(appointments.appointmentDate, cutoff),
      ),
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function markAppointmentCompleted(appointmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(appointments)
    .set({ status: "completed" })
    .where(eq(appointments.id, appointmentId));
}

export async function markAppointmentNoShow(appointmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(appointments)
    .set({ status: "no_show" })
    .where(eq(appointments.id, appointmentId));
}

// ==================== CREDIT TRANSACTION OPERATIONS ====================

export async function createCreditTransaction(
  transaction: InsertCreditTransaction,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(creditTransactions).values(transaction);
  return result;
}

export async function getCreditTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt));
}

export async function getRecentCreditTransactions(
  userId: number,
  limit: number = 10,
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

/** Ordem cronológica para simular saldos por unidade + pool global. */
export async function getCreditTransactionsByUserIdAsc(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(asc(creditTransactions.createdAt), asc(creditTransactions.id));
}

// ==================== PURCHASE OPERATIONS ====================

export async function createPurchase(purchase: InsertPurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(purchases).values(purchase);
  return result;
}

export async function getPurchaseById(purchaseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPurchasesByIds(
  purchaseIds: number[],
): Promise<Map<number, Purchase>> {
  const map = new Map<number, Purchase>();
  if (purchaseIds.length === 0) return map;
  const db = await getDb();
  if (!db) return map;

  const rows = await db
    .select()
    .from(purchases)
    .where(inArray(purchases.id, purchaseIds));
  for (const p of rows) {
    map.set(p.id, p);
  }
  return map;
}

export async function getPurchaseByStripeSessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(purchases)
    .where(eq(purchases.stripeSessionId, sessionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePurchaseStatus(
  purchaseId: number,
  status: "pending" | "completed" | "failed" | "refunded",
  paymentIntentId?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (paymentIntentId) {
    updateData.stripePaymentIntentId = paymentIntentId;
  }

  await db
    .update(purchases)
    .set(updateData)
    .where(eq(purchases.id, purchaseId));
}

export async function updatePurchaseSubscription(
  purchaseId: number,
  stripeSubscriptionId: string,
  stripePaymentIntentId?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: {
    stripeSubscriptionId: string;
    stripePaymentIntentId?: string;
  } = { stripeSubscriptionId };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  await db
    .update(purchases)
    .set(updateData)
    .where(eq(purchases.id, purchaseId));
}

export async function getPurchasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchases)
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.createdAt));
}

export async function getAllPurchases() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(purchases).orderBy(desc(purchases.createdAt));
}

// ==================== OPERATING HOURS OPERATIONS ====================

export async function getOperatingHoursByUnitId(unitId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(operatingHours)
    .where(eq(operatingHours.unitId, unitId))
    .orderBy(asc(operatingHours.dayOfWeek));
}

export async function createOperatingHours(hours: InsertOperatingHour) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(operatingHours).values(hours);
  return result;
}

// ==================== CREDIT SYSTEM HELPERS ====================

/**
 * Add credits to user and create transaction record
 */
export async function addCreditsToUser(
  userId: number,
  amount: number,
  type: "plan_purchase" | "single_purchase" | "manual_adjustment",
  description: string,
  purchaseId?: number,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const newBalance = user.creditsBalance + amount;

  await updateUserCredits(userId, newBalance);

  await createCreditTransaction({
    userId,
    amount,
    type,
    description,
    purchaseId: purchaseId || null,
    balanceAfter: newBalance,
  });

  return newBalance;
}

/**
 * Consume credits from user and create transaction record
 */
export async function consumeCreditsFromUser(
  userId: number,
  amount: number,
  appointmentId: number,
  description: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  if (user.creditsBalance < amount) {
    throw new Error("Insufficient credits");
  }

  const newBalance = user.creditsBalance - amount;

  await updateUserCredits(userId, newBalance);

  await createCreditTransaction({
    userId,
    amount: -amount,
    type: "appointment_booking",
    description,
    appointmentId,
    balanceAfter: newBalance,
  });

  return newBalance;
}

/**
 * Refund credits to user (on cancellation) and create transaction record
 */
export async function refundCreditsToUser(
  userId: number,
  amount: number,
  appointmentId: number,
  description: string,
) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const newBalance = user.creditsBalance + amount;

  await updateUserCredits(userId, newBalance);

  await createCreditTransaction({
    userId,
    amount,
    type: "appointment_cancellation",
    description,
    appointmentId,
    balanceAfter: newBalance,
  });

  return newBalance;
}

/**
 * Créditos utilizáveis em uma unidade: saldo da unidade (compras de plano/avulsa com `purchase.unitId`)
 * mais pool global (ajustes manuais, compras sem unidade, compras antigas). Consumo de agendamento
 * desconta primeiro do saldo da unidade do agendamento, depois do global — alinhado ao histórico real.
 */
export async function getSpendableCreditsAtUnit(
  userId: number,
  unitId: number,
): Promise<number> {
  const txs = await getCreditTransactionsByUserIdAsc(userId);
  const purchaseIds = Array.from(
    new Set(
      txs.map((t) => t.purchaseId).filter((id): id is number => id != null),
    ),
  );
  const appointmentIds = Array.from(
    new Set(
      txs.map((t) => t.appointmentId).filter((id): id is number => id != null),
    ),
  );

  const purchaseMap = await getPurchasesByIds(purchaseIds);
  const appointmentMap = await getAppointmentsByIds(appointmentIds);

  let global = 0;
  const unitBal = new Map<number, number>();

  const getU = (u: number) => unitBal.get(u) ?? 0;
  const addU = (u: number, delta: number) => {
    const next = getU(u) + delta;
    if (next <= 0) unitBal.delete(u);
    else unitBal.set(u, next);
  };

  for (const t of txs) {
    const amt = t.amount;
    if (t.type === "plan_purchase" || t.type === "single_purchase") {
      const p = t.purchaseId != null ? purchaseMap.get(t.purchaseId) : undefined;
      const uid = p?.unitId ?? null;
      if (uid != null) {
        addU(uid, amt);
      } else {
        global += amt;
      }
    } else if (t.type === "manual_adjustment") {
      global += amt;
    } else if (t.type === "appointment_booking") {
      const apt =
        t.appointmentId != null ? appointmentMap.get(t.appointmentId) : undefined;
      const uid = apt?.unitId;
      if (uid == null) {
        global += amt;
        continue;
      }
      const need = -amt;
      if (need <= 0) {
        global += amt;
        continue;
      }
      const uAvail = getU(uid);
      const takeFromUnit = Math.min(need, uAvail);
      addU(uid, -takeFromUnit);
      global -= need - takeFromUnit;
    } else if (t.type === "appointment_cancellation") {
      const apt =
        t.appointmentId != null ? appointmentMap.get(t.appointmentId) : undefined;
      const uid = apt?.unitId;
      if (uid != null) {
        addU(uid, amt);
      } else {
        global += amt;
      }
    }
  }

  return getU(unitId) + global;
}

// ==================== RECURRING SCHEDULES OPERATIONS ====================

/**
 * Create a recurring schedule
 */
export async function createRecurringSchedule(data: {
  userId: number;
  unitId: number;
  roomId: number;
  professionalId: number;
  dayOfWeek: number;
  time: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { recurringSchedules } = await import("../drizzle/schema");

  const [result] = await db.insert(recurringSchedules).values({
    userId: data.userId,
    unitId: data.unitId,
    roomId: data.roomId,
    professionalId: data.professionalId,
    dayOfWeek: data.dayOfWeek,
    time: data.time,
    isActive: true,
    createdBy: data.createdBy,
  });

  return result;
}

/**
 * Get all recurring schedules (with user info)
 */
export async function getAllRecurringSchedules() {
  const db = await getDb();
  if (!db) return [];

  const { recurringSchedules } = await import("../drizzle/schema");

  return await db
    .select()
    .from(recurringSchedules)
    .orderBy(desc(recurringSchedules.id));
}

/**
 * Get recurring schedules by user ID
 */
export async function getRecurringSchedulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { recurringSchedules } = await import("../drizzle/schema");

  return await db
    .select()
    .from(recurringSchedules)
    .where(eq(recurringSchedules.userId, userId));
}

/**
 * Toggle recurring schedule active status
 */
export async function toggleRecurringSchedule(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { recurringSchedules } = await import("../drizzle/schema");

  await db
    .update(recurringSchedules)
    .set({ isActive })
    .where(eq(recurringSchedules.id, id));

  return { success: true };
}

/**
 * Delete recurring schedule
 */
export async function deleteRecurringSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { recurringSchedules } = await import("../drizzle/schema");

  await db.delete(recurringSchedules).where(eq(recurringSchedules.id, id));

  return { success: true };
}

/**
 * Generate appointments for the next week based on recurring schedules
 */
export async function generateRecurringAppointments(
  startDate: Date,
  endDate: Date,
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  const { recurringSchedules } = await import("../drizzle/schema");

  // Get all active recurring schedules
  const schedules = await dbInstance
    .select()
    .from(recurringSchedules)
    .where(eq(recurringSchedules.isActive, true));

  const createdAppointments = [];
  const skippedAppointments = [];

  for (const schedule of schedules) {
    // Generate appointments for each day in the date range
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Check if current day matches the schedule's day of week
      if (currentDate.getDay() === schedule.dayOfWeek) {
        // Parse time (format: "HH:MM")
        const [hours, minutes] = schedule.time.split(":").map(Number);
        const appointmentDate = new Date(currentDate);
        appointmentDate.setHours(hours, minutes, 0, 0);

        // Skip if appointment is in the past
        if (appointmentDate < new Date()) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Check if appointment already exists
        const existingAppointments = await getAppointmentsByRoomAndDate(
          schedule.roomId,
          appointmentDate,
        );

        const alreadyExists = existingAppointments.some(
          (apt) =>
            apt.userId === schedule.userId &&
            apt.appointmentDate.getTime() === appointmentDate.getTime() &&
            apt.status === "scheduled",
        );

        if (alreadyExists) {
          skippedAppointments.push({
            userId: schedule.userId,
            date: appointmentDate,
            reason: "already_exists",
          });
        } else {
          // Check if room has capacity
          const room = await getRoomById(schedule.roomId);
          if (!room) {
            skippedAppointments.push({
              userId: schedule.userId,
              date: appointmentDate,
              reason: "room_not_found",
            });
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          const sameTimeAppointments = existingAppointments.filter(
            (apt) =>
              apt.appointmentDate.getTime() === appointmentDate.getTime() &&
              apt.status === "scheduled",
          );

          const recurringPlanTypeId = await resolvePlanTypeIdForBooking(
            schedule.userId,
            schedule.unitId,
          );
          const recurringIncoming = await getSlotOccupancyWeight(
            room,
            recurringPlanTypeId,
          );
          const recurringPtIds = Array.from(
            new Set(
              sameTimeAppointments
                .map((a) => a.planTypeId)
                .filter((id): id is number => id != null),
            ),
          );
          const recurringOccupiesMap =
            await getPlanTypeOccupiesWholeRoomMap(recurringPtIds);
          const recurringUsed = sumSlotOccupancy(
            room,
            sameTimeAppointments,
            recurringOccupiesMap,
          );

          if (recurringUsed + recurringIncoming > room.maxCapacity) {
            skippedAppointments.push({
              userId: schedule.userId,
              date: appointmentDate,
              reason: "room_full",
            });
          } else {
            const schedUser = await getUserById(schedule.userId);
            if (!schedUser || schedUser.creditsBalance < 1) {
              skippedAppointments.push({
                userId: schedule.userId,
                date: appointmentDate,
                reason: "insufficient_credits",
              });
            } else {
              const spendableHere = await getSpendableCreditsAtUnit(
                schedule.userId,
                schedule.unitId,
              );
              if (spendableHere < 1) {
                skippedAppointments.push({
                  userId: schedule.userId,
                  date: appointmentDate,
                  reason: "insufficient_credits_at_unit",
                });
              } else {
                // Create appointment
                const appointment = await createAppointment({
                  userId: schedule.userId,
                  unitId: schedule.unitId,
                  roomId: schedule.roomId,
                  professionalId: schedule.professionalId,
                  appointmentDate,
                  planTypeId: recurringPlanTypeId ?? undefined,
                  type: "plan",
                  status: "scheduled",
                });

                // Consume 1 credit
                await consumeCreditsFromUser(
                  schedule.userId,
                  1,
                  appointment.id,
                  `Agendamento recorrente automático - ${appointmentDate.toLocaleString("pt-BR")}`,
                );

                createdAppointments.push(appointment);
              }
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return {
    created: createdAppointments.length,
    skipped: skippedAppointments.length,
    details: {
      createdAppointments,
      skippedAppointments,
    },
  };
}

// ==================== BLOCKED TIME SLOTS OPERATIONS ====================

export async function createBlockedTimeSlot(data: {
  unitId: number;
  roomId: number;
  professionalId: number;
  blockedDate: Date;
  reason?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { blockedTimeSlots } = await import("../drizzle/schema");

  const [result] = await db.insert(blockedTimeSlots).values({
    unitId: data.unitId,
    roomId: data.roomId,
    professionalId: data.professionalId,
    blockedDate: data.blockedDate,
    reason: data.reason || null,
    createdBy: data.createdBy,
  });

  return result;
}

export async function getBlockedTimeSlots(filters?: {
  unitId?: number;
  roomId?: number;
  professionalId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const { blockedTimeSlots } = await import("../drizzle/schema");
  const { and, eq, gte, lte } = await import("drizzle-orm");

  const conditions = [];

  if (filters?.unitId) {
    conditions.push(eq(blockedTimeSlots.unitId, filters.unitId));
  }
  if (filters?.roomId) {
    conditions.push(eq(blockedTimeSlots.roomId, filters.roomId));
  }
  if (filters?.professionalId) {
    conditions.push(
      eq(blockedTimeSlots.professionalId, filters.professionalId),
    );
  }
  if (filters?.startDate && filters?.endDate) {
    conditions.push(gte(blockedTimeSlots.blockedDate, filters.startDate));
    conditions.push(lte(blockedTimeSlots.blockedDate, filters.endDate));
  }

  const query =
    conditions.length > 0
      ? db
          .select()
          .from(blockedTimeSlots)
          .where(and(...conditions))
      : db.select().from(blockedTimeSlots);

  return await query;
}

export async function deleteBlockedTimeSlot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { blockedTimeSlots } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db.delete(blockedTimeSlots).where(eq(blockedTimeSlots.id, id));
}

export async function isTimeSlotBlocked(
  unitId: number,
  roomId: number,
  professionalId: number,
  date: Date,
): Promise<boolean> {
  const dbInstance = await getDb();
  if (!dbInstance) return false;

  const { blockedTimeSlots } = await import("../drizzle/schema");
  const { and, eq, gte, lte } = await import("drizzle-orm");

  const startOfHour = new Date(date);
  startOfHour.setMinutes(0, 0, 0);

  const endOfHour = new Date(date);
  endOfHour.setMinutes(59, 59, 999);

  const [blocked] = await dbInstance
    .select()
    .from(blockedTimeSlots)
    .where(
      and(
        eq(blockedTimeSlots.unitId, unitId),
        eq(blockedTimeSlots.roomId, roomId),
        eq(blockedTimeSlots.professionalId, professionalId),
        gte(blockedTimeSlots.blockedDate, startOfHour),
        lte(blockedTimeSlots.blockedDate, endOfHour),
      ),
    )
    .limit(1);

  return !!blocked;
}
