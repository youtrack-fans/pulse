import type {Author} from '../types';

export interface UsersRepository {
  getCurrentUser(): Promise<Author>;
}
