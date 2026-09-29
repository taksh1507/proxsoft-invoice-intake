'use client';

import { useState } from 'react';

const TENANTS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Tenant A', userId: 'user-A' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Tenant B', userId: 'user-B' },
];

export default function Home() {
  const [activeTenant, setActiveTenant] = useState(TENANTS[0].id);
  const [vendorCode, setVendorCode] = useState('ACME');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001');
  const [invoiceDate, setInvoiceDate] = useState('2026-09-29');
  const [lineItems, setLineItems] = useState([{ description: 'Product A', amount: '0.10' }, { description: 'Product B', amount: '0.20' }]);
  const [total, setTotal] = useState('0.30');
  
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const handleLogin = async (tenantId: string, userId: string) => {
    await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ tenantId, userId }),
    });
    setActiveTenant(tenantId);
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const payload = {
      vendorCode,
      invoiceNumber,
      invoiceDate,
      lineItems,
      total,
    };

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // CRITICAL: fetch doesn't throw on 4xx/5xx! Must check response.ok
      if (!response.ok) {
        setStatus({ type: 'error', message: result.error || 'Unknown error occurred.' });
        return;
      }

      setStatus({ type: 'success', message: 'Invoice submitted successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error or unable to reach server.' });
    }
  };

  const handleLineItemChange = (index: number, field: 'description' | 'amount', value: string) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    setLineItems(newItems);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Development Helper: Switch Tenants */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Development: Switch Session</h2>
          <div className="flex gap-2">
            {TENANTS.map(t => (
              <button 
                key={t.id}
                type="button"
                className={`px-4 py-2 rounded ${activeTenant === t.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => handleLogin(t.id, t.userId)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Form */}
        <div className="bg-white p-6 rounded shadow">
          <h1 className="text-xl font-bold mb-6">Invoice Intake</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor Code</label>
              <input type="text" required value={vendorCode} onChange={e => setVendorCode(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-black" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input type="text" required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-black" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Date (YYYY-MM-DD)</label>
              <input type="text" required value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-black" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input type="text" required value={item.description} onChange={e => handleLineItemChange(index, 'description', e.target.value)} placeholder="Description" className="flex-1 border border-gray-300 rounded px-3 py-2 text-black" />
                  <input type="text" required value={item.amount} onChange={e => handleLineItemChange(index, 'amount', e.target.value)} placeholder="$0.00" className="w-24 border border-gray-300 rounded px-3 py-2 text-black" />
                </div>
              ))}
              <button type="button" onClick={() => setLineItems([...lineItems, { description: '', amount: '0.00' }])} className="text-sm text-blue-600 hover:underline">
                + Add Line Item
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total</label>
              <input type="text" required value={total} onChange={e => setTotal(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-black" />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
              Submit Invoice
            </button>
          </form>

          {status && (
            <div className={`mt-4 p-4 rounded font-medium ${status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {status.type === 'error' ? '❌ ' : '✅ '}
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
