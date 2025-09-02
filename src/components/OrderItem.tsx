import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderItem as OrderItemType } from "@/types/order";

interface OrderItemProps {
  item: OrderItemType;
  index: number;
  onUpdateQuantity: (index: number, newQuantity: number) => void;
}

const OrderItem = ({ item, index, onUpdateQuantity }: OrderItemProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h5 className="font-medium text-gray-800">
              {item.menuItem.name}
              {item.spicy && <span className="text-red-500 ml-1">🌶️ Spicy</span>}
            </h5>
            {item.sauce && (
              <p className="text-sm text-gray-600">Sauce: {item.sauce}</p>
            )}
            {item.sauceCup && (
              <p className="text-sm text-gray-600">Sauce Cup: {item.sauceCup}</p>
            )}
            {item.drink && (
              <p className="text-sm text-gray-600">Drink: {item.drink}</p>
            )}
            {item.addons.length > 0 && (
              <p className="text-sm text-gray-600">Add-ons: {item.addons.join(', ')}</p>
            )}
            {item.remarks && (
              <p className="text-sm text-blue-600 italic">Remarks: {item.remarks}</p>
            )}
            <p className="text-sm text-gray-600">
              ₾{item.menuItem.price.toFixed(2)} each
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
              size="sm"
              variant="outline"
              className="w-8 h-8 p-0"
            >
              -
            </Button>
            <Badge variant="secondary" className="px-3">
              {item.quantity}
            </Badge>
            <Button
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
              size="sm"
              variant="outline"
              className="w-8 h-8 p-0"
            >
              +
            </Button>
          </div>
        </div>
        <div className="mt-2 text-right">
          <span className="font-semibold text-orange-600">
            ₾{(item.menuItem.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItem;
