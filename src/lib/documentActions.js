import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";

const COMPANY = {
  name: "KEM Plant & Construction",
  tagline: "Plant Hire & Construction Operations",
  address: "South Africa",
  email: "info@kemplant.co.za",
  phone: "+27 00 000 0000",
  vat: "VAT Registration: TBC",
};

const fmtMoney = (n) => `R ${(Number(n) || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function parseItems(str) {
  try { return JSON.parse(str) || []; } catch { return []; }
}

/** Shared styled HTML template for invoices and quotations */
export function buildInvoiceHTML(inv) {
  const items = parseItems(inv.items);
  const rows = items.length
    ? items.map((it, i) => `<tr>
        <td>${i + 1}</td>
        <td>${it.description || ""}</td>
        <td style="text-align:center">${it.quantity || 1}</td>
        <td style="text-align:right">${fmtMoney(it.unit_price)}</td>
        <td style="text-align:right">${fmtMoney(it.total)}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center;color:#888">No line items</td></tr>`;

  return wrapDoc({
    title: "TAX INVOICE",
    docNumber: inv.invoice_number,
    dateLabel: "Invoice Date",
    dateValue: inv.invoice_date,
    dueLabel: "Due Date",
    dueValue: inv.due_date,
    customer: {
      name: inv.customer_name,
      address: inv.billing_address,
      vat: inv.customer_vat_number,
    },
    refLabel: "Booking Ref",
    refValue: inv.booking_number,
    extraRef: inv.machine_hour_log_number ? `Hours Log: ${inv.machine_hour_log_number}` : "",
    rows,
    showQtyPrice: true,
    tableHead: ["#", "Description", "Qty", "Unit Price", "Amount"],
    subtotal: inv.subtotal,
    vatRate: inv.vat_rate,
    vatAmount: inv.vat_amount,
    total: inv.total,
    paid: inv.amount_paid,
    outstanding: inv.outstanding,
    status: inv.status,
    terms: inv.terms,
    notes: inv.notes,
  });
}

export function buildQuotationHTML(q) {
  const days = q.duration_days || 1;
  const rows = `<tr>
      <td>1</td>
      <td>${q.equipment_name || "Equipment Rental"}<br/><span style="color:#666;font-size:11px">${q.quantity || 1} unit(s) × ${days} day(s) @ ${fmtMoney(q.unit_rate)} (${q.rate_type || "Per Day"})</span></td>
      <td style="text-align:center">${q.quantity || 1}</td>
      <td style="text-align:right">${fmtMoney(q.unit_rate)}</td>
      <td style="text-align:right">${fmtMoney(q.subtotal)}</td>
    </tr>
    ${(Number(q.fuel_charge) || 0) > 0 ? chargeRow("Fuel Charge", q.fuel_charge) : ""}
    ${(Number(q.delivery_charge) || 0) > 0 ? chargeRow("Delivery Charge", q.delivery_charge) : ""}
    ${(Number(q.additional_charges) || 0) > 0 ? chargeRow(q.additional_charges_desc || "Additional Charges", q.additional_charges) : ""}
  `;

  return wrapDoc({
    title: "QUOTATION",
    docNumber: q.quotation_number,
    dateLabel: "Quote Date",
    dateValue: q.date,
    dueLabel: "Valid Until",
    dueValue: q.valid_until,
    customer: {
      name: q.customer_name,
      address: q.customer_address,
      vat: "",
    },
    refLabel: "Equipment",
    refValue: q.equipment_name,
    extraRef: "",
    rows,
    showQtyPrice: true,
    tableHead: ["#", "Description", "Qty", "Unit Price", "Amount"],
    subtotal: q.subtotal,
    vatRate: q.vat_rate,
    vatAmount: q.vat_amount,
    total: q.total,
    paid: null,
    outstanding: null,
    status: q.status,
    terms: q.terms,
    notes: q.notes,
  });
}

function chargeRow(label, amount) {
  return `<tr><td>—</td><td>${label}</td><td style="text-align:center">1</td><td style="text-align:right">${fmtMoney(amount)}</td><td style="text-align:right">${fmtMoney(amount)}</td></tr>`;
}

