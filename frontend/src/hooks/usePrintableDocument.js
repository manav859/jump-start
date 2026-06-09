import { useEffect, useRef, useState } from "react";

const PRINT_MODE_CLASS = "jumpstart-report-print-mode";

const waitForNextPaint = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

export default function usePrintableDocument() {
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const printPendingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // The browser prints the document <title> ("Jumpstart") into the page
    // margin header. Blank it for the duration of the print so the PDF
    // doesn't show a stray "Jumpstart" caption above our own letterhead.
    // A single space (not "") is used because some browsers fall back to the
    // URL when the title is empty. beforeprint covers BOTH our Download
    // button (programmatic window.print) and the native Ctrl+P path. The
    // saved title lives in this effect-scoped closure (not a hook/ref) so the
    // hook's signature stays minimal.
    let previousTitle = null;

    const restoreTitle = () => {
      if (previousTitle != null) {
        document.title = previousTitle;
        previousTitle = null;
      }
    };

    const handleBeforePrint = () => {
      if (previousTitle == null) {
        previousTitle = document.title;
        document.title = " ";
      }
    };

    const cleanupPrintMode = () => {
      printPendingRef.current = false;
      setIsPreparingPrint(false);
      document.body.classList.remove(PRINT_MODE_CLASS);
      restoreTitle();
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", cleanupPrintMode);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", cleanupPrintMode);
      cleanupPrintMode();
    };
  }, []);

  const printDocument = async () => {
    if (typeof window === "undefined" || printPendingRef.current) return;

    printPendingRef.current = true;
    setIsPreparingPrint(true);
    document.body.classList.add(PRINT_MODE_CLASS);

    await waitForNextPaint();
    window.print();
  };

  return {
    isPreparingPrint,
    printDocument,
  };
}
