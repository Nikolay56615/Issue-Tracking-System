import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalize = (str: string) => {
  if (str === '') {
    return str;
  }

  return str[0].toUpperCase() + str.slice(1).toLowerCase();
};
