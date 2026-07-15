import { getCategories, getFoodItems, getTodaysSpecials } from "@/lib/api/menu";
import { FoodItemCard } from "@/components/menu/FoodItemCard";
import { Navbar } from "@/components/ui/Navbar";
import Image from "next/image";

import { Category, FoodItem } from "@/lib/api/menu";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

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

  // Apply dietary filter
  let filteredItems = foodItems;
  if (filter === "veg") {
    filteredItems = foodItems.filter((item) => item.isVeg);
  } else if (filter === "nonveg") {
    filteredItems = foodItems.filter((item) => !item.isVeg);
  }

  const hasSpecials = specials.length > 0;
  const activeFilter = filter || "all";

  return (
    <main className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="mb-12 text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Our Menu</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {activeFilter === "veg"
              ? "Showing vegetarian items"
              : activeFilter === "nonveg"
                ? "Showing non-vegetarian items"
                : "Discover a world of flavors with our premium selection of dishes."}
          </p>
        </div>

        {/* Today's Specials Banner */}
        {hasSpecials && !error && activeFilter === "all" && (
          <div className="mb-12 premium-card overflow-hidden bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-950/30 dark:to-orange-950/30 border-purple-200 dark:border-purple-800 animate-fade-in">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌟</span>
                <h2 className="text-xl font-extrabold">Today&apos;s Specials</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {specials.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-primary font-bold text-xs">₹{Number(item.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl border border-red-200">
            <p className="font-bold text-lg">Unable to load menu</p>
            <p>{error}</p>
            <p className="text-sm mt-4 opacity-80">Make sure the NestJS backend is running on port 3000.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar / Category + Filter Nav */}
            <aside className="md:w-64 flex-shrink-0 animate-fade-in">
              <div className="sticky top-24 premium-card p-4">
                <h2 className="font-bold text-lg mb-4 pb-2 border-b border-border">Categories</h2>
                <nav className="flex flex-col gap-2 mb-6">
                  {categories.map((cat) => (
                    <a
                      key={cat.id}
                      href={`#category-${cat.id}`}
                      className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </a>
                  ))}
                </nav>

                <h3 className="font-semibold text-sm mb-2 pb-2 border-b border-border">Dietary</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <a
                    href="/menu?filter=veg"
                    className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeFilter === "veg"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                        : "hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Vegetarian
                  </a>
                  <a
                    href="/menu?filter=nonveg"
                    className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeFilter === "nonveg"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                        : "hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Non-Veg
                  </a>
                  <a
                    href="/menu"
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-xs mt-1 ${
                      activeFilter === "all"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Show all items
                  </a>
                </div>
              </div>
            </aside>

            {/* Menu Items */}
            <div className="flex-grow flex flex-col gap-12">
              {activeFilter === "all" ? (
                /* Category-grouped layout */
                categories.map((category) => {
                  const itemsInCategory = filteredItems.filter((item) => item.categoryId === category.id);
                  if (itemsInCategory.length === 0) return null;

                  return (
                    <section
                      key={category.id}
                      id={`category-${category.id}`}
                      className="scroll-mt-24"
                    >
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                        {category.name}
                        <div className="h-px bg-border flex-grow" />
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itemsInCategory.map((item) => (
                          <div key={item.id} className="animate-slide-up" style={{ animationFillMode: "both" }}>
                            <FoodItemCard item={item} />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : filteredItems.length > 0 ? (
                /* Flat grid for filtered view */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="animate-slide-up" style={{ animationFillMode: "both" }}>
                      <FoodItemCard item={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium">No items found</p>
                  <p className="text-sm mt-1">
                    {activeFilter === "veg"
                      ? "No vegetarian items available."
                      : "Try a different filter or browse all items."}
                  </p>
                  <a href="/menu" className="mt-4 inline-block text-primary font-medium hover:underline">
                    Show all items
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
