import { DomainError } from './DomainError.ts';

export class DuplicateIdError extends DomainError {
  constructor(id: string) {
    super(`id already exists: ${id}`);
  }
}