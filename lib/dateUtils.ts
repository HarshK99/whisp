/**
 * Utility functions for formatting dates in a user-friendly way
 */

/**
 * Formats a date as "Feb 3 2025, 11:14 PM"
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',  // Feb
    day: 'numeric',  // 3
    year: 'numeric', // 2025
    hour: 'numeric', // 11
    minute: '2-digit', // 14
    hour12: true     // PM
  };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Formats a date as "Feb 3, 2025" (without time)
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',  // Feb
    day: 'numeric',  // 3
    year: 'numeric'  // 2025
  };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Formats a date as "11:14 PM" (time only)
 * @param date - Date object or date string
 * @returns Formatted time string
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return dateObj.toLocaleTimeString('en-US', options);
}