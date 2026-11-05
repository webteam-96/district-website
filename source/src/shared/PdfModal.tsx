import { useEffect, useRef } from 'react';
import { lockScroll } from './smooth';

export interface PdfDoc { title: string; meta?: string; pdf: string }

/* Accessible PDF preview: <dialog> with a focus trap that cycles Download ↔ Close
   (the iframe is kept out of the tab order — Chrome's PDF viewer swallows Tab/Esc),
   Esc and backdrop click close, focus returns to the opener. */
export default function PdfModal({ doc, onClose, className = '' }: { doc: PdfDoc | null; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (doc && !d.open) {
      opener.current = document.activeElement as HTMLElement;
      d.showModal();
      lockScroll(true);
      d.querySelector<HTMLElement>('[data-close]')?.focus();
    } else if (!doc && d.open) {
      d.close();
    }
  }, [doc]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      lockScroll(false);
      opener.current?.focus?.();
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const f = Array.from(d.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    };
    const onClick = (e: MouseEvent) => { if (e.target === d) d.close(); };
    d.addEventListener('close', onDialogClose);
    d.addEventListener('keydown', onKey);
    d.addEventListener('click', onClick);
    return () => { d.removeEventListener('close', onDialogClose); d.removeEventListener('keydown', onKey); d.removeEventListener('click', onClick); };
  }, [onClose]);

  return (
    <dialog ref={ref} className={`pdf-modal ${className}`} aria-labelledby="pdf-title" data-lenis-prevent>
      {doc && (
        <div className="pdf-modal__panel">
          <header className="pdf-modal__head">
            <div>
              <p className="pdf-modal__meta">{doc.meta}</p>
              <h2 id="pdf-title" className="pdf-modal__title">{doc.title}</h2>
            </div>
            <div className="pdf-modal__actions">
              <a className="pdf-modal__btn" href={doc.pdf} download>Download</a>
              <button type="button" className="pdf-modal__btn pdf-modal__btn--close" data-close onClick={() => ref.current?.close()}>
                Close <span aria-hidden="true">✕</span>
              </button>
            </div>
          </header>
          <div className="pdf-modal__frame">
            <iframe src={doc.pdf + '#view=FitH'} title={`${doc.title} (PDF preview)`} tabIndex={-1} />
          </div>
        </div>
      )}
    </dialog>
  );
}
