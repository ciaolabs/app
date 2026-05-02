type ExportPdfOptions = {
  fileName: string;
};

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 12;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const SECTION_GAP_MM = 6;

const CAPTURE_OVERRIDES: Partial<CSSStyleDeclaration> = {
  border: "0",
  borderColor: "transparent",
  boxShadow: "none",
  outline: "none",
  background: "#ffffff",
  backgroundColor: "#ffffff",
  borderRadius: "0",
};

type StyleSnapshot = {
  element: HTMLElement;
  values: Record<string, string>;
};

function applyCaptureStyles(element: HTMLElement): StyleSnapshot {
  const values: Record<string, string> = {};
  for (const key of Object.keys(CAPTURE_OVERRIDES)) {
    values[key] = element.style.getPropertyValue(key);
    element.style.setProperty(
      key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
      String(CAPTURE_OVERRIDES[key as keyof CSSStyleDeclaration] ?? ""),
      "important",
    );
  }
  return { element, values };
}

function restoreCaptureStyles(snapshot: StyleSnapshot) {
  for (const key of Object.keys(CAPTURE_OVERRIDES)) {
    const original = snapshot.values[key];
    const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    if (original) {
      snapshot.element.style.setProperty(cssKey, original);
    } else {
      snapshot.element.style.removeProperty(cssKey);
    }
  }
}

export async function exportDashboardPdf(
  elements: HTMLElement[],
  options: ExportPdfOptions,
): Promise<void> {
  if (elements.length === 0) {
    return;
  }

  const [{ default: html2canvas }, { default: jsPDFCtor }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const captures: { dataUrl: string; widthMm: number; heightMm: number }[] = [];

  for (const element of elements) {
    const snapshot = applyCaptureStyles(element);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const aspectRatio = canvas.height / canvas.width;
      captures.push({
        dataUrl: canvas.toDataURL("image/png"),
        widthMm: CONTENT_WIDTH_MM,
        heightMm: CONTENT_WIDTH_MM * aspectRatio,
      });
    } finally {
      restoreCaptureStyles(snapshot);
    }
  }

  const pdf = new jsPDFCtor({ unit: "mm", format: "a4", compress: true });
  let cursorY = MARGIN_MM;

  for (const capture of captures) {
    const availableHeight = PAGE_HEIGHT_MM - MARGIN_MM - cursorY;
    let renderHeight = capture.heightMm;
    let renderWidth = capture.widthMm;

    const maxFullPageHeight = PAGE_HEIGHT_MM - MARGIN_MM * 2;
    if (renderHeight > maxFullPageHeight) {
      const scale = maxFullPageHeight / renderHeight;
      renderHeight = maxFullPageHeight;
      renderWidth = renderWidth * scale;
    }

    if (cursorY > MARGIN_MM && renderHeight > availableHeight) {
      pdf.addPage();
      cursorY = MARGIN_MM;
    }

    const offsetX = MARGIN_MM + (CONTENT_WIDTH_MM - renderWidth) / 2;
    pdf.addImage(capture.dataUrl, "PNG", offsetX, cursorY, renderWidth, renderHeight, undefined, "FAST");
    cursorY += renderHeight + SECTION_GAP_MM;
  }

  pdf.save(options.fileName);
}
