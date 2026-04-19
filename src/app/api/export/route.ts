import { NextRequest, NextResponse } from 'next/server';
import { generateRequisitionsCSV } from '@/lib/actions/export';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await generateRequisitionsCSV({
    fromDate: body.fromDate,
    toDate: body.toDate,
    entity: body.entity,
    status: body.status,
  });

  if (!result.success || !result.csv) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const fromLabel = body.fromDate || 'all';
  const toLabel = body.toDate || 'now';
  const filename = `churchops-requisitions-${fromLabel}-${toLabel}.csv`;

  return new NextResponse(result.csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
