import { SketchEditor } from "@/components/SketchEditor/SketchEditor";
import { SignaturePad } from "@/components/SignaturePad/SignaturePad";
import type { SketchPage } from "@/types";
import styles from "./WorkOrderForm.module.css";

interface Props {
  designObservations: string;
  importantObservations: string;
  sketchPages: SketchPage[];
  digitalSignature: string | null;
  onDesignChange: (v: string) => void;
  onImportantChange: (v: string) => void;
  onSketchChange: (pages: SketchPage[]) => void;
  onSignatureChange: (sig: string | null) => void;
}

export function WoFormObservations({
  designObservations, importantObservations,
  sketchPages, digitalSignature,
  onDesignChange, onImportantChange,
  onSketchChange, onSignatureChange,
}: Props) {
  return (
    <>
      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Observaciones</legend>
        <label className={styles.form__label}>
          Observaciones de diseño
          <textarea className={styles.form__textarea} value={designObservations} onChange={(e) => onDesignChange(e.target.value)} />
        </label>
        <label className={styles.form__label}>
          Observaciones importantes
          <textarea className={styles.form__textarea} value={importantObservations} onChange={(e) => onImportantChange(e.target.value)} />
        </label>
      </fieldset>

      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Croquis / Diseño</legend>
        <SketchEditor croquis={sketchPages} onChange={onSketchChange} />
      </fieldset>

      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Firma digital</legend>
        <SignaturePad value={digitalSignature} onChange={onSignatureChange} />
      </fieldset>
    </>
  );
}
