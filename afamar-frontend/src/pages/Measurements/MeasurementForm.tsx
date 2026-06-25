import { useRef, useState } from "react";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { FormActions } from "../../components/ui/FormActions";
import styles from "./Measurements.module.css";

interface MeasurementFormProps {
  editingId: number | null;
  onSaved: () => void;
  onCancel: () => void;
}

const EMPTY_FORM = {
  client_name: "", client_phone: "", client_address: "",
  scheduled_date: "", scheduled_time: "", notes: "",
};

export function MeasurementForm({ editingId, onSaved, onCancel }: MeasurementFormProps) {
  const notify = useNotify();
  const [form, setForm] = useState(EMPTY_FORM);
  const [photosData, setPhotosData] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: string[] = [];
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      newPhotos.push(base64);
    }
    setPhotosData((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotosData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        photos_data: photosData.length > 0 ? JSON.stringify(photosData) : null,
      };
      if (editingId) {
        await api.updateMeasurement(editingId, payload);
        notify("Medición actualizada", "success");
      } else {
        await api.createMeasurement(payload);
        notify("Medición creada", "success");
      }
      onSaved();
    } catch {
      notify("Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.measurements__form} onSubmit={handleSubmit}>
      <div className={styles.measurements__grid2}>
        <label className={styles.measurements__label}>Cliente
          <input className={styles.measurements__input} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
        </label>
        <label className={styles.measurements__label}>Teléfono
          <input className={styles.measurements__input} value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
        </label>
        <label className={styles.measurements__label}>Dirección
          <input className={styles.measurements__input} value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} />
        </label>
        <label className={styles.measurements__label}>Fecha
          <input className={styles.measurements__input} type="datetime-local" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        </label>
        <label className={styles.measurements__label}>Horario
          <input className={styles.measurements__input} value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} placeholder="Ej: 10:00" />
        </label>
      </div>
      <label className={styles.measurements__label}>Notas
        <textarea className={styles.measurements__textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>
      <label className={styles.measurements__label}>Fotos
        <input ref={fileInputRef} className={styles.measurements__input} type="file" accept="image/*" multiple onChange={handleFileSelect} />
      </label>
      {photosData.length > 0 && (
        <div className={styles.measurements__photos}>
          {photosData.map((src, i) => (
            <div key={i} className={styles.measurements__photoItem}>
              <img className={styles.measurements__photoThumb} src={src} alt={`Foto ${i + 1}`} />
              <button type="button" className={styles.measurements__photoRemove} onClick={() => removePhoto(i)}>&times;</button>
            </div>
          ))}
        </div>
      )}
      <FormActions loading={saving} submitLabel={editingId ? "Actualizar" : "Crear"} onCancel={onCancel} />
    </form>
  );
}
