import { useRef, useState } from "react";
import { api } from "@/api/client";
import { useConfirm } from "@/components/ui/useConfirm";
import { Modal } from "@/components/ui/Modal";
import { useNotify } from "@/context/NotificationContext";
import { useList } from "@/shared/api/hooks";
import type { ProductPhoto } from "@/types";
import styles from "./ProductPhotos.module.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 30 * 1024 * 1024;

export function ProductPhotos() {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirm();
  const notify = useNotify();
  const { items: photos, loading, error, load } = useList(["productPhotos"], () => api.getLatestProductPhotos(12));

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Formato no permitido. Usá JPG, PNG o WebP.";
    if (file.size > MAX_SIZE) return "La imagen supera los 30MB.";
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const err = validateFile(file);
      if (err) {
        notify(err, "error");
        e.target.value = "";
        return;
      }
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("title", title);
      fd.append("description", description);
      await api.createProductPhoto(fd);
      notify("Foto subida correctamente", "success");
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e: any) {
      notify(e.message || "Error al subir foto", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm("¿Eliminar esta foto?", "Eliminar", true))) return;
    try {
      await api.deleteProductPhoto(id);
      notify("Foto eliminada", "success");
      load();
    } catch (e: any) {
      notify(e.message || "Error al eliminar foto", "error");
    }
  };

  const startEdit = (photo: ProductPhoto) => {
    setEditingId(photo.id);
    setEditTitle(photo.title || "");
    setEditDesc(photo.description || "");
  };

  const saveEdit = async (id: number) => {
    try {
      await api.updateProductPhoto(id, { title: editTitle, description: editDesc });
      notify("Foto actualizada", "success");
      setEditingId(null);
      load();
    } catch (e: any) {
      notify(e.message || "Error al actualizar", "error");
    }
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className={styles.productPhotos}>
      <h2 className={styles.productPhotos__title}>Fotos de productos</h2>

      {dialog}

      <div className={styles.productPhotos__upload}>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
        <input className={styles.productPhotos__input} type="text" placeholder="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={styles.productPhotos__input} type="text" placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className={styles.productPhotos__submit} disabled={!selectedFile || uploading} onClick={handleUpload}>
          {uploading ? "Subiendo..." : "Subir foto"}
        </button>
      </div>

      {error && <div className={styles.productPhotos__error}>{error}</div>}

      {loading ? (
        <div className={styles.productPhotos__loading}>Cargando...</div>
      ) : photos.length === 0 ? (
        <div className={styles.productPhotos__empty}>No hay fotos cargadas</div>
      ) : (
        <div className={styles.productPhotos__grid}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.productPhotos__card}>
              <img
                className={styles.productPhotos__img}
                src={photo.file_path}
                alt={photo.title || ""}
                onClick={() => setLightboxImg(photo.file_path)}
              />
              <div className={styles.productPhotos__info}>
                {editingId === photo.id ? (
                  <div className={styles.productPhotos__editForm}>
                    <input className={styles.productPhotos__input} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" />
                    <input className={styles.productPhotos__input} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Descripción" />
                    <div className={styles.productPhotos__editActions}>
                      <button className={styles.productPhotos__saveBtn} onClick={() => saveEdit(photo.id)}>Guardar</button>
                      <button className={styles.productPhotos__cancelBtn} onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {photo.title && <strong>{photo.title}</strong>}
                    {photo.description && <span>{photo.description}</span>}
                    <div className={styles.productPhotos__actions}>
                      <button className={styles.productPhotos__editBtn} onClick={() => startEdit(photo)}>Editar</button>
                      <button className={styles.productPhotos__delete} onClick={() => handleDelete(photo.id)}>Eliminar</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!lightboxImg} onClose={() => setLightboxImg(null)} maxWidth="900px">
        {lightboxImg && <img src={lightboxImg} alt="" className={styles.productPhotos__lightboxImg} />}
      </Modal>
    </div>
  );
}
