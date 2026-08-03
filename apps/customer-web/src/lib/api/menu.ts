export interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isPopular: boolean;
  isTodaysSpecial?: boolean;
  isEnabled?: boolean;
  isOutOfStock?: boolean;
  categoryId: string;
  category?: Category;
  productionStock?: { availableQty: number } | null;
  averageRating?: number;
  totalReviews?: number;
}

export interface ReviewData {
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { id: string; name: string };
  }[];
  averageRating: number;
  totalReviews: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/menu/categories`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getFoodItems(categoryId?: string): Promise<FoodItem[]> {
  const url = categoryId
    ? `${API_BASE_URL}/menu/items?categoryId=${categoryId}`
    : `${API_BASE_URL}/menu/items`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch food items');
  return res.json();
}

export async function getTodaysSpecials(): Promise<FoodItem[]> {
  const res = await fetch(`${API_BASE_URL}/menu/specials`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch specials');
  return res.json();
}

export async function getItemReviews(foodItemId: string): Promise<ReviewData> {
  const res = await fetch(`${API_BASE_URL}/reviews/item/${foodItemId}`);
  if (!res.ok) return { reviews: [], averageRating: 0, totalReviews: 0 };
  return res.json();
}

export async function submitReview(
  token: string,
  data: { foodItemId: string; rating: number; comment?: string }
) {
  const res = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to submit review');
  }
  return res.json();
}
