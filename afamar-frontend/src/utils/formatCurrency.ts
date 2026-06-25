export function formatARS(value: number): string {
  return `$ ${value.toFixed(2)}`;
}

export function formatUSD(value: number): string {
  if (value <= 0) return "-";
  return `US$ ${value.toFixed(2)}`;
}

export function formatBalance(due: number): string {
  return due > 0 ? `$ ${due.toFixed(2)}` : "Pagado";
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString();
}
