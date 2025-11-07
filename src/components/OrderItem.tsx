import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderItem as OrderItemType } from "@/types/order";
import { Trash2, Pencil } from "lucide-react";

interface OrderItemProps {
  item: OrderItemType;
  index: number;
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onEdit: (index: number) => void;
  addOnOptions: { name: string; price: number }[];
}

const OrderItem = ({ item, index, onUpdateQuantity, onEdit, addOnOptions }: OrderItemProps) => {
  const calculateItemTotal = () => {
    let itemPrice = item.menuItem.price;
    item.addons.forEach(addonName => {
      const addon = addOnOptions.find(opt => opt.name === addonName);
      if (addon) itemPrice += addon.price;
    });
    return itemPrice * item.quantity;
  };

  const itemTotalPrice = calculateItemTotal();

  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <h5 className="font-medium text-gray-800 text-sm">
              {item.menuItem.name}
            </h5>
            <div className="text-xs text-gray-600 space-y-0.5 mt-1">
              
              {/* THIS IS THE NEW LINE YOU ARE ADDING */}
              {item.bunType && <p>Bun: {item.bunType}</p>}

              {/* The rest of the code is the same */}
              {item.sauce && item.sauce !== 'None' && <p>Sauce: {item.sauce}</p>}
              {item.sauceCup && <p>Sauce Cup: {item.sauceCup}</p>}
              {item.drink && <p>Drink: {item.drink}</p>}
              {item.addons.length > 0 && <p>Add-ons: {item.addons.join(', ')}</p>}
              {item.spicy && <p className="text-red-500 font-medium">Spicy</p>}
              {item.remarks && <p className="text-blue-600 italic">"{item.remarks}"</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
              size="sm"
              variant="outline"
              className="w-7 h-7 p-0"
            >
              -
            </Button>
            <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
            <Button
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
              size="sm"
              variant="outline"
              className="w-7 h-7 p-0"
            >
              +
            </Button>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t flex justify-between items-center">
          <div className="flex gap-1">
            <Button onClick={() => onUpdateQuantity(index, 0)} variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => onEdit(index)} variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-semibold text-amber-600">
            ₾{itemTotalPrice.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItem;