// src/components/SimpleItemDialog.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuItem } from "@/types/order";
import { Plus, Minus } from "lucide-react";

interface SimpleItemDialogProps {
  item: MenuItem;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

const SimpleItemDialog = ({ item, onConfirm, onCancel }: SimpleItemDialogProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const totalPrice = item.price * quantity;

  return (
    <div className="text-white">
      {item.image_url && (
        <img 
          src={item.image_url} 
          alt={item.name} 
          className="w-full h-48 object-cover rounded-md mb-4" 
        />
      )}
      <p className="text-lg text-gray-300 mb-4">{item.description}</p>
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-xl font-bold text-amber-400">
          ₾{totalPrice.toFixed(2)}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-gray-700 border-gray-600 hover:bg-gray-600"
            onClick={handleDecrease}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input 
            type="text" 
            readOnly 
            value={quantity} 
            className="w-16 text-center bg-gray-900 border-gray-700 text-lg font-bold"
          />
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-gray-700 border-gray-600 hover:bg-gray-600"
            onClick={handleIncrease}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button onClick={() => onConfirm(quantity)} className="w-full bg-green-500 hover:bg-green-600">
          Add to Order
        </Button>
        <Button onClick={onCancel} variant="outline" className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SimpleItemDialog;