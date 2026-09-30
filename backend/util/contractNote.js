const PDFDocument = require("pdfkit");

const money = (value) => `INR ${Number(value || 0).toFixed(2)}`;

const streamContractNote = (res, { order, user, charges }) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="contract-note-${order._id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text("StockEasy", { align: "left" });
  doc.fontSize(11).fillColor("#555").text("Contract Note (Simulated Paper Trade)", { align: "left" });
  doc.moveDown(1.5);

  doc.fillColor("#000").fontSize(10);
  doc.text(`Order ID: ${order._id}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
  doc.text(`Client: ${user.username} (${user.email})`);
  doc.moveDown(1);

  doc.fontSize(12).text("Trade Details", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Symbol: ${order.symbol} - ${order.companyName}`);
  doc.text(`Type: ${order.type}`);
  doc.text(`Quantity: ${order.quantity}`);
  doc.text(`Price per share: ${money(order.price)}`);
  doc.text(`Trade Value: ${money(order.total)}`);
  doc.moveDown(1);

  doc.fontSize(12).text("Charges Breakdown (illustrative)", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Brokerage: ${money(charges?.brokerage)}`);
  doc.text(`STT: ${money(charges?.stt)}`);
  doc.text(`Exchange Transaction Charge: ${money(charges?.exchangeCharge)}`);
  doc.text(`SEBI Charges: ${money(charges?.sebiCharge)}`);
  doc.text(`GST: ${money(charges?.gst)}`);
  doc.text(`Stamp Duty: ${money(charges?.stampDuty)}`);
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Total Charges: ${money(charges?.totalCharges)}`, { bold: true });
  doc.moveDown(1);

  const netAmount =
    order.type === "BUY" ? order.total + (charges?.totalCharges || 0) : order.total - (charges?.totalCharges || 0);

  doc.fontSize(12).text(`Net Amount ${order.type === "BUY" ? "Debited" : "Credited"}: ${money(netAmount)}`, {
    underline: true,
  });

  doc.moveDown(2);
  doc.fontSize(8).fillColor("#888").text(
    "This is a system-generated contract note for a simulated paper-trading account. No real funds or securities were exchanged.",
    { align: "left" }
  );

  doc.end();
};

module.exports = { streamContractNote };
