import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { createClient } from "@/lib/supabase-browser";

interface WishlistStore {
    itemIds: string[];
    loading: boolean;
    initialized: boolean;
    fetchWishlist: () => Promise<void>;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            itemIds: [],
            loading: false,
            initialized: false,

            fetchWishlist: async () => {
                const { initialized } = get();
                if (initialized) return;

                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    // Mark as initialized to stop further unauthorized checks for this guest session
                    set({ initialized: true });
                    return;
                }

                set({ loading: true });
                try {
                    const res = await axios.get("/api/account/wishlist");
                    set({ 
                        itemIds: res.data.map((item: any) => item.product_id), 
                        initialized: true 
                    });
                } catch (err) {
                    console.error("Failed to fetch wishlist:", err);
                } finally {
                    set({ loading: false });
                }
            },

            toggleWishlist: async (productId: string) => {
                const { itemIds } = get();
                const exists = itemIds.includes(productId);

                // Optimistic UI update (always allowed, persisted locally)
                if (exists) {
                    set({ itemIds: itemIds.filter(id => id !== productId) });
                } else {
                    set({ itemIds: [...itemIds, productId] });
                }

                // Database synchronization (only for authenticated users)
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) return; // Silent local-only for guests

                try {
                    if (exists) {
                        await axios.delete(`/api/account/wishlist/${productId}`);
                    } else {
                        await axios.post("/api/account/wishlist", { productId });
                    }
                } catch (err) {
                    console.error("Wishlist sync failed:", err);
                    // Revert UI if server sync failed for an authenticated user
                    set({ itemIds });
                }
            },

            isInWishlist: (productId: string) => {
                return get().itemIds.includes(productId);
            }
        }),
        {
            name: "5ive-arts-wishlist",
            partialize: (state) => ({ itemIds: state.itemIds }),
        }
    )
);
