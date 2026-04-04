import fs from 'fs';
import path from 'path';

export class DataStore {
  private static getPath(fileName: string) {
    return path.join(process.cwd(), fileName);
  }

  static read<T>(fileName: string): T[] {
    try {
      const data = fs.readFileSync(this.getPath(fileName), 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  static write<T>(fileName: string, data: T[]): void {
    fs.writeFileSync(this.getPath(fileName), JSON.stringify(data, null, 2), 'utf8');
  }

  static findOne<T extends { id: any }>(fileName: string, id: any): T | undefined {
    const items = this.read<T>(fileName);
    return items.find(item => item.id === id);
  }
}
