// Validação de CPF e Telefone no backend
import { z } from 'zod';

/**
 * Valida CPF (dígitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
  // Validate input length
  if (typeof cpf !== 'string' || cpf.length > 50) return false;
  
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // CPFs inválidos conhecidos
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;
  
  return true;
}

/**
 * Valida telefone brasileiro (10 ou 11 dígitos)
 */
export function validatePhone(phone: string): boolean {
  // Validate input length
  if (typeof phone !== 'string' || phone.length > 30) return false;
  
  const numbers = phone.replace(/\D/g, '');
  
  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (numbers.length !== 10 && numbers.length !== 11) return false;
  
  // DDD deve ser válido (11-99)
  const ddd = parseInt(numbers.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Se for celular (11 dígitos), o primeiro dígito após o DDD deve ser 9
  if (numbers.length === 11 && numbers.charAt(2) !== '9') return false;
  
  return true;
}

/**
 * Remove máscara do CPF
 */
export function unmaskCPF(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\D/g, '').substring(0, 11);
}

/**
 * Remove máscara do telefone
 */
export function unmaskPhone(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\D/g, '').substring(0, 11);
}

// Zod schemas for strong validation

/** Schema para validação rigorosa de email */
export const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Email inválido')
  .max(255, 'Email muito longo');

/** Schema para validação rigorosa de senha */
export const passwordSchema = z.string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(128, 'Senha não pode exceder 128 caracteres')
  .regex(/[a-z]/, 'Senha deve conter letras minúsculas')
  .regex(/[A-Z]/, 'Senha deve conter letras maiúsculas')
  .regex(/[0-9]/, 'Senha deve conter números');

/** Schema para validação de nome */
export const nameSchema = z.string()
  .trim()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(255, 'Nome muito longo')
  .regex(/^[a-zA-Záàâãéèêíïóôõöúçñ\s'-]+$/i, 'Nome contém caracteres inválidos');

/** Schema para validação de CPF */
export const cpfSchema = z.string()
  .refine((cpf) => validateCPF(cpf), 'CPF inválido');

/** Schema para validação de telefone */
export const phoneSchema = z.string()
  .refine((phone) => validatePhone(phone), 'Telefone inválido');

/** Schemas de input combinados */
export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  cpf: cpfSchema,
  phone: phoneSchema,
});
