import { getLogs } from '@/lib/db';
import LogActivityView from '@/components/LogActivityView';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const initialLogs = await getLogs();

  return (
    <div className="space-y-6">
      <LogActivityView initialLogs={initialLogs} />
    </div>
  );
}
