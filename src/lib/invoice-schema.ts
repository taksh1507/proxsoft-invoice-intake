import { z } from 'zod';

export const invoiceSchema = z.object({
  vendorCode: z.string().min(1, 'Vendor code is required').max(100),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.string().regex(/^\d+\.\d{2}$/, 'Must be a valid money string, e.g. "0.10"'),
  })).min(1, 'At least one line item is required'),
  total: z.string().regex(/^\d+\.\d{2}$/, 'Must be a valid money string, e.g. "0.30"'),
}).strict(); // Rejects any unexpected properties like `tenantId`
