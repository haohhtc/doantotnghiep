// Tinh thue DUNG theo quy uoc backend that su se xuat hoa don (InvoiceService.java,
// createFromDeliveryOrder/createVanSale): lineSubtotal = quantity * unitPrice,
// lineTax = lineSubtotal * taxRatePercent / 100, lineTotal = lineSubtotal + lineTax.
// taxRatePercent lay tu product.saleTaxGroup.ratePercent (0 neu san pham khong gan Nhom thue).
// Dung o App de hien DUNG so tien se bi tinh thue, thay vi chi hien gia truoc thue nhu truoc day
// (yeu cau nguoi dung: "ở app thấy nó hiện giá tiền gốc chưa tính thuế").
export function taxRateOf(product) {
  return Number(product?.saleTaxGroup?.ratePercent || 0);
}

export function computeLine(quantity, unitPrice, taxRatePercent) {
  const subtotal = Number(quantity || 0) * Number(unitPrice || 0);
  const tax = (subtotal * Number(taxRatePercent || 0)) / 100;
  return { subtotal, tax, total: subtotal + tax };
}
