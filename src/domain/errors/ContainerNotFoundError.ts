import { DomainError } from './DomainError.ts';

export class ContainerNotFoundError extends DomainError {
  constructor(id: string) {
    super(`no such container: ${id}`);
  }
}