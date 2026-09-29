import { pgTable, uuid, varchar, integer, timestamp, unique, jsonb, date } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  vendorCode: varchar('vendor_code', { length: 100 }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  invoiceDate: date('invoice_date').notNull(),
  lineItems: jsonb('line_items').notNull(),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantVendorInvoiceUnique: unique('tenant_vendor_invoice_idx').on(
      table.tenantId,
      table.vendorCode,
      table.invoiceNumber
    ),
  };
});
