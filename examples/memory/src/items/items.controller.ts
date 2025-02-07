import { Controller, Get, Post, Put, Delete, Param, Body, Logger, Inject } from '@nestjs/common';
import { ItemsService } from './items.service';
import { Item } from './items.interface';

@Controller('items')
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(@Inject(ItemsService) private readonly itemsService: ItemsService) {
    this.logger.log('ItemsController constructor called');
    // Add this check
    if (!itemsService) {
      this.logger.error('ItemsService is undefined in constructor');
    }
  }

  @Get()
  findAll() {
    return this.itemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  create(@Body() item: Item) {
    return this.itemsService.create(item);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() item: Item) {
    return this.itemsService.update(id, item);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.itemsService.delete(id);
  }
}
