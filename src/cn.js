import { twMerge } from "tailwind-merge";

// twMerge already joins strings and skips falsy values, the later class wins on conflicts
export const cn = twMerge;
