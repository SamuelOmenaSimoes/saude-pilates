/**
 * Feriados nacionais brasileiros fixos e móveis
 * Atualizar anualmente os feriados móveis (Carnaval, Páscoa, Corpus Christi)
 */

export const HOLIDAYS_2025 = [
  "2025-01-01", // Ano Novo
  "2025-03-03", // Carnaval (segunda)
  "2025-03-04", // Carnaval (terça)
  "2025-04-18", // Sexta-feira Santa
  "2025-04-21", // Tiradentes
  "2025-05-01", // Dia do Trabalho
  "2025-06-19", // Corpus Christi
  "2025-09-07", // Independência do Brasil
  "2025-10-12", // Nossa Senhora Aparecida
  "2025-11-02", // Finados
  "2025-11-15", // Proclamação da República
  "2025-12-25", // Natal
];

export const HOLIDAYS_2026 = [
  "2026-01-01", // Ano Novo
  "2026-02-16", // Carnaval (segunda)
  "2026-02-17", // Carnaval (terça)
  "2026-04-03", // Sexta-feira Santa
  "2026-04-21", // Tiradentes
  "2026-05-01", // Dia do Trabalho
  "2026-06-04", // Corpus Christi
  "2026-09-07", // Independência do Brasil
  "2026-10-12", // Nossa Senhora Aparecida
  "2026-11-02", // Finados
  "2026-11-15", // Proclamação da República
  "2026-12-25", // Natal
];

// Combinar todos os feriados
export const ALL_HOLIDAYS = [...HOLIDAYS_2025, ...HOLIDAYS_2026];

/**
 * Verifica se uma data é feriado
 */
export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return ALL_HOLIDAYS.includes(dateString);
}
