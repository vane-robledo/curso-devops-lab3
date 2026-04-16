import { Injectable, NotFoundException } from '@nestjs/common';

export interface Item {
  id: number;
  name: string;
  description: string;
}

@Injectable()
export class ItemsService {
  private items: Item[] = [
    { id: 1, name: 'Item uno', description: 'Primer ejemplo de item' },
    { id: 2, name: 'Item dos', description: 'Segundo ejemplo de item' },
  ];
  private nextId = 3;

  findAll(): Item[] {
    return this.items;
  }

  findOne(id: number): Item {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new NotFoundException(`Item ${id} no encontrado`);
    return item;
  }

  create(name: string, description: string): Item {
    const item: Item = { id: this.nextId++, name, description };
    this.items.push(item);
    return item;
  }

  remove(id: number): void {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) throw new NotFoundException(`Item ${id} not found`);
    this.items.splice(index, 1);
  }
}
