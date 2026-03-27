"use client";

import { Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistStore } from "@/store/wishlist";
import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface WishlistToggleProps {
  productId: string;
  productName?: string;
  variant?: "icon" | "full";
  className?: string;
}

export default function WishlistToggle({ 
  productId, 
  productName,
  variant = "icon", 
  className = "" 
}: WishlistToggleProps) {
  const { track } = useAnalytics();
  const { itemIds, toggleWishlist, fetchWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);
  const isFavorite = itemIds.includes(productId);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    
    // Optimistic UI handled by store, but we can track here
    const willBeFavorite = !isFavorite;
    
    try {
      if (willBeFavorite) {
          track("wishlist_add", { product_id: productId, product_name: productName });
      } else {
          track("wishlist_remove", { product_id: productId, product_name: productName });
      }
      await toggleWishlist(productId);
    } finally {
      setLoading(false);
    }
  };

  const Icon = Heart;

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className={`relative flex items-center justify-center transition-all ${className} ${
        isFavorite ? "text-brand-yellow" : "text-white/40 hover:text-white"
      }`}
      aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={isFavorite ? "active" : "inactive"}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <Icon 
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorite ? "fill-brand-yellow drop-shadow-[0_0_8px_var(--hasbro-yellow)]" : ""
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
