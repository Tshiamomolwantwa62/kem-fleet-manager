import React, { useState } from "react";
import { Download, Mail, Printer, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Reusable Download / Email / Print action buttons for invoices and quotations.
 * props:
 *   doc       — the invoice or quotation record
 *   type      — "invoice" | "quotation"
 *   buildHTML — function(doc) => html string
 *   filename  — function(doc) => string (without extension)
 *   customerEmail — optional email override; falls back to looking up customer
 */
export default function DocumentActions({ doc, type, buildHTML, filename, customerEmail }) {
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    setBusy("download");
    try {
      const { downloadPDF } = await import("@/lib/documentActions");
      await downloadPDF(buildHTML(doc), `${filename(doc)}.pdf`);
      toast({ title: "PDF downloaded" });
    } catch (e) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handlePrint = async () => {
    setBusy("print");
    try {
      const { printDocument } = await import("@/lib/documentActions");
      printDocument(buildHTML(doc));
    } catch (e) {
      toast({ title: "Print failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleEmail = async () => {
    setBusy("email");
    try {
      const { emailDocument } = await import("@/lib/documentActions");
      await emailDocument(doc, type, customerEmail);
      toast({ title: "Email sent successfully" });
    } catch (e) {
      toast({ title: "Email failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <>
      <button onClick={handleDownload} disabled={busy !== null} className="p-1.5 text-navy-300 hover:text-blue-600 disabled:opacity-50" title="Download PDF">
        {busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      <button onClick={handleEmail} disabled={busy !== null} className="p-1.5 text-navy-300 hover:text-gold disabled:opacity-50" title="Email to customer">
        {busy === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
      </button>
      <button onClick={handlePrint} disabled={busy !== null} className="p-1.5 text-navy-300 hover:text-navy-500 disabled:opacity-50" title="Print">
        {busy === "print" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
      </button>
    </>
  );
}