function wrapDoc({ title, docNumber, dateLabel, dateValue, dueLabel, dueValue, customer, refLabel, refValue, extraRef, rows, tableHead, subtotal, vatRate, vatAmount, total, paid, outstanding, status, terms, notes }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${docNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; color: #0b1f3a; margin: 0; padding: 40px; background: #fff; }
    .doc { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ffc656; padding-bottom: 20px; margin-bottom: 30px; }
    .company .name { font-size: 26px; font-weight: 900; color: #0b1f3a; }
    .company .tagline { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .company .contact { font-size: 11px; color: #666; margin-top: 8px; line-height: 1.6; }
    .doctitle { text-align: right; }
    .doctitle .label { font-size: 28px; font-weight: 900; color: #0b1f3a; letter-spacing: 2px; }
    .doctitle .num { font-family: 'Courier New', monospace; font-size: 14px; font-weight: 700; color: #ffc656; margin-top: 4px; }
    .doctitle .status { display: inline-block; margin-top: 8px; padding: 3px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: #f0f4f8; border-radius: 3px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 30px; }
    .party-box { flex: 1; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 5px; }
    .party-name { font-weight: 700; font-size: 14px; }
    .party-detail { font-size: 12px; color: #555; line-height: 1.5; }
    .meta { flex: 1; text-align: right; }
    .meta-row { font-size: 12px; margin-bottom: 4px; }
    .meta-row .lbl { color: #888; }
    .meta-row .val { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #0b1f3a; color: #fff; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e5e9ef; font-size: 12px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
    .total-row.grand { border-top: 2px solid #0b1f3a; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 900; }
    .total-row.paid { color: #16a34a; font-weight: 700; }
    .total-row.out { color: #dc2626; font-weight: 700; }
    .terms { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e9ef; }
    .terms h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 6px 0; }
    .terms p { font-size: 11px; color: #555; line-height: 1.6; margin: 0 0 8px 0; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e9ef; text-align: center; font-size: 10px; color: #888; }
  </style></head>
  <body><div class="doc">
    <div class="header">
      <div class="company">
        <div class="name">${COMPANY.name}</div>
        <div class="tagline">${COMPANY.tagline}</div>
        <div class="contact">${COMPANY.address}<br/>${COMPANY.email} | ${COMPANY.phone}<br/>${COMPANY.vat}</div>
      </div>
      <div class="doctitle">
        <div class="label">${title}</div>
        <div class="num">${docNumber}</div>
        <div class="status">${status || "Draft"}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party-box">
        <div class="party-label">Bill To</div>
        <div class="party-name">${customer.name || "—"}</div>
        <div class="party-detail">${customer.address || ""}${customer.vat ? "<br/>VAT: " + customer.vat : ""}</div>
      </div>
      <div class="meta">
        <div class="meta-row"><span class="lbl">${dateLabel}: </span><span class="val">${dateValue || "—"}</span></div>
        <div class="meta-row"><span class="lbl">${dueLabel}: </span><span class="val">${dueValue || "—"}</span></div>
        <div class="meta-row"><span class="lbl">${refLabel}: </span><span class="val">${refValue || "—"}</span></div>
        ${extraRef ? `<div class="meta-row"><span class="val" style="color:#ffc656">${extraRef}</span></div>` : ""}
      </div>
    </div>
    <table>
      <thead><tr>${tableHead.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals"><div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
      <div class="total-row"><span>VAT (${vatRate || 15}%)</span><span>${fmtMoney(vatAmount)}</span></div>
      <div class="total-row grand"><span>TOTAL</span><span>${fmtMoney(total)}</span></div>
      ${paid != null ? `<div class="total-row paid"><span>Paid</span><span>${fmtMoney(paid)}</span></div>` : ""}
      ${outstanding != null ? `<div class="total-row out"><span>Outstanding</span><span>${fmtMoney(outstanding)}</span></div>` : ""}
    </div></div>
    ${terms ? `<div class="terms"><h4>Terms &amp; Conditions</h4><p>${(terms || "").replace(/\n/g, "<br/>")}</p></div>` : ""}
    ${notes ? `<div class="terms"><h4>Notes</h4><p>${(notes || "").replace(/\n/g, "<br/>")}</p></div>` : ""}
    <div class="footer">${COMPANY.name} — ${COMPANY.email} | This is a computer-generated document.</div>
  </div></body></html>`;
}

/** Print a document by opening a new window */
export function printDocument(html) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Please allow popups to print the document."); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

/** Download a document as PDF using html2canvas + jsPDF */
export async function downloadPDF(html, filename) {
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;background:#fff;";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

/** Email a document summary to the customer (registered users only) */
export async function emailDocument(doc, type, emailTo) {
  if (!emailTo) throw new Error("No email address on file for this customer. Please add one.");
  const isInv = type === "invoice";
  const subject = `${isInv ? "Invoice" : "Quotation"} ${isInv ? doc.invoice_number : doc.quotation_number} — ${COMPANY.name}`;
  const body = `Dear ${doc.customer_name || "Customer"},

Please find your ${isInv ? "invoice" : "quotation"} details below.

${isInv ? "Invoice" : "Quotation"} #: ${isInv ? doc.invoice_number : doc.quotation_number}
Date: ${isInv ? doc.invoice_date : doc.date}
${isInv ? `Due Date: ${doc.due_date}` : `Valid Until: ${doc.valid_until}`}

Items:
${isInv
      ? (parseItems(doc.items).map(i => `  - ${i.description} (Qty ${i.quantity}) — ${fmtMoney(i.total)}`).join("\n") || "  N/A")
      : `  - ${doc.equipment_name} (${doc.quantity || 1} unit(s) for ${doc.duration_days || 1} day(s))`}

Subtotal: ${fmtMoney(doc.subtotal)}
VAT (${doc.vat_rate || 15}%): ${fmtMoney(doc.vat_amount)}
Total: ${fmtMoney(doc.total)}
${isInv && doc.outstanding != null ? `Outstanding: ${fmtMoney(doc.outstanding)}` : ""}

${doc.terms ? "\nTerms: " + doc.terms : ""}

Please contact us at ${COMPANY.email} for any queries.

Regards,
${COMPANY.name}
${COMPANY.phone}`;

  await base44.integrations.Core.SendEmail({ to: emailTo, subject, body });
}