export const DEFAULT_VAT_RATE = 15;
export const DEFAULT_HOURS_PER_DAY = 8;
export const DEFAULT_DAYS_PER_MONTH = 30;

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function rentalDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

/**
 * Converts a rental period into billable units for the selected rate type.
 * Weekly/monthly rates are prorated by calendar rental days; hourly rates use
 * the configured working-hours-per-day assumption.
 */
export function billingUnits(days, rateType, hoursPerDay = DEFAULT_HOURS_PER_DAY) {
  const d = Math.max(0, Number(days) || 0);
  switch (rateType) {
    case "Per Hour": return d * (Number(hoursPerDay) || DEFAULT_HOURS_PER_DAY);
    case "Per Week": return d / 7;
    case "Per Month": return d / DEFAULT_DAYS_PER_MONTH;
    case "Per Day":
    default: return d;
  }
}

export function calculateRentalCharge({ startDate, endDate, rate, rateType, quantity = 1, hoursPerDay }) {
  const days = rentalDays(startDate, endDate);
  const units = billingUnits(days, rateType, hoursPerDay);
  return {
    days,
    units,
    rate: Number(rate) || 0,
    quantity: Number(quantity) || 1,
    rental: roundMoney(units * (Number(rate) || 0) * (Number(quantity) || 1)),
  };
}

export function calculateTotals({ rental = 0, fuel = 0, delivery = 0, additional = 0, vatRate = DEFAULT_VAT_RATE }) {
  const subtotal = roundMoney(Number(rental) + Number(fuel) + Number(delivery) + Number(additional));
  const rate = Number(vatRate) || DEFAULT_VAT_RATE;
  const vat = roundMoney(subtotal * rate / 100);
  return { subtotal, vatRate: rate, vat, total: roundMoney(subtotal + vat) };
}

export function outstandingAmount(total, paid = 0) {
  return roundMoney(Math.max(0, Number(total) - Number(paid)));
}
