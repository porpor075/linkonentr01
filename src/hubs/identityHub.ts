import { DataStore } from '../lib/store';

export class IdentityHub {
  static getUsers() { return DataStore.read<any>('users.json'); }
  static saveUsers(data: any[]) { DataStore.write('users.json', data); }
}
