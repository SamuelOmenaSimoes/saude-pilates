import { db } from './server/db.ts';

async function testGetAvailableSlots() {
  console.log('=== TESTE: getAvailableSlots ===\n');
  
  const roomId = 1;
  const date = new Date('2025-12-10'); // Quarta-feira
  const timestamp = date.getTime();
  
  console.log('Input:');
  console.log('  roomId:', roomId);
  console.log('  date:', date.toISOString());
  console.log('  timestamp:', timestamp);
  console.log('');
  
  try {
    // 1. Get room
    console.log('1. Buscando sala...');
    const room = await db.getRoomById(roomId);
    console.log('   Sala encontrada:', room?.name, '(ID:', room?.id, ')');
    
    if (!room) {
      console.error('   ❌ Sala não encontrada!');
      return;
    }
    
    // 2. Get unit
    console.log('\n2. Buscando unidade...');
    const unit = await db.getUnitById(room.unitId);
    console.log('   Unidade encontrada:', unit?.name, '(ID:', unit?.id, ')');
    
    if (!unit) {
      console.error('   ❌ Unidade não encontrada!');
      return;
    }
    
    // 3. Get operating hours
    console.log('\n3. Buscando horários de funcionamento...');
    const dayOfWeek = date.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
    console.log('   Dia da semana:', dayOfWeek, '(0=dom, 1=seg, ..., 6=sáb)');
    
    const operatingHours = await db.getOperatingHoursByUnitId(unit.id);
    console.log('   Total de registros:', operatingHours.length);
    
    const todayHours = operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
    
    if (!todayHours) {
      console.log('   ❌ Não há horário cadastrado para este dia');
      return;
    }
    
    console.log('   Horário encontrado:');
    console.log('     - Aberto:', todayHours.isOpen ? 'SIM' : 'NÃO');
    console.log('     - Abertura:', todayHours.openTime);
    console.log('     - Fechamento:', todayHours.closeTime);
    
    if (!todayHours.isOpen) {
      console.log('   ⚠️  Unidade fechada neste dia');
      return;
    }
    
    // 4. Generate slots
    console.log('\n4. Gerando slots de horário...');
    const [openHour] = todayHours.openTime.split(':').map(Number);
    const [closeHour] = todayHours.closeTime.split(':').map(Number);
    
    console.log('   Hora de abertura:', openHour);
    console.log('   Hora de fechamento:', closeHour);
    
    const slots = [];
    for (let hour = openHour; hour < closeHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time: timeString,
        available: true,
        count: 0
      });
    }
    
    console.log('\n✅ SUCESSO! Slots gerados:', slots.length);
    console.log('\nPrimeiros 5 slots:');
    slots.slice(0, 5).forEach(slot => {
      console.log(`  - ${slot.time} (${slot.available ? 'disponível' : 'ocupado'}, ${slot.count}/4 vagas)`);
    });
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testGetAvailableSlots();
