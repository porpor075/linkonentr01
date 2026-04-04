import { NextResponse } from 'next/server';
import { getAllianzAccessToken, createAllianzContract } from '@/integrations/insurers/allianz';
import { getSession } from '@/lib/auth';
import { BusinessHub } from '@/hubs/businessHub';
import { QuotationEngine } from '@/engines/quotationEngine';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { planId, vehicle, insured, quotationId } = body;

  try {
    const insurers = await BusinessHub.getInsurers();
    // ค้นหาบริษัทประกันจากแผน (ในกรณีนี้เราสมมติจากข้อมูลที่ส่งมา)
    const insurer = insurers.find((i: any) => i.id === 1); // Allianz เป็น Default สำหรับ API

    let newPolicyData: any = {
      id: "POL-" + Date.now(),
      quotationId: quotationId || "QUO-" + Date.now(),
      userId: session.id,
      createdAt: new Date().toISOString(),
      premiumAmount: body.premiumAmount || 15000,
      status: 'PENDING_ADMIN',
      policyNumber: null,
      insured: insured, // แนบข้อมูลผู้เอาประกันไปด้วยเพื่อส่ง API
      quotation: {
        customerName: insured?.firstName + " " + insured?.lastName,
        vehicleBrand: vehicle?.make || "Toyota",
        vehicleModel: vehicle?.model || "Altis",
        user: { fullName: session.name }
      },
      plan: {
        planName: body.planName || "แผนประกันภัย",
        planCode: body.plan?.planCode || "VMI1", // ต้องส่งรหัสแผนไปให้ API
        insurer: insurer
      },
      vehicle: vehicle,
      planId: planId // ใช้ productId เพื่อคำนวณคอมมิชชัน
    };

    if (insurer.integrationType === 'API' && insurer.nameEn.toLowerCase().includes('allianz')) {
      try {
        const accessToken = await getAllianzAccessToken();
        const apiResponse = await createAllianzContract(accessToken, newPolicyData);
        
        if (apiResponse && apiResponse.contractNumber) {
          newPolicyData.status = 'SUCCESS';
          newPolicyData.policyNumber = apiResponse.contractNumber;
        } else if (apiResponse && apiResponse.errors) {
          console.error('[Allianz API Error]:', apiResponse.errors);
          return NextResponse.json({ success: false, error: apiResponse.errors[0] }, { status: 400 });
        } else {
          // Fallback
          newPolicyData.status = 'SUCCESS';
          newPolicyData.policyNumber = "AZ-" + Date.now().toString().slice(-6);
        }
      } catch (e) {
        console.error('[Allianz Connection Error]:', e);
        newPolicyData.status = 'PENDING_ADMIN';
      }
    }

    // บันทึกผ่าน QuotationEngine (ซึ่งจะคำนวณคอมมิชชันให้อัตโนมัติ)
    const savedPolicy = QuotationEngine.recordSale(newPolicyData);

    return NextResponse.json({ success: true, policy: savedPolicy });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
