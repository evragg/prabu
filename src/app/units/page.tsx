import { cookies } from 'next/headers';
import { getUnits, getLogs } from '@/lib/db';
import UnitInventoryView from '@/components/UnitInventoryView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Inventori Unit Mobil | Inventory System',
  description: 'Pencatatan dan pengelolaan daftar inventori muatan serta peralatan unit mobil operasional.',
};

export default async function UnitsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value || null;

  const [units, logs] = await Promise.all([
    getUnits(),
    getLogs(),
  ]);

  return (
    <div className="py-2">
      <UnitInventoryView
        initialUnits={units}
        initialLogs={logs.map((l) => ({
          id: l.id,
          serialNumber: l.serialNumber,
          itemName: l.itemName,
          action: l.action,
          person: l.person,
          location: l.location,
          quantity: l.quantity,
          timestamp: l.timestamp.toString(),
        }))}
        userRole={role}
      />
    </div>
  );
}
