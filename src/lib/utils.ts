import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseJsonOrEmpty(text: string): any {
  try {
    return JSON.parse(text)
  } catch (e) {
    return {}
  }
}
