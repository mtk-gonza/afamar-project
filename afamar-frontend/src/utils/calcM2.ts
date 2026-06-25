export function calcM2(length: number, width: number, unit: "cm" | "m" = "cm"): number {
  const factor = unit === "cm" ? 10000 : 1;
  return (length * width) / factor;
}

export function calcItemTotal(m2: number, priceM2: number, quantity: number): number {
  return m2 * priceM2 * quantity;
}
