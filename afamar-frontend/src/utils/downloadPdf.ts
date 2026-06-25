export async function downloadPdf(
  fetcher: () => Promise<Blob>,
  filename: string,
  onError?: (msg: string) => void,
): Promise<void> {
  try {
    const blob = await fetcher();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    onError?.("Error al descargar PDF");
  }
}
