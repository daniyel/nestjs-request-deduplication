import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Item } from './items.interface';

@Injectable()
export class ItemsService implements OnModuleInit {
  private readonly logger = new Logger(ItemsService.name);
  private readonly items: Item[] = [
    {
      id: '1',
      name: 'Item 1',
      description: 'Description 1',
    },
    {
      id: '2',
      name: 'Item 2',
      description: 'Description 2',
    },
  ];

  constructor() {
    this.logger.log('ItemsService constructor called');
  }

  onModuleInit() {
    this.logger.log('ItemsService initialized');
  }

  findAll(): Item[] {
    this.logger.log('findAll called');
    return this.items;
  }

  findOne(id: string): Item | undefined {
    return this.items.find(item => item.id === id);
  }

  create(item: Item): Item {
    this.items.push(item);
    return item;
  }

  update(id: string, updatedItem: Item): Item | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    this.items[index] = updatedItem;
    return updatedItem;
  }

  delete(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }
}
