import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  units, 
  rooms, 
  professionals, 
  plans, 
  appointments, 
  creditTransactions, 
  purchases, 
  operatingHours,
  InsertUnit,
  InsertRoom,
  InsertProfessional,
  InsertPlan,
  InsertAppointment,
  InsertCreditTransaction,
  InsertPurchase,
  InsertOperatingHour
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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
    const email = user.email || (user.openId ? `${user.openId}@oauth.temp` : null);
    
    const values: InsertUser = {
      openId: user.openId || null,
      email,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "cpf", "phone"] as const;
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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCpf(cpf: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.cpf, cpf)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCredits(userId: number, newBalance: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ creditsBalance: newBalance })
    .where(eq(users.id, userId));
}

export async function markUserTrialClassUsed(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ hasTrialClass: true })
    .where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);
  
  return result;
}

export async function searchUsers(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(users)
    .where(
      sql`${users.name} LIKE ${`%${searchTerm}%`} OR ${users.email} LIKE ${`%${searchTerm}%`} OR ${users.cpf} LIKE ${`%${searchTerm}%`}`
    )
    .limit(50);
  
  return result;
}

// ==================== UNIT OPERATIONS ====================

export async function getAllUnits() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(units);
}

export async function getUnitById(unitId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(units).where(eq(units.id, unitId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUnit(unit: InsertUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(units).values(unit);
  return result;
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
  
  const result = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
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
  
  return await db.select().from(professionals).where(eq(professionals.roomId, roomId));
}

export async function getProfessionalById(professionalId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(professionals).where(eq(professionals.id, professionalId)).limit(1);
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

// ==================== PLAN OPERATIONS ====================

export async function getAllPlans() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(plans).where(eq(plans.isActive, true));
}

export async function getPlanById(planId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPlan(plan: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(plans).values(plan);
  return result;
}

// ==================== APPOINTMENT OPERATIONS ====================

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log('[DB] Creating appointment:', appointment);
  
  const result = await db.insert(appointments).values(appointment);
  const insertId = result[0]?.insertId;
  
  console.log('[DB] Appointment created with ID:', insertId);
  
  if (!insertId) {
    throw new Error('Failed to create appointment: no insert ID returned');
  }
  
  // Return the created appointment
  const created = await db.select().from(appointments).where(eq(appointments.id, insertId)).limit(1);
  
  console.log('[DB] Created appointment:', created[0]);
  
  return created[0];
}

export async function getAppointmentById(appointmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.appointmentDate));
}

export async function getUpcomingAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return await db.select().from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        eq(appointments.status, "scheduled"),
        gte(appointments.appointmentDate, now)
      )
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(appointments)
    .orderBy(desc(appointments.appointmentDate));
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate)
      )
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
  
  return await db.select().from(appointments)
    .where(
      and(
        eq(appointments.roomId, roomId),
        eq(appointments.status, "scheduled"),
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay)
      )
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function cancelAppointment(appointmentId: number, cancelledBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(appointments)
    .set({ 
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy
    })
    .where(eq(appointments.id, appointmentId));
}

// ==================== CREDIT TRANSACTION OPERATIONS ====================

export async function createCreditTransaction(transaction: InsertCreditTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(creditTransactions).values(transaction);
  return result;
}

export async function getCreditTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt));
}

export async function getRecentCreditTransactions(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
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
  
  const result = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPurchaseByStripeSessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(purchases)
    .where(eq(purchases.stripeSessionId, sessionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePurchaseStatus(
  purchaseId: number, 
  status: "pending" | "completed" | "failed" | "refunded",
  paymentIntentId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (paymentIntentId) {
    updateData.stripePaymentIntentId = paymentIntentId;
  }
  
  await db.update(purchases)
    .set(updateData)
    .where(eq(purchases.id, purchaseId));
}

export async function getPurchasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(purchases)
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.createdAt));
}

export async function getAllPurchases() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(purchases)
    .orderBy(desc(purchases.createdAt));
}

// ==================== OPERATING HOURS OPERATIONS ====================

export async function getOperatingHoursByUnitId(unitId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(operatingHours)
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
  purchaseId?: number
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
    balanceAfter: newBalance
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
  description: string
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
    balanceAfter: newBalance
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
  description: string
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
    balanceAfter: newBalance
  });
  
  return newBalance;
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
  
  return await db.select().from(recurringSchedules).orderBy(desc(recurringSchedules.id));
}

/**
 * Get recurring schedules by user ID
 */
export async function getRecurringSchedulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { recurringSchedules } = await import("../drizzle/schema");
  
  return await db.select().from(recurringSchedules).where(eq(recurringSchedules.userId, userId));
}

/**
 * Toggle recurring schedule active status
 */
export async function toggleRecurringSchedule(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { recurringSchedules } = await import("../drizzle/schema");
  
  await db.update(recurringSchedules)
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
export async function generateRecurringAppointments(startDate: Date, endDate: Date) {
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
        const [hours, minutes] = schedule.time.split(':').map(Number);
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
          appointmentDate
        );
        
        const alreadyExists = existingAppointments.some(apt => 
          apt.userId === schedule.userId &&
          apt.appointmentDate.getTime() === appointmentDate.getTime() &&
          apt.status === 'scheduled'
        );
        
        if (alreadyExists) {
          skippedAppointments.push({
            userId: schedule.userId,
            date: appointmentDate,
            reason: 'already_exists'
          });
        } else {
          // Check if room has capacity
          const room = await getRoomById(schedule.roomId);
          if (!room) {
            skippedAppointments.push({
              userId: schedule.userId,
              date: appointmentDate,
              reason: 'room_not_found'
            });
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
          
          const sameTimeAppointments = existingAppointments.filter(apt => 
            apt.appointmentDate.getTime() === appointmentDate.getTime() &&
            apt.status === 'scheduled'
          );
          
          if (sameTimeAppointments.length >= room.maxCapacity) {
            skippedAppointments.push({
              userId: schedule.userId,
              date: appointmentDate,
              reason: 'room_full'
            });
          } else {
            // Create appointment
            const appointment = await createAppointment({
              userId: schedule.userId,
              unitId: schedule.unitId,
              roomId: schedule.roomId,
              professionalId: schedule.professionalId,
              appointmentDate,
              type: 'plan',
              status: 'scheduled',
            });
            
            // Consume 1 credit
            await consumeCreditsFromUser(
              schedule.userId,
              1,
              appointment.id,
              `Agendamento recorrente automático - ${appointmentDate.toLocaleString('pt-BR')}`
            );
            
            createdAppointments.push(appointment);
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
    }
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
    conditions.push(eq(blockedTimeSlots.professionalId, filters.professionalId));
  }
  if (filters?.startDate && filters?.endDate) {
    conditions.push(gte(blockedTimeSlots.blockedDate, filters.startDate));
    conditions.push(lte(blockedTimeSlots.blockedDate, filters.endDate));
  }
  
  const query = conditions.length > 0
    ? db.select().from(blockedTimeSlots).where(and(...conditions))
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
  date: Date
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
        lte(blockedTimeSlots.blockedDate, endOfHour)
      )
    )
    .limit(1);

  return !!blocked;
}

