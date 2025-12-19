import { drizzle } from 'drizzle-orm/mysql2';
import { operatingHours } from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);
const hours = await db.select().from(operatingHours);

console.log('Operating Hours:');
hours.forEach(h => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  console.log(`${days[h.dayOfWeek]}: ${h.isOpen ? `${h.openTime} - ${h.closeTime}` : 'FECHADO'}`);
});
