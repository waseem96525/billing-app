// Utility functions for Indian POS system

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const calculateGST = (
  amount: number,
  gstRate: number,
  isIntraState: boolean = true
) => {
  const gstAmount = (amount * gstRate) / 100;
  
  if (isIntraState) {
    // Intra-state: CGST + SGST
    return {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: gstAmount,
    };
  } else {
    // Inter-state: IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: gstAmount,
    };
  }
};

export const calculateInvoiceTotals = (
  items: Array<{
    quantity: number;
    unit_price: number;
    gst_rate: number;
    discount_percent?: number;
  }>,
  discountPercent: number = 0,
  isIntraState: boolean = true
) => {
  let subtotal = 0;
  let totalGST = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  items.forEach((item) => {
    const itemTotal = item.quantity * item.unit_price;
    const itemDiscount = itemTotal * ((item.discount_percent || 0) / 100);
    const taxableAmount = itemTotal - itemDiscount;
    
    subtotal += taxableAmount;
    
    const gst = calculateGST(taxableAmount, item.gst_rate || 0, isIntraState);
    totalGST += gst.total;
    cgst += gst.cgst;
    sgst += gst.sgst;
    igst += gst.igst;
  });

  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  
  // Recalculate GST after overall discount if any
  if (discountPercent > 0) {
    const gstRatio = totalGST / subtotal;
    totalGST = afterDiscount * gstRatio;
    cgst = (afterDiscount * gstRatio) / (isIntraState ? 2 : 1);
    sgst = isIntraState ? cgst : 0;
    igst = !isIntraState ? totalGST : 0;
  }

  const total = afterDiscount + totalGST;
  const roundOff = Math.round(total) - total;
  const finalTotal = Math.round(total);

  return {
    subtotal,
    discountAmount,
    cgst,
    sgst,
    igst,
    totalGST,
    roundOff,
    total: finalTotal,
  };
};

export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `INV${year}${month}${timestamp}`;
};

export const generateBarcode = (): string => {
  return Math.random().toString().slice(2, 15);
};

export const getPaymentMethodIcon = (method: string): string => {
  const icons: { [key: string]: string } = {
    cash: '💵',
    card: '💳',
    upi: '📱',
    netbanking: '🏦',
    cheque: '📝',
  };
  return icons[method.toLowerCase()] || '💰';
};

export const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-orange-100 text-orange-800',
  };
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
