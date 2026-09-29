import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

// Mock auth session
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));
import { getSession } from '@/lib/auth';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(true),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ id: 'inv-1', tenantId: 'TENANT-A' }]),
      })),
    })),
  },
}));
import { db } from '@/db';

describe('Invoices API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = (body: any) => {
    return new NextRequest('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('Test 1 — Tenant isolation: GET /api/invoices only returns session tenant invoices', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-a', tenantId: 'TENANT-A' });
    
    const req = new NextRequest('http://localhost/api/invoices', { method: 'GET' });
    const res = await GET();
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invoices[0].tenantId).toBe('TENANT-A');
  });

  it('Test 2 — Body tenant ID attack: request.tenantId can NEVER override session.tenantId', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-a', tenantId: 'TENANT-A' });
    
    // Attempting to inject TENANT-B
    const req = mockRequest({
      tenantId: 'TENANT-B',
      vendorCode: 'ACME',
      invoiceNumber: 'INV-001',
      invoiceDate: '2026-09-29',
      lineItems: [{ description: 'Item 1', amount: '10.00' }],
      total: '10.00',
    });

    const res = await POST(req);
    
    // Our Zod schema strictly rejects unknown properties like tenantId
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details[0].message).toContain('Unrecognized key: "tenantId"');
  });

  it('Test 3 — Floating-point case: ensures $0.10 + $0.20 === $0.30 via integer math', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-a', tenantId: 'TENANT-A' });
    
    const req = mockRequest({
      vendorCode: 'ACME',
      invoiceNumber: 'INV-002',
      invoiceDate: '2026-09-29',
      lineItems: [
        { description: 'Item A', amount: '0.10' },
        { description: 'Item B', amount: '0.20' }
      ],
      total: '0.30', // JS 0.1 + 0.2 = 0.30000000000000004
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('Test 4 — Duplicate protection', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: 'user-a', tenantId: 'TENANT-A' });
    
    const req = mockRequest({
      vendorCode: 'ACME',
      invoiceNumber: 'INV-DUP',
      invoiceDate: '2026-09-29',
      lineItems: [{ description: 'Item', amount: '10.00' }],
      total: '10.00',
    });

    // Simulate PostgreSQL unique constraint error on second insert
    const insertMock = vi.fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce({ code: '23505' });

    // override mock for this specific test
    (db.insert as any).mockImplementation(() => ({
      values: insertMock
    }));

    const res1 = await POST(req);
    expect(res1.status).toBe(201);

    // Re-create request body for second call
    const req2 = mockRequest({
      vendorCode: 'ACME',
      invoiceNumber: 'INV-DUP',
      invoiceDate: '2026-09-29',
      lineItems: [{ description: 'Item', amount: '10.00' }],
      total: '10.00',
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(409);
    
    const data = await res2.json();
    expect(data.error).toBe('An invoice with this vendor code and invoice number already exists.');
  });
});
