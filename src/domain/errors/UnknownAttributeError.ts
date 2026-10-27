import { DomainError } from './DomainError.ts';

export class UnknownAttributeError extends DomainError {
  constructor(attribute: string) {
    super(`unknown attribute: ${attribute}`);
  }
}