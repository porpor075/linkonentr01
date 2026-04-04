import { PolicyHub } from '../hubs/policyHub';
import { AnalyticsHub } from '../hubs/analyticsHub';

export class QuotationEngine {
  static recordSale(policyData: any) {
    const policies = PolicyHub.getPolicies();
    const rate = AnalyticsHub.getRate(policyData.planId, policyData.userId);
    const commAmount = (policyData.premiumAmount * rate) / 100;
    
    const newPolicy = { ...policyData, commissionAmount: commAmount };
    policies.push(newPolicy);
    PolicyHub.savePolicies(policies);
    return newPolicy;
  }
}
