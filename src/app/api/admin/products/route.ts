import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllianzAccessToken, getAllianzPackagesList } from '@/integrations/insurers/allianz';
import { ProductStoreService } from '@/modules/services';
import { APIResponse } from '@/lib/api-utils';
import { ProductSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return APIResponse.unauthorized('No Session');

    const { searchParams } = new URL(request.url);
    const insurerId = searchParams.get('insurerId');
    const sync = searchParams.get('sync'); 

    if (sync === 'true') {
      if (!session.role.includes('admin')) return APIResponse.forbidden('Sync is restricted to admins');

      if (insurerId) {
        const insurers = await ProductStoreService.getInsurers();
        const insurer = insurers.find((i) => i.id === Number(insurerId));
        if (insurer?.integrationType === 'API' && insurer.nameEn.toLowerCase().includes('allianz')) {
          const token = await getAllianzAccessToken();
          const mockVehicle = { brand: "16", model: "1041", year: "2025", fuelType: "PETROL" };
          const apiResult = await getAllianzPackagesList(token, mockVehicle, []);

          if (apiResult && apiResult.productPackages) {
            const allCurrentProducts = await ProductStoreService.getProducts();
            const currentProducts = allCurrentProducts.filter((p) => p.insurerId !== insurer.id);
            const newApiPlans = apiResult.productPackages[0].coverages.map((cov: any) => ({
              id: `al-${cov.code}-${Date.now()}`,
              insurerId: insurer.id,
              planName: cov.name,
              planCode: cov.code,
              planType: cov.code.includes('VMI1') ? 'VMI1' : (cov.code.includes('VMI2+') ? 'VMI2+' : cov.code),
              repairType: cov.code === 'VMI1' ? 'DEALER' : 'COMPANY',
              basePremium: 0, 
              totalPremium: apiResult.productPackages[0].premium?.grossPremium || 0,
              isActive: true,
              isApiManaged: true
            }));
            const updatedList = [...currentProducts, ...newApiPlans];
            await ProductStoreService.saveProducts(updatedList);
            return APIResponse.success(newApiPlans);
          }
        }
      }
    }

    if (insurerId) {
      return APIResponse.success(await ProductStoreService.getProducts(Number(insurerId)));
    }

    return APIResponse.success(await ProductStoreService.getProducts());
  } catch (error) {
    return APIResponse.handle(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.role.includes('admin')) return APIResponse.unauthorized();

    const body = await request.json();
    const validated = ProductSchema.parse({
      ...body,
      id: "p-" + Date.now(),
      isActive: true,
      isApiManaged: false
    });
    
    const products = await ProductStoreService.getProducts();
    products.push(validated);
    await ProductStoreService.saveProducts(products);
    return APIResponse.success(validated, 201);
  } catch (error) {
    return APIResponse.handle(error);
  }
}
