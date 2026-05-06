const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const PCT_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number, currency = "VND"): string {
  if (currency === "VND") return VND_FORMATTER.format(value);
  if (currency === "USD") return USD_FORMATTER.format(value);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(value);
}

export function formatBillionVnd(rawValue: number): string {
  const billion = rawValue / 1_000_000_000;
  return `${billion.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
}

export function formatPct(value: number): string {
  return PCT_FORMATTER.format(value);
}

export function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString("vi-VN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
