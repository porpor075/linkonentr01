import { DataStore } from '../lib/store';

export class PolicyHub {
  static getPolicies() { return DataStore.read<any>('policies.json'); }
  static savePolicies(data: any[]) { DataStore.write('policies.json', data); }
}
