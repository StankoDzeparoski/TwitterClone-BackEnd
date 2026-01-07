import { randomUUID } from 'crypto';

export const newId = (prefix: string) => `${prefix}${randomUUID()}`;
