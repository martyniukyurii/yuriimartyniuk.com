import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматування дати у вигляді "10 травня 2023"
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
