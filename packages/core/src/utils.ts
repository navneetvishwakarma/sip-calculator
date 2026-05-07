export function monthlyRate(annualPct: number): number {
  return annualPct / 12 / 100;
}

export function formatINR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const TEN_LAKH = 1_000_000;
  const CRORE = 10_000_000;

  if (abs >= CRORE) {
    return `${sign}₹${parseFloat((abs / CRORE).toFixed(2))} Crore`;
  }
  if (abs >= TEN_LAKH) {
    return `${sign}₹${parseFloat((abs / 100_000).toFixed(2))} Lakh`;
  }
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
