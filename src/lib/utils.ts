import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind's merge strategy,
 * allowing conditionally applied classes in a React component
 *
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a time in seconds to a MM:SS string
 * @param timer - Time in seconds
 * @returns Formatted time string in MM:SS format
 */
export function formatTimer(timer: number) {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Safely executes a promise and returns a discriminated union result object
 * @param promise - The promise to execute
 * @returns Result object containing data or error
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}
