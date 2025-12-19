import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não encontrada");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Iniciando seed do banco de dados...");

try {
  // Insert Units
  console.log("📍 Inserindo unidades...");
  const [unitsResult] = await connection.execute(
    `INSERT INTO units (name, address) VALUES 
    ('Vila Oliveira', 'Rua Laurinda Cardoso Melo Freire, 261 - Vila Oliveira'),
    ('Vila Caputera', 'R. Kikuji Iwanami, 256 D - Vila Caputera')
    ON DUPLICATE KEY UPDATE name=name`
  );
  console.log("✅ Unidades inseridas");

  // Get unit IDs
  const [units] = await connection.execute("SELECT * FROM units ORDER BY id");
  const vilaOliveiraId = units[0].id;
  const vilaCaputeraId = units[1].id;

  // Insert Rooms
  console.log("🚪 Inserindo salas...");
  await connection.execute(
    `INSERT INTO rooms (unitId, name, maxCapacity, isGroupOnly) VALUES 
    (${vilaOliveiraId}, 'Sala 1', 4, false),
    (${vilaOliveiraId}, 'Sala 2', 4, false),
    (${vilaCaputeraId}, 'Sala Única', 4, true)
    ON DUPLICATE KEY UPDATE name=name`
  );
  console.log("✅ Salas inseridas");

  // Get room IDs
  const [rooms] = await connection.execute("SELECT * FROM rooms ORDER BY id");
  const sala1Id = rooms[0].id;
  const sala2Id = rooms[1].id;
  const salaUnicaId = rooms[2].id;

  // Insert Professionals
  console.log("👩‍⚕️ Inserindo profissionais...");
  await connection.execute(
    `INSERT INTO professionals (roomId, name, fullName, bio) VALUES 
    (${sala1Id}, 'Faila', 'Faila Adachi', 'Profissional especializada em Pilates com anos de experiência.'),
    (${sala2Id}, 'Mariana', 'Mariana Sabanae', 'Instrutora de Pilates dedicada ao bem-estar dos alunos.'),
    (${salaUnicaId}, 'Phyllis', 'Phyllis Souza', 'Especialista em Pilates com foco em reabilitação e condicionamento.')
    ON DUPLICATE KEY UPDATE name=name`
  );
  console.log("✅ Profissionais inseridas");

  // Insert Plans
  console.log("📋 Inserindo planos...");
  await connection.execute(
    `INSERT INTO plans (name, description, frequency, duration, totalClasses, priceInCents, installments, installmentPriceInCents, credits, isActive) VALUES 
    ('Plano Mensal - 1x por semana', '4 aulas (aproximadamente 1 mês)', '1x', 'monthly', 4, 31500, 1, 31500, 4, true),
    ('Plano Trimestral - 1x por semana', '12 aulas (aproximadamente 3 meses)', '1x', 'quarterly', 12, 75000, 3, 25000, 12, true),
    ('Plano Semestral - 1x por semana', '24 aulas (aproximadamente 6 meses)', '1x', 'semester', 24, 132000, 6, 22000, 24, true),
    ('Plano Mensal - 2x por semana', '8 aulas (aproximadamente 1 mês)', '2x', 'monthly', 8, 38700, 1, 38700, 8, true),
    ('Plano Trimestral - 2x por semana', '24 aulas (aproximadamente 3 meses)', '2x', 'quarterly', 24, 105600, 3, 35200, 24, true),
    ('Plano Semestral - 2x por semana', '48 aulas (aproximadamente 6 meses)', '2x', 'semester', 48, 192000, 6, 32000, 48, true),
    ('Plano Mensal - 3x por semana', '12 aulas (aproximadamente 1 mês)', '3x', 'monthly', 12, 43600, 1, 43600, 12, true),
    ('Plano Trimestral - 3x por semana', '36 aulas (aproximadamente 3 meses)', '3x', 'quarterly', 36, 118800, 3, 39600, 36, true),
    ('Plano Semestral - 3x por semana', '72 aulas (aproximadamente 6 meses)', '3x', 'semester', 72, 216000, 6, 36000, 72, true)
    ON DUPLICATE KEY UPDATE name=name`
  );
  console.log("✅ Planos inseridos");

  // Insert Operating Hours
  console.log("⏰ Inserindo horários de funcionamento...");
  
  // Vila Oliveira - Segunda a Sexta: 7h-21h
  for (let day = 1; day <= 5; day++) {
    await connection.execute(
      `INSERT INTO operatingHours (unitId, dayOfWeek, openTime, closeTime, isOpen) VALUES 
      (${vilaOliveiraId}, ${day}, '07:00', '21:00', true)
      ON DUPLICATE KEY UPDATE openTime='07:00'`
    );
  }
  
  // Vila Oliveira - Sábado: 8h-12h
  await connection.execute(
    `INSERT INTO operatingHours (unitId, dayOfWeek, openTime, closeTime, isOpen) VALUES 
    (${vilaOliveiraId}, 6, '08:00', '12:00', true)
    ON DUPLICATE KEY UPDATE openTime='08:00'`
  );
  
  // Vila Oliveira - Domingo: Fechado
  await connection.execute(
    `INSERT INTO operatingHours (unitId, dayOfWeek, openTime, closeTime, isOpen) VALUES 
    (${vilaOliveiraId}, 0, '00:00', '00:00', false)
    ON DUPLICATE KEY UPDATE isOpen=false`
  );

  // Vila Caputera - Segunda a Sexta: 7h-21h
  for (let day = 1; day <= 5; day++) {
    await connection.execute(
      `INSERT INTO operatingHours (unitId, dayOfWeek, openTime, closeTime, isOpen) VALUES 
      (${vilaCaputeraId}, ${day}, '07:00', '21:00', true)
      ON DUPLICATE KEY UPDATE openTime='07:00'`
    );
  }
  
  // Vila Caputera - Sábado: 8h-12h
  await connection.execute(
    `INSERT INTO operatingHours (unitId, dayOfWeek, openTime, closeTime, isOpen) VALUES 
    (${vilaCaputeraId}, 6, '08:00', '12:00', true)
    ON DUPLICATE KEY UPDATE openTime='08:00'`
  );
  
  // Vila Caputera - Domingo: Fechado
  await connection.execute(
    `INSERT INTO operatingHours (unitId, dayOfWeek, openTime, closeTime, isOpen) VALUES 
    (${vilaCaputeraId}, 0, '00:00', '00:00', false)
    ON DUPLICATE KEY UPDATE isOpen=false`
  );
  
  console.log("✅ Horários de funcionamento inseridos");

  console.log("🎉 Seed concluído com sucesso!");
  
} catch (error) {
  console.error("❌ Erro durante o seed:", error);
  process.exit(1);
} finally {
  await connection.end();
}
