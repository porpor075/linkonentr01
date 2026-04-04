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
    const insurers = await BusinessHub.getInsurers();
    console.log(`[RATES_API] Found ${insurers.length} insurers in DB`);

    const insurerPromises = insurers.map(async (insurer) => {
      // ดึงแผนเฉพาะที่แอดมินเปิดใช้งานไว้
      const allProducts = await BusinessHub.getProducts(insurer.id);
      const managedProducts = allProducts.filter((p: any) => p.isActive);
      
      console.log(`[RATES_API] Insurer: ${insurer.nameEn}, Total Active Plans: ${managedProducts.length}`);

      if (insurer.integrationType === 'API' && insurer.nameEn.toLowerCase().includes('allianz')) {
        // ... (โค้ด Allianz เหมือนเดิม)
        try {
          const accessToken = await getAllianzAccessToken();
          if (!accessToken) throw new Error('No Access Token');

          const targetPlans = (insuranceCategory === 'CMI' || searchMode === 'list') 
            ? managedProducts.filter(p => (insuranceCategory === 'CMI' ? p.planType === 'CMI' : p.planType !== 'CMI'))
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

              // ตรวจสอบว่า API คืนราคามาสำเร็จหรือไม่
              const hasPackages = quote && quote.productPackages && quote.productPackages[0];
              const isTimeout = quote?.fault?.faultstring?.includes('Timeout') || quote?.errors?.some((err: any) => err.code === 'TIMEOUT');

              if (hasPackages) {
                const pkg = quote.productPackages[0];
                const cov = pkg.coverages[0];
                const price = pkg.premium?.grossPremium || cov.premium?.grossPremium || null;

                if (price) {
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
                    coverages: (cov.coverageItems ? (Array.isArray(cov.coverageItems[0]) ? cov.coverageItems[0] : cov.coverageItems) : []).map((i: any) => ({ 
                      code: i.code, 
                      title: i.name || i.title, 
                      value: i.sumInsured !== undefined && i.sumInsured !== null ? i.sumInsured.toLocaleString() : (i.value || 'N/A') 
                    }))
                  };
                }
              }

              // --- FALLBACK LOGIC: ถ้า API ล่ม หรือหาแผนไม่เจอ ให้ดึงราคาจาก DB แทน ---
              if (isTimeout || !hasPackages) {
                console.log(`[RATES_API] Fallback for ${product.planCode} (API Timeout or No Data)`);
                // ใช้ราคาจาก DB (ถ้าเป็น 0 ให้ม็อคเป็นราคามาตรฐาน)
                const fallbackPrice = product.totalPremium > 0 ? product.totalPremium : (product.planType === 'VMI1' ? 15900 : 7900);

                return {
                  id: `AL-FB-${product.planCode}-${Date.now()}`,
                  name: insurer.nameTh,
                  logoUrl: insurer.logoUrl,
                  planType: product.planType,
                  planCode: product.planCode,
                  planName: product.planName + ' (API Offline)',
                  price: fallbackPrice,
                  confirmedSumInsured: product.planType === 'VMI1' ? (body.sumInsured?.toLocaleString() || '500,000') : '100,000',
                  type: insuranceCategory,
                  isApi: true,
                  isFallback: true, // บอกให้รู้ว่าเป็นราคาจำลอง
                  isAvailable: true,
                  coverages: [
                    { title: 'ความรับผิดชอบบุคคลภายนอก', value: '500,000' },
                    { title: 'ความเสียหายต่อตัวรถยนต์', value: product.planType === 'VMI1' ? 'ตามทุนประกัน' : 'คุ้มครอง' },
                    { title: 'สถานะ API', value: isTimeout ? 'Gateway Timeout' : 'No Data' }
                  ]
                };
              }

            } catch (e) { console.error(`Error fetching Allianz ${product.planCode}`, e); }
            return null;
          });

          return await Promise.all(quotePromises);
        } catch (authErr) {
          console.error('Allianz Auth Failed', authErr);
          return [];
        }

      } else {
        // สำหรับบริษัทอื่นๆ (MANUAL)
        const manualPlans: any[] = [];
        managedProducts.forEach((p: any) => {
          // ตรวจสอบประเภท (VMI/CMI)
          const isCMI = insuranceCategory === 'CMI';
          const isMatchCategory = (isCMI && p.planType === 'CMI') || (!isCMI && p.planType !== 'CMI');
          
          // ตรวจสอบรหัสแผน (ถ้าไม่ได้หาแบบลิสต์)
          const isMatchSearch = searchMode === 'list' || p.planCode === body.planType || p.planType === body.planType;

          if (isMatchCategory && isMatchSearch) {
            manualPlans.push({
              id: `MN-${p.id}-${Date.now()}`,
              name: insurer.nameTh,
              logoUrl: insurer.logoUrl,
              planType: p.planType,
              planCode: p.planCode,
              planName: p.planName,
              price: p.totalPremium,
              confirmedSumInsured: p.planType === 'VMI1' ? (body.sumInsured?.toLocaleString() || 'ตามทุนประกัน') : 'ตามเงื่อนไขแอดมิน',
              type: insuranceCategory,
              coverages: [
                { title: 'ความรับผิดชอบบุคคลภายนอก', value: '500,000' },
                { title: 'ความเสียหายต่อตัวรถยนต์', value: p.planType === 'VMI1' ? 'ตามทุนประกัน' : 'คุ้มครอง' },
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
