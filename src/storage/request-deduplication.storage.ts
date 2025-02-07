import { Logger } from '@nestjs/common';
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface';

export abstract class RequestDeduplicationStorage {
  protected client: any;
  protected static logger = new Logger(RequestDeduplicationStorage.name);

  constructor(protected readonly options: RequestDeduplicationModuleOptions) { }

  public abstract initStorage(): Promise<void>;
  public abstract set(key: string, value: any, ttl: number): Promise<void>;
  public abstract get(key: string): Promise<any>;
  public abstract delete(key: string): Promise<void>;
}
