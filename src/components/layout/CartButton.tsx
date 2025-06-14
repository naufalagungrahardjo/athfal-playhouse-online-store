
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const CartButton = () => {
  const { getTotalItems } = useCart();
  const total = getTotalItems();

  return (
    <Link to="/cart">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5 text-athfal-pink" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-athfal-yellow text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {total}
          </span>
        )}
      </Button>
    </Link>
  );
};

export default CartButton;
