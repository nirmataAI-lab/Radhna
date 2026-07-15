import { CartItem } from '../store/cartStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface OrderSubmission {
  tableNumber?: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  couponCode?: string;
  items: {
    foodItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
}

export async function submitOrder(
  tableNumber: string | undefined,
  cartItems: CartItem[],
  customerInfo?: { id?: string; email?: string; phone?: string },
  couponCode?: string,
) {
  const orderPayload: OrderSubmission = {
    tableNumber: tableNumber || undefined,
    customerId: customerInfo?.id || undefined,
    customerEmail: customerInfo?.email || undefined,
    customerPhone: customerInfo?.phone || undefined,
    couponCode: couponCode || undefined,
    items: cartItems.map(item => ({
      foodItemId: item.id,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || undefined,
    })),
  };

  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to submit order');
  }

  return res.json();
}
