import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { invoiceSchema } from '@/lib/invoice-schema';
import { parseMoneyToCents } from '@/lib/money';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = invoiceSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
    }

    const data = result.data;

    const calculatedTotal = data.lineItems.reduce(
      (sum, item) => sum + parseMoneyToCents(item.amount),
      0
    );
    const invoiceTotal = parseMoneyToCents(data.total);

    if (calculatedTotal !== invoiceTotal) {
      return NextResponse.json(
        { error: 'Invoice total does not match line item total.' },
        { status: 400 }
      );
    }

    await db.insert(invoices).values({
      tenantId: session.tenantId, // IMPORTANT: from session, not from request!
      vendorCode: data.vendorCode,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      lineItems: data.lineItems,
      totalCents: invoiceTotal,
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error: any) {
    // Check for PostgreSQL unique constraint violation
    // postgres.js typically returns code '23505'
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'An invoice with this vendor code and invoice number already exists.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // IMPORTANT: filter at the database layer!
  const data = await db.select()
    .from(invoices)
    .where(eq(invoices.tenantId, session.tenantId));

  return NextResponse.json({ invoices: data }, { status: 200 });
}
