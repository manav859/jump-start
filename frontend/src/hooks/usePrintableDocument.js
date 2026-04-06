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

    const cleanupPrintMode = () => {
      printPendingRef.current = false;
      setIsPreparingPrint(false);
      document.body.classList.remove(PRINT_MODE_CLASS);
    };

    window.addEventListener("afterprint", cleanupPrintMode);

    return () => {
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
