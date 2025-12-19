import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const appointments = await db.select().from(schema.appointments).limit(10);

console.log('Total appointments:', appointments.length);
console.log('Appointments:', JSON.stringify(appointments, null, 2));
