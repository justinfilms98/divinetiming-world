import { CartProvider } from '@/components/shop/CartContext';
import { CartSlideOut } from '@/components/shop/CartSlideOut';
import { CartTrigger } from '@/components/shop/CartTrigger';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartTrigger />
      <CartSlideOut />
    </CartProvider>
  );
}
