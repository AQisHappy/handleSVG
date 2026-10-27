import { DomainError } from './DomainError.ts';

export class InvalidValueError extends DomainError {
  constructor(attribute: string, value: string) {
    super(`invalid value for ${attribute}: ${value}`);
  }
}