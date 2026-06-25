export function generarWhatsAppMessage(data: {
  client_name?: string;
  total?: number;
  total_usd?: number;
  number?: string;
  items?: string[];
  notes?: string;
}): string {
  const L: string[] = [];
  L.push("Hola! Te enviamos el siguiente detalle:");

  if (data.client_name) L.push(`Cliente: ${data.client_name}`);
  if (data.number) L.push(`N°: ${data.number}`);

  if (data.items && data.items.length > 0) {
    L.push(""); L.push("Detalle:");
    data.items.forEach((item, i) => L.push(`${i + 1}. ${item}`));
  }

  if (data.total !== undefined) L.push(`\nTotal ARS: $${data.total.toFixed(2)}`);
  if (data.total_usd && data.total_usd > 0) L.push(`Total USD: US$${data.total_usd.toFixed(2)}`);

  if (data.notes) L.push(`\nNotas: ${data.notes}`);

  L.push(""); L.push("Consultas al WhatsApp");
  return L.join("\n");
}
