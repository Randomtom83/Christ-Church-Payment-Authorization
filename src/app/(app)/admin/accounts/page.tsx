import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAll } from '@/lib/db/accounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Chart of Accounts' };

export default async function AdminAccountsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect('/login');

  const roles = auth.profile.role as string[];
  if (!roles.includes('admin') && !roles.includes('treasurer')) {
    redirect('/dashboard');
  }

  const accounts = await getAll();

  // Group by entity then category
  const grouped: Record<string, Record<string, typeof accounts>> = {};
  for (const acct of accounts) {
    const entity = acct.entity === 'church' ? 'Christ Church' : 'Nursery School';
    if (!grouped[entity]) grouped[entity] = {};
    if (!grouped[entity][acct.category]) grouped[entity][acct.category] = [];
    grouped[entity][acct.category].push(acct);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chart of Accounts</h1>

      {Object.entries(grouped).map(([entity, categories]) => (
        <div key={entity} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{entity}</h2>
          {Object.entries(categories).map(([category, accts]) => (
            <Card key={category} className="mb-3">
              <CardHeader className="py-3">
                <CardTitle className="text-base font-semibold text-gray-700">{category}</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <div className="divide-y divide-gray-100">
                  {accts.map((a) => (
                    <div key={a.id} className="flex justify-between items-center py-2">
                      <div>
                        <span className="text-base text-gray-900">{a.name}</span>
                        <span className="text-sm text-gray-400 ml-2">{a.account_type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-gray-500">{a.code}</span>
                        {a.legacy_code && (
                          <span className="text-xs text-gray-400 ml-1">({a.legacy_code})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
