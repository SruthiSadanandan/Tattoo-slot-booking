import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

// The cart holds ONE pending appointment, because a slot can only be held once.
// Shape: { design | null, custom | null, service, artist, startTime }
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart"));
  } catch {
    return null;
  }
}

export function CartProvider({ children }) {
  const [item, setItem] = useState(loadCart);

  useEffect(() => {
    if (item) localStorage.setItem("cart", JSON.stringify(item));
    else localStorage.removeItem("cart");
  }, [item]);

  return (
    <CartContext.Provider value={{ item, setItem, clear: () => setItem(null) }}>{children}</CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

// Display-only estimate. The server calculates the real deposit.
export function estimateDeposit(service) {
  if (!service) return 0;
  return Math.round((service.price * service.depositPercent) / 100);
}
