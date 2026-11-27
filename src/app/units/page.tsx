import { cookies } from 'next/headers';
import { getUnits } from '@/lib/db';
import UnitInventoryView from '@/components/UnitInventoryView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Inventori Unit Mobil | Inventory System',
  description: 'Pencatatan dan pengelolaan daftar inventori muatan serta peralatan unit mobil operasional.',
};

export default async function UnitsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value || null;

  const units = await getUnits();

  return (
    <div className="py-2">
      <UnitInventoryView
        initialUnits={units}
        userRole={role}
      />
    </div>
  );
}
