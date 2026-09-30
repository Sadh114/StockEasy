// Simplified, illustrative Indian equity delivery charges — not tax advice,
// just enough to make paper-trading P&L feel realistic.
const BROKERAGE_FLAT = 0; // Most discount brokers charge zero brokerage on delivery trades.
const STT_RATE = 0.001; // Securities Transaction Tax: 0.1% on both buy & sell (delivery).
const EXCHANGE_CHARGE_RATE = 0.0000345; // NSE transaction charge.
const SEBI_CHARGE_RATE = 0.0000010; // SEBI turnover fee.
const GST_RATE = 0.18; // GST on (brokerage + exchange charge + SEBI charge).
const STAMP_DUTY_RATE = 0.00015; // Stamp duty, buy side only.

const round2 = (value) => Number(value.toFixed(2));

const calculateCharges = (total, type) => {
  const brokerage = BROKERAGE_FLAT;
  const stt = round2(total * STT_RATE);
  const exchangeCharge = round2(total * EXCHANGE_CHARGE_RATE);
  const sebiCharge = round2(total * SEBI_CHARGE_RATE);
  const gst = round2((brokerage + exchangeCharge + sebiCharge) * GST_RATE);
  const stampDuty = type === "BUY" ? round2(total * STAMP_DUTY_RATE) : 0;

  const totalCharges = round2(brokerage + stt + exchangeCharge + sebiCharge + gst + stampDuty);

  return {
    brokerage,
    stt,
    exchangeCharge,
    sebiCharge,
    gst,
    stampDuty,
    totalCharges,
  };
};

module.exports = { calculateCharges };
