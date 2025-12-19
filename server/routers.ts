import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { users, purchases, appointments, passwordResetTokens } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { createSession, clearSession } from "./session";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      clearSession(ctx.res);
      return { success: true } as const;
    }),
    
    // Register with email and password
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        cpf: z.string(),
        phone: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hashPassword, isValidEmail, isValidPassword } = await import('./auth-helpers');
        const { validateCPF, unmaskCPF, validatePhone, unmaskPhone } = await import('./validators');
        
        // Validate email
        if (!isValidEmail(input.email)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email inválido' });
        }
        
        // Validate password
        if (!isValidPassword(input.password)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Senha deve ter pelo menos 6 caracteres' });
        }
        
        // Validate CPF
        const cleanCpf = unmaskCPF(input.cpf);
        if (!validateCPF(cleanCpf)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido' });
        }
        
        // Validate phone
        const cleanPhone = unmaskPhone(input.phone);
        if (!validatePhone(cleanPhone)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone inválido' });
        }
        
        // Check if email already exists
        const existingEmail = await db.getUserByEmail(input.email);
        if (existingEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email já cadastrado' });
        }
        
        // Check if CPF already exists
        const existingCpf = await db.getUserByCpf(cleanCpf);
        if (existingCpf) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF já cadastrado' });
        }
        
        // Hash password
        const passwordHash = await hashPassword(input.password);
        
        // Create user
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const result = await dbInstance.insert(users).values({
          email: input.email,
          password: passwordHash,
          name: input.name,
          cpf: cleanCpf,
          phone: cleanPhone,
          loginMethod: 'email',
          role: 'user',
          creditsBalance: 0,
          hasTrialClass: false,
        });
        
        // Get the created user
        const newUser = await dbInstance.select().from(users).where(eq(users.email, input.email)).limit(1).then(rows => rows[0]);
        if (!newUser) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar usuário' });
        
        // Create session with JWT
        createSession({
          userId: newUser.id,
          email: input.email,
          role: 'user',
        }, ctx.res);
        
        return { success: true, message: 'Cadastro realizado com sucesso!' };
      }),
    
    // Login with email and password
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { comparePassword } = await import('./auth-helpers');
        
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha inválidos' });
        }
        
        // Check if user has password (not OAuth user)
        if (!user.password) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário cadastrado via OAuth. Use o botão de login social.' });
        }
        
        // Verify password
        const isValid = await comparePassword(input.password, user.password);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha inválidos' });
        }
        
        // Update last signed in
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        await dbInstance.update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, user.id));
        
        // Create session with JWT
        createSession({
          userId: user.id,
          email: user.email!,
          role: user.role as 'admin' | 'user',
        }, ctx.res);
        
        return { success: true, user };
      }),
    
    adminLogin: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar credenciais fixas do admin
        if (input.username !== 'admin261' || input.password !== 'pacientes1') {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'Credenciais inválidas' 
          });
        }
        
        // Buscar ou criar usuário admin
        const adminOpenId = 'admin261_system';
        let adminUser = await db.getUserByOpenId(adminOpenId);
        
        if (!adminUser) {
          await db.upsertUser({
            openId: adminOpenId,
            name: 'Administrador',
            email: 'admin@saudeepilates.com',
            role: 'admin',
            loginMethod: 'custom',
          });
          adminUser = await db.getUserByOpenId(adminOpenId);
        }
        
        // Create admin session with JWT
        createSession({
          userId: adminUser!.id,
          email: adminUser!.email!,
          role: 'admin',
        }, ctx.res);
        
        return { success: true, user: adminUser };
      }),
    
    // Forgot password - Request password reset
    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const { sendPasswordResetEmail } = await import('./email-helper');
        const crypto = await import('crypto');
        
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists or not (security)
          return { success: true, message: 'Se o email existir, você receberá instruções para recuperação de senha.' };
        }
        
        // Check if user has password (not OAuth user)
        if (!user.password) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Usuário cadastrado via OAuth. Não é possível recuperar senha.' });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // Save token to database
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        await dbInstance.insert(passwordResetTokens).values({
          userId: user.id,
          token: resetToken,
          expiresAt,
          used: false,
        });
        
        // Send email
        const resetUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email!, user.name || 'Usuário', resetToken, resetUrl);
        
        return { success: true, message: 'Se o email existir, você receberá instruções para recuperação de senha.' };
      }),
    
    // Reset password - Change password using token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
      }))
      .mutation(async ({ input }) => {
        const { hashPassword } = await import('./auth-helpers');
        
        // Find token
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const [tokenRecord] = await dbInstance.select()
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, input.token))
          .limit(1);
        
        if (!tokenRecord) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token inválido ou expirado' });
        }
        
        // Check if token is expired
        if (new Date() > tokenRecord.expiresAt) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token expirado. Solicite uma nova recuperação de senha.' });
        }
        
        // Check if token was already used
        if (tokenRecord.used) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token já utilizado. Solicite uma nova recuperação de senha.' });
        }
        
        // Hash new password
        const hashedPassword = await hashPassword(input.newPassword);
        
        // Update user password
        await dbInstance.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, tokenRecord.userId));
        
        // Mark token as used
        await dbInstance.update(passwordResetTokens)
          .set({ used: true })
          .where(eq(passwordResetTokens.id, tokenRecord.id));
        
        return { success: true, message: 'Senha alterada com sucesso! Você já pode fazer login.' };
      }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        cpf: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Check if CPF is already used by another user
        if (input.cpf) {
          const existingUser = await db.getUserByCpf(input.cpf);
          if (existingUser && existingUser.id !== userId) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: 'CPF já cadastrado para outro usuário' 
            });
          }
        }
        
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        await dbInstance.update(users)
          .set({
            name: input.name,
            cpf: input.cpf,
            phone: input.phone,
          })
          .where(eq(users.id, userId));
        
        return { success: true };
      }),
  }),
  
  user: router({
    // Update user profile (name, cpf, phone)
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        cpf: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { validateCPF, unmaskCPF, validatePhone, unmaskPhone } = await import('./validators');
        
        const updates: any = {};
        
        if (input.name) {
          updates.name = input.name;
        }
        
        if (input.cpf) {
          const cleanCpf = unmaskCPF(input.cpf);
          if (!validateCPF(cleanCpf)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido' });
          }
          
          // Check if CPF is already used by another user
          const existingCpf = await db.getUserByCpf(cleanCpf);
          if (existingCpf && existingCpf.id !== ctx.user.id) {
            // Se o usuário existente foi criado manualmente (sem openId), fazer merge
            if (!existingCpf.openId) {
              const dbInstance = await db.getDb();
              if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
              
              // Transferir créditos do usuário manual para o usuário OAuth
              const totalCredits = (ctx.user.creditsBalance || 0) + (existingCpf.creditsBalance || 0);
              await dbInstance.update(users)
                .set({ 
                  creditsBalance: totalCredits,
                  cpf: cleanCpf,
                  phone: existingCpf.phone || ctx.user.phone,
                  name: existingCpf.name || ctx.user.name,
                })
                .where(eq(users.id, ctx.user.id));
              
              // Transferir agendamentos do usuário manual para o OAuth
              await dbInstance.update(appointments)
                .set({ userId: ctx.user.id })
                .where(eq(appointments.userId, existingCpf.id));
              
              // Deletar usuário manual
              await dbInstance.delete(users)
                .where(eq(users.id, existingCpf.id));
              
              return { success: true, message: 'Cadastros unificados com sucesso! Seus créditos foram transferidos.' };
            } else {
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF já cadastrado para outro usuário' });
            }
          }
          
          updates.cpf = cleanCpf;
        }
        
        if (input.phone) {
          const cleanPhone = unmaskPhone(input.phone);
          if (!validatePhone(cleanPhone)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone inválido' });
          }
          
          // Check if phone is already used by another user
          const existingPhone = await db.getUserByPhone(cleanPhone);
          if (existingPhone && existingPhone.id !== ctx.user.id) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone já cadastrado para outro usuário' });
          }
          
          updates.phone = cleanPhone;
        }
        
        if (Object.keys(updates).length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum dado para atualizar' });
        }
        
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        await dbInstance.update(users)
          .set(updates)
          .where(eq(users.id, ctx.user.id));
        
        return { success: true, message: 'Perfil atualizado com sucesso' };
      }),
  }),
  
  units: router({
    list: publicProcedure.query(async () => {
      return await db.getAllUnits();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUnitById(input.id);
      }),
    
    getRooms: publicProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRoomsByUnitId(input.unitId);
      }),
  }),
  
  professionals: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProfessionals();
    }),
    
    getByRoom: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProfessionalsByRoomId(input.roomId);
      }),
  }),
  
  plans: router({
    list: publicProcedure.query(async () => {
      return await db.getAllPlans();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanById(input.id);
      }),
  }),
  
  appointments: router({
    // Create trial appointment (free, 1 per CPF)
    createTrial: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        roomId: z.number(),
        professionalId: z.number(),
        appointmentDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        
        // Check if user already has a trial appointment (scheduled or completed)
        const userAppointments = await db.getAppointmentsByUserId(ctx.user.id);
        const hasTrialAppointment = userAppointments.some(
          (apt: any) => apt.type === 'trial' && (apt.status === 'scheduled' || apt.status === 'completed')
        );
        
        if (hasTrialAppointment) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Você já possui ou utilizou sua aula experimental gratuita' 
          });
        }
        
        // Check if CPF is registered
        if (!user.cpf) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'CPF não cadastrado. Por favor, complete seu perfil.' 
          });
        }
        
        // Validate appointment date is in the future
        if (input.appointmentDate < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Data deve ser no futuro' });
        }
        
        // Check availability
        const existingAppointments = await db.getAppointmentsByRoomAndDate(
          input.roomId, 
          input.appointmentDate
        );
        
        const room = await db.getRoomById(input.roomId);
        if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sala não encontrada' });
        
        const sameTimeAppointments = existingAppointments.filter(apt => 
          apt.appointmentDate.getTime() === input.appointmentDate.getTime()
        );
        
        if (sameTimeAppointments.length >= room.maxCapacity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Horário indisponível' });
        }
        
        // Check if time slot is blocked
        const isBlocked = await db.isTimeSlotBlocked(
          input.unitId,
          input.roomId,
          input.professionalId,
          input.appointmentDate
        );
        
        if (isBlocked) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Horário bloqueado pelo administrador' });
        }
        
        // Create appointment
        console.log('[DEBUG] Creating trial appointment:', {
          userId: ctx.user.id,
          unitId: input.unitId,
          roomId: input.roomId,
          professionalId: input.professionalId,
          appointmentDate: input.appointmentDate,
          type: "trial",
          status: "scheduled",
        });
        
        const createdAppointment = await db.createAppointment({
          userId: ctx.user.id,
          unitId: input.unitId,
          roomId: input.roomId,
          professionalId: input.professionalId,
          appointmentDate: input.appointmentDate,
          type: "trial",
          status: "scheduled",
        });
        
        console.log('[DEBUG] Appointment created:', createdAppointment);
        
        // NOTE: hasTrialClass will be marked as true only when the class is completed
        // Not when scheduled, so cancellation doesn't affect trial eligibility
        
        return { success: true, message: 'Aula experimental agendada com sucesso!' };
      }),
    
    // Create appointment with credits (for plan subscribers)
    createWithCredits: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        roomId: z.number(),
        professionalId: z.number(),
        appointmentDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        
        // Check if user has credits
        if (user.creditsBalance < 1) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Créditos insuficientes. Adquira um plano ou aula avulsa.' 
          });
        }
        
        // Validate appointment date is in the future
        if (input.appointmentDate < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Data deve ser no futuro' });
        }
        
        // Check availability
        const existingAppointments = await db.getAppointmentsByRoomAndDate(
          input.roomId, 
          input.appointmentDate
        );
        
        const room = await db.getRoomById(input.roomId);
        if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sala não encontrada' });
        
        const sameTimeAppointments = existingAppointments.filter(apt => 
          apt.appointmentDate.getTime() === input.appointmentDate.getTime()
        );
        
        if (sameTimeAppointments.length >= room.maxCapacity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Horário indisponível' });
        }
        
        // Check if time slot is blocked
        const isBlocked = await db.isTimeSlotBlocked(
          input.unitId,
          input.roomId,
          input.professionalId,
          input.appointmentDate
        );
        
        if (isBlocked) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Horário bloqueado pelo administrador' });
        }
        
        // Create appointment
        const createdAppointment = await db.createAppointment({
          userId: ctx.user.id,
          unitId: input.unitId,
          roomId: input.roomId,
          professionalId: input.professionalId,
          appointmentDate: input.appointmentDate,
          type: "plan",
          status: "scheduled",
        });
        
        const appointmentId = createdAppointment.id;
        
        // Consume 1 credit
        await db.consumeCreditsFromUser(
          ctx.user.id,
          1,
          appointmentId,
          `Agendamento de aula - ${input.appointmentDate.toLocaleString('pt-BR')}`
        );
        
        return { success: true, message: 'Aula agendada com sucesso!' };
      }),
    
    // Book single class with credits (alternative to Stripe payment)
    bookSingleWithCredit: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        roomId: z.number(),
        professionalId: z.number(),
        appointmentDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        
        // Check if user has credits
        if (user.creditsBalance < 1) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Créditos insuficientes. Você precisa de pelo menos 1 crédito para agendar.' 
          });
        }
        
        // Validate appointment date is in the future
        if (input.appointmentDate < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Data deve ser no futuro' });
        }
        
        // Check availability
        const existingAppointments = await db.getAppointmentsByRoomAndDate(
          input.roomId, 
          input.appointmentDate
        );
        
        const room = await db.getRoomById(input.roomId);
        if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sala não encontrada' });
        
        const sameTimeAppointments = existingAppointments.filter(apt => 
          apt.appointmentDate.getTime() === input.appointmentDate.getTime()
        );
        
        if (sameTimeAppointments.length >= room.maxCapacity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Horário indisponível' });
        }
        
        // Check if time slot is blocked
        const isBlocked = await db.isTimeSlotBlocked(
          input.unitId,
          input.roomId,
          input.professionalId,
          input.appointmentDate
        );
        
        if (isBlocked) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Horário bloqueado pelo administrador' });
        }
        
        // Create appointment
        const createdAppointment = await db.createAppointment({
          userId: ctx.user.id,
          unitId: input.unitId,
          roomId: input.roomId,
          professionalId: input.professionalId,
          appointmentDate: input.appointmentDate,
          type: "single",
          status: "scheduled",
        });
        
        const appointmentId = createdAppointment.id;
        
        // Consume 1 credit
        await db.consumeCreditsFromUser(
          ctx.user.id,
          1,
          appointmentId,
          `Aula avulsa agendada com crédito - ${input.appointmentDate.toLocaleString('pt-BR')}`
        );
        
        return { success: true, message: 'Aula avulsa agendada com crédito!' };
      }),
    
    // Get user's appointments
    myAppointments: protectedProcedure.query(async ({ ctx }) => {
      const appointments = await db.getAppointmentsByUserId(ctx.user.id);
      
      // Enrich with related data
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const unit = await db.getUnitById(apt.unitId);
        const room = await db.getRoomById(apt.roomId);
        const professional = await db.getProfessionalById(apt.professionalId);
        
        return {
          ...apt,
          unit,
          room,
          professional,
        };
      }));
      
      return enriched;
    }),
    
    // Get upcoming appointments
    upcomingAppointments: protectedProcedure.query(async ({ ctx }) => {
      const appointments = await db.getUpcomingAppointmentsByUserId(ctx.user.id);
      
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const unit = await db.getUnitById(apt.unitId);
        const room = await db.getRoomById(apt.roomId);
        const professional = await db.getProfessionalById(apt.professionalId);
        
        return {
          ...apt,
          unit,
          room,
          professional,
        };
      }));
      
      return enriched;
    }),
    
    // Cancel appointment
    cancel: protectedProcedure
      .input(z.object({ appointmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const appointment = await db.getAppointmentById(input.appointmentId);
        
        if (!appointment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agendamento não encontrado' });
        }
        
        // Check if user owns this appointment
        if (appointment.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
        }
        
        if (appointment.status !== 'scheduled') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agendamento não pode ser cancelado' });
        }
        
        // Check if cancellation is within 24 hours
        const now = new Date();
        const appointmentTime = new Date(appointment.appointmentDate);
        const hoursDifference = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        const canRefund = hoursDifference >= 24;
        
        // Cancel appointment
        await db.cancelAppointment(input.appointmentId, ctx.user.id);
        
        // Refund credit if within policy
        if (canRefund && appointment.type !== 'trial') {
          await db.refundCreditsToUser(
            ctx.user.id,
            1,
            input.appointmentId,
            `Cancelamento de aula - ${appointmentTime.toLocaleString('pt-BR')}`
          );
        }
        
        return { 
          success: true, 
          refunded: canRefund && appointment.type !== 'trial',
          message: canRefund && appointment.type !== 'trial' 
            ? 'Aula cancelada e crédito devolvido!' 
            : 'Aula cancelada. Crédito não devolvido (cancelamento fora do prazo).'
        };
      }),
    
    // Get available time slots
    getAvailableSlots: publicProcedure
      .input(z.object({
        roomId: z.number(),
        date: z.number(), // timestamp in milliseconds
      }))
      .query(async ({ input }) => {
        const date = new Date(input.date);
        const room = await db.getRoomById(input.roomId);
        if (!room) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sala não encontrada' });
        
        const unit = await db.getUnitById(room.unitId);
        if (!unit) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unidade não encontrada' });
        
        // Get operating hours for this unit and day
        const dayOfWeek = date.getDay();
        const operatingHours = await db.getOperatingHoursByUnitId(unit.id);
        const todayHours = operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
        
        if (!todayHours || !todayHours.isOpen) {
          return []; // Closed on this day
        }
        
        // Get existing appointments for this room and date
        const existingAppointments = await db.getAppointmentsByRoomAndDate(input.roomId, date);
        
        // Get professionals for this room
        const professionals = await db.getProfessionalsByRoomId(input.roomId);
        const professional = professionals[0]; // Assume one professional per room
        
        // Get blocked time slots for this room and date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const blockedSlots = professional ? await db.getBlockedTimeSlots({
          unitId: unit.id,
          roomId: input.roomId,
          professionalId: professional.id,
          startDate,
          endDate,
        }) : [];
        
        // Generate time slots (1 hour each)
        const slots: { time: string; available: boolean; count: number }[] = [];
        const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
        const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
        
        for (let hour = openHour; hour < closeHour; hour++) {
          const timeString = `${hour.toString().padStart(2, '0')}:00`;
          
          // Check if this time is blocked
          const isBlocked = blockedSlots.some(blocked => {
            const blockedHour = new Date(blocked.blockedDate).getHours();
            return blockedHour === hour;
          });
          
          // Count appointments at this time
          const appointmentsAtTime = existingAppointments.filter(apt => {
            const aptHour = apt.appointmentDate.getHours();
            return aptHour === hour;
          }).length;
          
          slots.push({
            time: timeString,
            available: !isBlocked && appointmentsAtTime < room.maxCapacity,
            count: appointmentsAtTime,
            capacity: room.maxCapacity,
          });
        }
        
        return slots;
      }),
    
    // Admin: Get all appointments
    adminList: adminProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        let appointments;
        
        if (input.startDate && input.endDate) {
          appointments = await db.getAppointmentsByDateRange(input.startDate, input.endDate);
        } else {
          appointments = await db.getAllAppointments();
        }
        
        // Enrich with related data
        const enriched = await Promise.all(appointments.map(async (apt) => {
          const user = await db.getUserById(apt.userId);
          const unit = await db.getUnitById(apt.unitId);
          const room = await db.getRoomById(apt.roomId);
          const professional = await db.getProfessionalById(apt.professionalId);
          
          return {
            ...apt,
            user,
            unit,
            room,
            professional,
          };
        }));
        
        return enriched;
      }),
    
    // Admin: Cancel any appointment
    adminCancel: adminProcedure
      .input(z.object({ 
        appointmentId: z.number(),
        refundCredit: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const appointment = await db.getAppointmentById(input.appointmentId);
        
        if (!appointment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Agendamento não encontrado' });
        }
        
        if (appointment.status !== 'scheduled') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agendamento não pode ser cancelado' });
        }
        
        // Cancel appointment
        await db.cancelAppointment(input.appointmentId, ctx.user.id);
        
        // Refund credit if requested and not trial
        if (input.refundCredit && appointment.type !== 'trial') {
          await db.refundCreditsToUser(
            appointment.userId,
            1,
            input.appointmentId,
            `Cancelamento administrativo - ${appointment.appointmentDate.toLocaleString('pt-BR')}`
          );
        }
        
        return { 
          success: true, 
          refunded: input.refundCredit && appointment.type !== 'trial',
        };
      }),
  }),
  
  credits: router({
    // Get user's credit balance
    balance: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return { balance: user?.creditsBalance || 0 };
    }),
    
    // Get credit transaction history
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (input.limit) {
          return await db.getRecentCreditTransactions(ctx.user.id, input.limit);
        }
        return await db.getCreditTransactionsByUserId(ctx.user.id);
      }),
    
    // Admin: Manually adjust credits
    adminAdjust: adminProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const newBalance = await db.addCreditsToUser(
          input.userId,
          input.amount,
          "manual_adjustment",
          input.description
        );

        return { success: true, newBalance };
      }),
    
    // Admin: Quick adjust credits (+1 or -1)
    quickAdjustCredits: adminProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number(), // +1 or -1
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        
        const description = input.amount > 0 
          ? `Ajuste rápido: +${input.amount} crédito(s)`
          : `Ajuste rápido: ${input.amount} crédito(s)`;
        
        const newBalance = await db.addCreditsToUser(
          input.userId,
          input.amount,
          "manual_adjustment",
          description
        );
        
        return { success: true, newBalance };
      }),
      currentPlan: protectedProcedure.query(async ({ ctx }) => {
  const dbInstance = await db.getDb();
  if (!dbInstance) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }

  const user = await db.getUserById(ctx.user.id);
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
  }

  const { purchases, plans } = await import("../drizzle/schema");
  const { eq, and, desc } = await import("drizzle-orm");

  const [lastPlanPurchase] = await dbInstance
    .select()
    .from(purchases)
    .where(
      and(
        eq(purchases.userId, ctx.user.id),
        eq(purchases.type, "plan"),
        eq(purchases.status, "completed")
      )
    )
    .orderBy(desc(purchases.createdAt))
    .limit(1);

  if (!lastPlanPurchase || !lastPlanPurchase.planId) {
    return {
      hasPlan: false,
      balance: user.creditsBalance || 0,
    };
  }

  const [plan] = await dbInstance
    .select()
    .from(plans)
    .where(eq(plans.id, lastPlanPurchase.planId))
    .limit(1);

  if (!plan) {
    return {
      hasPlan: false,
      balance: user.creditsBalance || 0,
    };
  }

  const startDate = lastPlanPurchase.createdAt;
  const endDate = new Date(startDate);

  switch (plan.duration) {
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "quarterly":
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case "semester":
      endDate.setMonth(endDate.getMonth() + 6);
      break;
  }

  return {
    hasPlan: true,
    balance: user.creditsBalance || 0,
    plan: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      frequency: plan.frequency,
      duration: plan.duration,
      totalClasses: plan.totalClasses,
      credits: plan.credits,
      startedAt: startDate,
      expiresAt: endDate,
    },
  };
}),

  }),
  


  admin: router({
    // List all users
    listAllUsers: adminProcedure
      .query(async () => {
        return await db.getAllUsers();
      }),
    
    // Search users
    searchUsers: adminProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchUsers(input.searchTerm);
      }),
    
    // Get user details with credits and appointments
    getUserDetails: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        
        const appointments = await db.getAppointmentsByUserId(input.userId);
        const creditHistory = await db.getCreditTransactionsByUserId(input.userId);
        const purchases = await db.getPurchasesByUserId(input.userId);
        
        return {
          user,
          appointments,
          creditHistory,
          purchases,
        };
      }),
    
    // Get admin metrics
    getMetrics: adminProcedure
      .query(async () => {
        const allAppointments = await db.getAllAppointments();
        const allPurchases = await db.getAllPurchases();
        const allUsers = await db.getAllUsers();
        
        // Ocupação por horário (aulas agendadas por hora)
        const occupancyByHour: Record<number, number> = {};
        allAppointments
          .filter(apt => apt.status === 'scheduled')
          .forEach(apt => {
            const hour = new Date(apt.appointmentDate).getHours();
            occupancyByHour[hour] = (occupancyByHour[hour] || 0) + 1;
          });
        
        // Receita mensal (últimos 12 meses)
        const revenueByMonth: Record<string, number> = {};
        allPurchases
          .filter((p: any) => p.status === 'completed')
          .forEach((p: any) => {
            const date = new Date(p.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + p.amountInCents;
          });
        
        // Taxa de cancelamento
        const totalAppointments = allAppointments.length;
        const cancelledAppointments = allAppointments.filter(apt => apt.status === 'cancelled').length;
        const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
        
        // Pacientes mais ativos (top 10)
        const userAppointmentCount: Record<number, { name: string; count: number }> = {};
        allAppointments.forEach(apt => {
          if (!userAppointmentCount[apt.userId]) {
            const user = allUsers.find(u => u.id === apt.userId);
            userAppointmentCount[apt.userId] = {
              name: user?.name || 'Usuário',
              count: 0,
            };
          }
          userAppointmentCount[apt.userId].count++;
        });
        
        const topUsers = Object.entries(userAppointmentCount)
          .map(([userId, data]) => ({ userId: Number(userId), ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        return {
          occupancyByHour,
          revenueByMonth,
          cancellationRate,
          topUsers,
          totalAppointments,
          totalRevenue: Object.values(revenueByMonth).reduce((sum, val) => sum + val, 0),
          totalUsers: allUsers.length,
        };
      }),
    
    // Create patient (for migrating from physical agenda)
    createPatient: adminProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        cpf: z.string(),
        phone: z.string(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        // Validate CPF format
        const { validateCPF, unmaskCPF } = await import('./validators');
        const cleanCpf = unmaskCPF(input.cpf);
        if (!validateCPF(cleanCpf)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido' });
        }
        
        // Validate phone format
        const { validatePhone, unmaskPhone } = await import('./validators');
        const cleanPhone = unmaskPhone(input.phone);
        if (!validatePhone(cleanPhone)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone inválido' });
        }
        
        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email já cadastrado' });
        }
        
        // Check if CPF already exists
        const existingCpf = await db.getUserByCpf(input.cpf);
        if (existingCpf) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF já cadastrado' });
        }
        
        // Check if phone already exists
        const existingPhone = await db.getUserByPhone(input.phone);
        if (existingPhone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone já cadastrado' });
        }
        
        // Create user with temporary openId
        const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const [result] = await dbInstance.insert(users).values({
          openId: tempOpenId,
          name: input.name,
          email: input.email,
          cpf: cleanCpf,
          phone: cleanPhone,
          role: 'user',
          creditsBalance: 0,
        });
        
        const userId = Number(result.insertId);
        
        return { 
          success: true, 
          userId,
          message: `Paciente criado com sucesso. Login: ${input.email} / Senha: ${input.password}` 
        };
      }),
    
    // Create appointment for any patient (for migrating from physical agenda)
    createAppointmentForPatient: adminProcedure
      .input(z.object({
        userId: z.number(),
        unitId: z.number(),
        roomId: z.number(),
        professionalId: z.number(),
        appointmentDate: z.string(),
        type: z.enum(['trial', 'single', 'plan']),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        }
        
        // Verificar disponibilidade de vagas
        const room = await db.getRoomById(input.roomId);
        if (!room) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sala não encontrada' });
        }
        
        const appointmentDate = new Date(input.appointmentDate);
        const existingAppointments = await db.getAppointmentsByRoomAndDate(input.roomId, appointmentDate);
        
        // Contar agendamentos no mesmo horário
        const appointmentHour = appointmentDate.getHours();
        const appointmentsAtTime = existingAppointments.filter(apt => {
          const aptHour = apt.appointmentDate.getHours();
          return aptHour === appointmentHour;
        }).length;
        
        if (appointmentsAtTime >= room.maxCapacity) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: `Horário lotado! Máximo de ${room.maxCapacity} alunos. Já há ${appointmentsAtTime} agendados.` 
          });
        }
        
        // Create appointment without consuming credits (admin override)
        const appointmentId = await db.createAppointment({
          userId: input.userId,
          unitId: input.unitId,
          roomId: input.roomId,
          professionalId: input.professionalId,
          appointmentDate,
          type: input.type,
          status: 'scheduled',
        });
        
        return { 
          success: true, 
          appointmentId,
          message: `Agendamento criado com sucesso! Vagas: ${appointmentsAtTime + 1}/${room.maxCapacity}` 
        };
      }),
    
    // Edit patient data
    editPatient: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        }
        
        // Validate CPF and phone format if provided
        const { validateCPF, unmaskCPF, validatePhone, unmaskPhone } = await import('./validators');
        let cleanCpf = user.cpf;
        let cleanPhone = user.phone;
        
        if (input.cpf) {
          cleanCpf = unmaskCPF(input.cpf);
          if (!validateCPF(cleanCpf)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido' });
          }
        }
        
        if (input.phone) {
          cleanPhone = unmaskPhone(input.phone);
          if (!validatePhone(cleanPhone)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone inválido' });
          }
        }
        
        // Check if email is being changed and already exists
        if (input.email && input.email !== user.email) {
          const existingEmail = await db.getUserByEmail(input.email);
          if (existingEmail) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email já cadastrado para outro usuário' });
          }
        }
        
        // Check if CPF is being changed and already exists
        if (input.cpf && input.cpf !== user.cpf) {
          const existingCpf = await db.getUserByCpf(input.cpf);
          if (existingCpf) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF já cadastrado para outro usuário' });
          }
        }
        
        // Check if phone is being changed and already exists
        if (input.phone && input.phone !== user.phone) {
          const existingPhone = await db.getUserByPhone(input.phone);
          if (existingPhone) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Telefone já cadastrado para outro usuário' });
          }
        }
        
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        await dbInstance.update(users)
          .set({
            name: input.name || user.name,
            email: input.email || user.email,
            cpf: cleanCpf,
            phone: cleanPhone,
          })
          .where(eq(users.id, input.userId));
        
        return { 
          success: true,
          message: 'Dados do paciente atualizados com sucesso' 
        };
      }),
    
    // Delete patient
    deletePatient: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        }
        
        // Check if user has active appointments
        const appointments = await db.getAppointmentsByUserId(input.userId);
        const activeAppointments = appointments.filter(apt => apt.status === 'scheduled');
        
        if (activeAppointments.length > 0) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: `Não é possível excluir paciente com ${activeAppointments.length} agendamento(s) ativo(s). Cancele os agendamentos primeiro.` 
          });
        }
        
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        // Delete user (cascade will handle related records)
        await dbInstance.delete(users).where(eq(users.id, input.userId));
        
        return { 
          success: true,
          deletedUserId: input.userId,
          message: 'Paciente excluído com sucesso' 
        };
      }),
    
    // Confirm manual payment and add credits
    confirmManualPayment: adminProcedure
      .input(z.object({
        userId: z.number(),
        planId: z.number(),
        paymentMethod: z.enum(['cash', 'pix', 'transfer']),
        notes: z.string().optional(),
        planStartDate: z.string().optional(),
        planEndDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        }
        
        const plan = await db.getPlanById(input.planId);
        if (!plan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        // Add credits to user
        await dbInstance.update(users)
          .set({ creditsBalance: user.creditsBalance + plan.credits })
          .where(eq(users.id, input.userId));
        
        // Record manual payment
        const { manualPayments } = await import('../drizzle/schema');
        await dbInstance.insert(manualPayments).values({
          userId: input.userId,
          planId: input.planId,
          amountInCents: plan.priceInCents,
          paymentMethod: input.paymentMethod,
          creditsAdded: plan.credits,
          confirmedBy: ctx.user.id,
          notes: input.notes,
          planStartDate: input.planStartDate ? new Date(input.planStartDate) : new Date(),
          planEndDate: input.planEndDate ? new Date(input.planEndDate) : null,
        });
        
        return {
          success: true,
          creditsAdded: plan.credits,
          newBalance: user.creditsBalance + plan.credits,
          message: `Pagamento confirmado! ${plan.credits} créditos adicionados.`
        };
      }),
    
    // Get all manual payments
    getManualPayments: adminProcedure
      .query(async () => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const { manualPayments } = await import('../drizzle/schema');
        const payments = await dbInstance.select().from(manualPayments).orderBy(desc(manualPayments.createdAt));
        
        // Enrich with user and plan data
        const enrichedPayments = await Promise.all(
          payments.map(async (payment) => {
            const user = await db.getUserById(payment.userId);
            const plan = await db.getPlanById(payment.planId);
            const admin = await db.getUserById(payment.confirmedBy);
            return {
              ...payment,
              user,
              plan,
              confirmedByName: admin?.name || 'Admin',
            };
          })
        );
        
        return enrichedPayments;
      }),
    
    // Create recurring schedule
    createRecurringSchedule: adminProcedure
      .input(z.object({
        userId: z.number(),
        unitId: z.number(),
        roomId: z.number(),
        professionalId: z.number(),
        daysOfWeek: z.array(z.number()), // Array de dias (ex: [2, 4] para terça e quinta)
        time: z.string(), // Formato HH:MM
      }))
      .mutation(async ({ ctx, input }) => {
        // Criar um schedule para cada dia da semana selecionado
        const schedules = [];
        for (const dayOfWeek of input.daysOfWeek) {
          const schedule = await db.createRecurringSchedule({
            userId: input.userId,
            unitId: input.unitId,
            roomId: input.roomId,
            professionalId: input.professionalId,
            dayOfWeek,
            time: input.time,
            createdBy: ctx.user.id,
          });
          schedules.push(schedule);
        }
        
        return { success: true, schedules };
      }),
    
    // Get all recurring schedules
    getRecurringSchedules: adminProcedure
      .query(async () => {
        const schedules = await db.getAllRecurringSchedules();
        
        // Enrich with user, unit, room, professional data
        const enrichedSchedules = await Promise.all(
          schedules.map(async (schedule) => {
            const user = await db.getUserById(schedule.userId);
            const unit = await db.getUnitById(schedule.unitId);
            const room = await db.getRoomById(schedule.roomId);
            const professional = await db.getProfessionalById(schedule.professionalId);
            
            return {
              ...schedule,
              user,
              unit,
              room,
              professional,
            };
          })
        );
        
        return enrichedSchedules;
      }),
    
    // Toggle recurring schedule active status
    toggleRecurringSchedule: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        return await db.toggleRecurringSchedule(input.id, input.isActive);
      }),
    
    // Delete recurring schedule
    deleteRecurringSchedule: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteRecurringSchedule(input.id);
      }),
    
    // Generate appointments from recurring schedules
    generateRecurringAppointments: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.generateRecurringAppointments(input.startDate, input.endDate);
        return result;
      }),
    
    // Block a specific time slot
    blockTimeSlot: adminProcedure
      .input(z.object({
        unitId: z.number(),
        roomId: z.number(),
        professionalId: z.number(),
        blockedDate: z.date(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBlockedTimeSlot({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    // Get blocked time slots
    getBlockedTimeSlots: adminProcedure
      .input(z.object({
        unitId: z.number().optional(),
        roomId: z.number().optional(),
        professionalId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getBlockedTimeSlots(input);
      }),
    
    // Unblock a time slot
    unblockTimeSlot: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBlockedTimeSlot(input.id);
        return { success: true };
      }),
  }),
  
  stripe: router({
    // Create checkout session for plan purchase
    createPlanCheckout: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2025-11-17.clover",
        });
        
        const plan = await db.getPlanById(input.planId);
        if (!plan) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        }
        
        // Create pending purchase record
        const purchaseResult = await db.createPurchase({
          userId: ctx.user.id,
          type: "plan",
          planId: plan.id,
          amountInCents: plan.priceInCents,
          status: "pending",
          creditsAdded: plan.credits,
        });
        
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "brl",
                product_data: {
                  name: plan.name,
                  description: plan.description || undefined,
                },
                unit_amount: plan.priceInCents,
              },
              quantity: 1,
            },
          ],
          customer_email: user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            type: "plan",
            plan_id: plan.id.toString(),
            credits: plan.credits.toString(),
          },
          success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/plans`,
          allow_promotion_codes: true,
        });
        
        // Update purchase with session ID
        const dbInstance = await db.getDb();
        if (dbInstance) {
          await dbInstance.update(purchases)
            .set({ stripeSessionId: session.id })
            .where(eq(purchases.id, Number(purchaseResult[0].insertId)));
        }
        
        return { url: session.url };
      }),
    
    // Create checkout session for single class
    createSingleCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-11-17.clover",
      });
      
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
      }
      
      const SINGLE_CLASS_PRICE = 6000; // R$ 60,00
      
      // Create pending purchase record
      const purchaseResult = await db.createPurchase({
        userId: ctx.user.id,
        type: "single",
        amountInCents: SINGLE_CLASS_PRICE,
        status: "pending",
        creditsAdded: 1,
      });
      
      const origin = ctx.req.headers.origin || 'http://localhost:3000';
      
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "Aula Avulsa",
                description: "Aula avulsa de Pilates - 1 hora",
              },
              unit_amount: SINGLE_CLASS_PRICE,
            },
            quantity: 1,
          },
        ],
        customer_email: user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          type: "single",
          credits: "1",
        },
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/single-class`,
        allow_promotion_codes: true,
      });
      
      // Update purchase with session ID
      const dbInstance = await db.getDb();
      if (dbInstance) {
        await dbInstance.update(purchases)
          .set({ stripeSessionId: session.id })
          .where(eq(purchases.id, Number(purchaseResult[0].insertId)));
      }
      
      return { url: session.url };
      }),
  }),
});
export type AppRouter = typeof appRouter;
