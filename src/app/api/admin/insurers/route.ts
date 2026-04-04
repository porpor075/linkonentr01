import { getSession } from '@/lib/auth';
import { ProductStoreService } from '@/modules/services';
import { APIResponse } from '@/lib/api-utils';
import { InsurerSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return APIResponse.unauthorized('No Session');
    
    return APIResponse.success(await ProductStoreService.getInsurers());
  } catch (error) {
    return APIResponse.handle(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.role.includes('admin')) return APIResponse.unauthorized();

    const body = await request.json();
    const validated = InsurerSchema.parse(body);
    
    const insurers = await ProductStoreService.getInsurers();
    insurers.push(validated);
    await ProductStoreService.saveInsurers(insurers);
    
    return APIResponse.success(validated, 201);
  } catch (error) {
    return APIResponse.handle(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.role.includes('admin')) return APIResponse.unauthorized();

    const { id, ...updateData } = await request.json();
    if (!id) return APIResponse.error('ID is required');

    const insurers = await ProductStoreService.getInsurers();
    const index = insurers.findIndex((i) => i.id === id);

    if (index !== -1) {
      const updated = InsurerSchema.parse({ ...insurers[index], ...updateData });
      insurers[index] = updated;
      await ProductStoreService.saveInsurers(insurers);
      return APIResponse.success(updated);
    }
    
    return APIResponse.error('Not found', 404);
  } catch (error) {
    return APIResponse.handle(error);
  }
}
