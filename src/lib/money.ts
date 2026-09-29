export function parseMoneyToCents(amountString: string): number {
  const parts = amountString.split('.');
  const dollars = parseInt(parts[0], 10) || 0;
  const cents = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  return (dollars * 100) + cents;
}
