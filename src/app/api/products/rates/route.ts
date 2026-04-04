import { NextResponse } from 'next/server';
import { getAllianzAccessToken, getAllianzQuickQuote, getAllianzPackagesList } from '@/integrations/insurers/allianz';
import { getSession } from '@/lib/auth';
import { BusinessHub } from '@/hubs/businessHub';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { searchMode, insuranceCategory, sumInsured } = body;

  try {
    const accessToken = await getAllianzAccessToken();
    const insurers = await BusinessHub.getInsurers();

    const insurerPromises = insurers.map(async (insurer) => {
      // ดึงแผนเฉพาะที่แอดมินเปิดใช้งานไว้ และกรองตามประเภท VMI/CMI
      const allProducts = await BusinessHub.getProducts(insurer.id);
      const managedProducts = allProducts.filter((p: any) => {
        if (!p.isActive) return false;
        if (insuranceCategory === 'CMI') return p.planType === 'CMI';
        return p.planType !== 'CMI';
      });
      
      if (insurer.integrationType === 'API' && insurer.nameEn.toLowerCase().includes('allianz')) {
        // --- แผนที่ต้องการเช็ค ---
        const targetPlans = (insuranceCategory === 'CMI' || searchMode === 'list') 
          ? managedProducts 
          : managedProducts.filter((p: any) => p.planCode === body.planType);

        const quotePromises = targetPlans.map(async (product: any) => {
          try {
            const isCMI = insuranceCategory === 'CMI';
            const quoteParams = { 
              ...body, 
              productCode: isCMI ? 'CMI' : 'VMI',
              planType: product.planCode,
              sumInsured: isCMI ? 0 : (product.planCode === 'VMI1' ? (body.listSumInsured || body.sumInsured || 500000) : 100000),
              garageType: isCMI ? 'UNSPECIFIED' : body.garageType
            };

            const quote = await getAllianzQuickQuote(accessToken, quoteParams);
            
            if (quote && quote.productPackages && quote.productPackages[0]) {
              const pkg = quote.productPackages[0];
              const cov = pkg.coverages[0];
              const price = pkg.premium?.grossPremium || cov.premium?.grossPremium || null;

              if (price) {
                // รายละเอียดความคุ้มครองพื้นฐานสำหรับ CMI (กรณี API ไม่คืนมา)
                const cmiDefaultCoverages = [
                  { code: 'DEATH', title: 'เสียชีวิต/ทุพพลภาพถาวร', value: '500,000' },
                  { code: 'MEDICAL', title: 'ค่ารักษาพยาบาล (ตามจริง)', value: '80,000' },
                  { code: 'COMPENSATION', title: 'เงินชดเชยรายวัน (ผู้ป่วยใน)', value: '200' },
                  { code: 'TOTAL_LIMIT', title: 'วงเงินความคุ้มครองสูงสุด', value: '504,000' }
                ];

                return {
                  id: `AL-${cov.code}-${Date.now()}-${Math.random()}`,
                  name: insurer.nameTh,
                  logoUrl: insurer.logoUrl,
                  planType: cov.code,
                  planCode: cov.code,
                  planName: product.planName,
                  price: price,
                  confirmedSumInsured: cov.sumInsured?.toLocaleString() || '0',
                  type: insuranceCategory,
                  isApi: true,
                  isAvailable: true,
                  coverages: (cov.coverageItems ? (Array.isArray(cov.coverageItems[0]) ? cov.coverageItems[0] : cov.coverageItems) : (insuranceCategory === 'CMI' ? cmiDefaultCoverages : [])).map((i: any) => ({ 
                    code: i.code, 
                    title: i.name || i.title, 
                    value: i.sumInsured !== undefined && i.sumInsured !== null ? i.sumInsured.toLocaleString() : (i.value || 'N/A') 
                  }))
                };
              }
            }
          } catch (e) { console.error(`Error fetching ${product.planCode}`, e); }
          
          return {
            id: `AL-${product.planCode}-empty`,
            name: insurer.nameTh,
            logoUrl: insurer.logoUrl,
            planType: product.planCode,
            planCode: product.planCode,
            planName: product.planName,
            price: null,
            isAvailable: false,
            type: insuranceCategory
          };
        });

        return await Promise.all(quotePromises);

      } else if (insurer.integrationType === 'MANUAL') {
        const manualPlans: any[] = [];
        managedProducts.forEach((p: any) => {
          if (insuranceCategory === 'CMI' || searchMode === 'list' || p.planType === body.planType) {
            manualPlans.push({
              id: `MN-${p.id}`,
              name: insurer.nameTh,
              logoUrl: insurer.logoUrl,
              planType: p.planType,
              planCode: p.planCode,
              planName: p.planName,
              price: p.totalPremium,
              confirmedSumInsured: 'ตามเงื่อนไขแอดมิน',
              type: insuranceCategory,
              coverages: [
                { title: 'ความรับผิดชอบบุคคลภายนอก', value: '500,000' },
                { title: 'ความเสียหายต่อตัวรถยนต์', value: p.planType === 'VMI1' ? 'ตามทุนประกัน' : 'N/A' },
                { title: 'อุบัติเหตุส่วนบุคคล (RY01)', value: '100,000' },
                { title: 'การประกันตัวผู้ขับขี่ (RY03)', value: '200,000' }
              ],
              isManual: true,
              isAvailable: true
            });
          }
        });
        return manualPlans;
      }
      return [];
    });

    const nestedResults = await Promise.all(insurerPromises);
    const allPlans = nestedResults.flat().filter(p => p && p.price !== null && p.price !== undefined && p.price > 0);

    const sortedPlans = allPlans.sort((a, b) => {
      const order: any = { 'VMI1': 1, 'VMI2+': 2, 'VMI3+': 3, 'VMI2': 4, 'VMI3': 5, 'CMI': 6 };
      return (order[a.planType] || 99) - (order[b.planType] || 99);
    });

    return NextResponse.json({ status: 'success', plans: sortedPlans });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}
