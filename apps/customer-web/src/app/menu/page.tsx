import { getCategories, getFoodItems, getTodaysSpecials } from "@/lib/api/menu";
import { Navbar } from "@/components/ui/Navbar";
import { MenuClient } from "@/components/menu/MenuClient";
import { Category, FoodItem } from "@/lib/api/menu";

export default async function MenuPage() {
  let categories: Category[] = [];
  let foodItems: FoodItem[] = [];
  let specials: FoodItem[] = [];
  let error: string | null = null;

  try {
    const [fetchedCategories, fetchedFoodItems, fetchedSpecials] = await Promise.all([
      getCategories(),
      getFoodItems(),
      getTodaysSpecials().catch(() => []),
    ]);
    categories = fetchedCategories;
    foodItems = fetchedFoodItems;
    specials = fetchedSpecials;
  } catch (err: unknown) {
    console.error(err);
    error = err instanceof Error ? err.message : "Failed to load menu";
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative py-14 md:py-20 text-center overflow-hidden"
        style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40%] h-[100%] rounded-full opacity-6 blur-[80px]"
            style={{ background: 'radial-gradient(circle, var(--primary), transparent 70%)' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10 animate-slide-up">
          <span className="section-label mb-3 mx-auto">
            Authentic South Indian & Snacks
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
            style={{ color: 'var(--foreground)' }}>
            Radhna <span className="text-gradient">Cuisine Menu</span>
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto font-medium"
            style={{ color: 'var(--muted-foreground)' }}>
            Freshly prepared Dosas, Maggi, Uttapams, Idlis, and refreshing Shakes & Lassis.
          </p>
        </div>
      </div>

      <MenuClient
        categories={categories}
        foodItems={foodItems}
        specials={specials}
        error={error}
      />
    </main>
  );
}
