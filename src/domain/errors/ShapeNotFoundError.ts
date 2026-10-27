import { DomainError } from './DomainError.ts';

export class ShapeNotFoundError extends DomainError {
  constructor(id: string) {
    super(`no such shape: ${id}`);
  }
}