import { DomainError } from './DomainError.ts';

export class NotContainerError extends DomainError {
  constructor(id: string) {
    super(`not a container: ${id}`);
  }
}