import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { TrpcContext } from './_core/context';

describe('appointments.bookSingleWithCredit', () => {
  let testUserId: number;
  let testUnitId: number;
  let testRoomId: number;
  let testProfessionalId: number;

  beforeAll(async () => {
    // Get test data from database
    const units = await db.getAllUnits();
    const rooms = await db.getRoomsByUnitId(units[0].id);
    const professionals = await db.getProfessionalsByRoomId(rooms[0].id);

    testUnitId = units[0].id;
    testRoomId = rooms[0].id;
    testProfessionalId = professionals[0].id;

    // Create test user with credits
    const testEmail = `testcredit${Date.now()}@example.com`;
    await db.upsertUser({
      openId: `test-user-${Date.now()}`,
      name: 'Test User Credit',
      email: testEmail,
      loginMethod: 'test',
      role: 'user',
      cpf: `${Math.floor(Math.random() * 100000000000)}`,
      phone: '(11) 98765-4321',
      hasTrialClass: true,
    });

    const allUsers = await db.getAllUsers();
    const createdUser = allUsers.find(u => u.email === testEmail);
    if (!createdUser) throw new Error('Test user not created');
    testUserId = createdUser.id;
    
    // Add credits manually
    await db.addCreditsToUser(testUserId, 5, 'manual_adjustment', 'Test setup: adding 5 credits');
  });

  it('should book single class using credit', async () => {
    const ctx: TrpcContext = {
      user: {
        id: testUserId,
        openId: 'test',
        email: 'test@example.com',
        name: 'Test User',
        loginMethod: 'test',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
    const caller = appRouter.createCaller(ctx);

    // Book appointment using credit
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 2); // 2 days from now
    appointmentDate.setHours(10, 0, 0, 0);

    const result = await caller.appointments.bookSingleWithCredit({
      unitId: testUnitId,
      roomId: testRoomId,
      professionalId: testProfessionalId,
      appointmentDate,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Aula avulsa agendada com crédito!');

    // Verify credit was deducted
    const user = await db.getUserById(testUserId);
    expect(user?.creditsBalance).toBe(4); // 5 - 1 = 4
    
    // Verify appointment was created
    const appointments = await db.getAppointmentsByUserId(testUserId);
    const createdAppointment = appointments.find(apt => 
      apt.type === 'single' && apt.status === 'scheduled'
    );
    expect(createdAppointment).toBeDefined();
  });

  it('should fail if user has no credits', async () => {
    // Create user with 0 credits
    const noCreditsEmail = `testnocredits${Date.now()}@example.com`;
    await db.upsertUser({
      openId: `test-user-nocredits-${Date.now()}`,
      name: 'Test User No Credits',
      email: noCreditsEmail,
      loginMethod: 'test',
      role: 'user',
      cpf: `${Math.floor(Math.random() * 100000000000)}`,
      phone: '(11) 98765-4322',
      creditsBalance: 0,
      hasTrialClass: true,
    });

    const allUsers = await db.getAllUsers();
    const createdUser = allUsers.find(u => u.email === noCreditsEmail);
    if (!createdUser) throw new Error('Test user not created');

    const ctx: TrpcContext = {
      user: {
        id: createdUser.id,
        openId: 'test',
        email: 'test@example.com',
        name: 'Test User',
        loginMethod: 'test',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
    const caller = appRouter.createCaller(ctx);

    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 2);
    appointmentDate.setHours(11, 0, 0, 0);

    await expect(
      caller.appointments.bookSingleWithCredit({
        unitId: testUnitId,
        roomId: testRoomId,
        professionalId: testProfessionalId,
        appointmentDate,
      })
    ).rejects.toThrow('Créditos insuficientes');
  });
});
