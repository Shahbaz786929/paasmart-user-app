import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { getCart } from "../api/cart";
import { getAuthToken } from "../utils/authStorage";

type CartContextType = {
  itemCount: number;
  refreshCartCount: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  itemCount: 0,
  refreshCartCount: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setItemCount(0);
        return;
      }
      const items = await getCart(token);
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(total);
    } catch {
      // Silently ignore — badge just won't update this cycle.
    }
  }, []);

  return (
    <CartContext.Provider value={{ itemCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}