import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { MenuItem } from "@/types/order";
import { sauceOptions, drinkOptions, addOnOptions } from "@/data/menu";

interface PendingItem {
  menuItem: MenuItem;
  quantity: number; 
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
  discount?: number;
}

interface ItemConfigurationCardProps {
  pendingItem: PendingItem;
  onUpdatePendingItem: React.Dispatch<React.SetStateAction<PendingItem | null>>;
  onConfirm: () => void;
  onCancel: () => void;
  isEditing: boolean; // <-- ADDED: To fix button text
}

const ItemConfigurationCard = ({ 
  pendingItem, 
  onUpdatePendingItem, 
  onConfirm, 
  onCancel,
  isEditing // <-- ADDED
}: ItemConfigurationCardProps) => {
  const [showRemarks, setShowRemarks] = useState(!!pendingItem.remarks);
  
  const isMainItem = pendingItem.menuItem.category === 'mains';
  
  const handleAddonChange = (addonName: string, checked: boolean) => {
    onUpdatePendingItem(prev => {
      if (!prev) return null;
      const updatedAddons = checked 
        ? [...prev.addons, addonName]
        : prev.addons.filter(addon => addon !== addonName);
      return { ...prev, addons: updatedAddons };
    });
  };

  const handleSpicyChange = (checked: boolean) => {
    onUpdatePendingItem(prev => prev ? { ...prev, spicy: checked } : null);
  };

  const handleRemarksChange = (value: string) => {
    onUpdatePendingItem(prev => prev ? { ...prev, remarks: value } : null);
  };

  // --- ADDED: Handler for the new quantity buttons ---
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return; // Don't allow less than 1
    onUpdatePendingItem(prev => prev ? { ...prev, quantity: newQuantity } : null);
  };
  // --- END ADDED ---

  const calculateAddonPrice = () => {
    return pendingItem.addons.reduce((total, addon) => {
      const addonOption = addOnOptions.find(option => option.name === addon);
      return total + (addonOption?.price || 0);
    }, 0);
  };

  const totalPrice = (pendingItem.menuItem.price + calculateAddonPrice()) * pendingItem.quantity;
  
  const isMainSauceRequired = pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && !pendingItem.sauce;
  
  const isSauceCupSectionVisible = pendingItem.menuItem.is_combo || (pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category === 'value');
  const isSauceCupRequired = isSauceCupSectionVisible && !pendingItem.sauceCup;

  const isDrinkRequired = pendingItem.menuItem.is_combo && !pendingItem.drink;

  const isConfirmDisabled = isMainSauceRequired || isSauceCupRequired || isDrinkRequired;

  return (
    <Card className="border-none shadow-none bg-gray-800 text-white">
      <CardContent className="p-4 space-y-4">
        {/* --- MODIFIED: Cleaner header --- */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg text-white">
            {pendingItem.menuItem.name}
          </h4>
          <span className="text-amber-400 font-bold text-lg">₾{totalPrice.toFixed(2)}</span>
        </div>
        {/* --- END MODIFIED --- */}
        
        {/* Main Sauce */}
        {pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sauce *
            </label>
            <Select 
              value={pendingItem.sauce} 
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, sauce: value} : null)
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select sauce" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {sauceOptions.map(sauce => (
                  <SelectItem key={sauce} value={sauce} className="focus:bg-gray-600">{sauce}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sauce Cup */}
        {isSauceCupSectionVisible && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sauce Cup *
            </label>
            <Select 
              value={pendingItem.sauceCup} 
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, sauceCup: value} : null)
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select sauce cup" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {sauceOptions.map(sauce => (
                  <SelectItem key={sauce} value={sauce} className="focus:bg-gray-600">{sauce}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Drink */}
        {pendingItem.menuItem.is_combo && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Drink *
            </label>
            <Select 
              value={pendingItem.drink} 
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, drink: value} : null)
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select drink" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {drinkOptions.map(drink => (
                  <SelectItem key={drink} value={drink} className="focus:bg-gray-600">{drink}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Add-ons */}
        {isMainItem && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add-ons
            </label>
            <div className="space-y-2">
              {addOnOptions.map(addon => (
                <div key={addon.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={addon.name}
                    checked={pendingItem.addons.includes(addon.name)}
                    onCheckedChange={(checked) => handleAddonChange(addon.name, checked as boolean)}
                    className="data-[state=checked]:bg-amber-500 border-gray-500"
                  />
                  <label htmlFor={addon.name} className="text-sm text-gray-200">
                    {addon.name} (+₾{addon.price.toFixed(2)})
                  </label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="spicy"
                  checked={pendingItem.spicy}
                  onCheckedChange={(checked) => handleSpicyChange(checked as boolean)}
                  className="data-[state=checked]:bg-amber-500 border-gray-500"
                />
                <label htmlFor="spicy" className="text-sm text-gray-200">
                  Spicy (Free)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* --- ADDED: Quantity Selector --- */}
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-700">
          <label className="text-sm font-medium text-gray-300">Quantity</label>
          <div className="flex items-center space-x-2">
              <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 bg-gray-700 border-gray-600 hover:bg-gray-600"
                  onClick={() => handleQuantityChange(pendingItem.quantity - 1)}
                  disabled={pendingItem.quantity <= 1}
              >
                  -
              </Button>
              <span className="font-bold text-lg w-8 text-center">{pendingItem.quantity}</span>
              <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 bg-gray-700 border-gray-600 hover:bg-gray-600"
                  onClick={() => handleQuantityChange(pendingItem.quantity + 1)}
              >
                  +
              </Button>
          </div>
        </div>
        {/* --- END ADDED --- */}

        {/* Remarks */}
        <div className="mb-3">
          {!showRemarks ? (
            <Button
              onClick={() => setShowRemarks(true)}
              variant="outline"
              size="sm"
              className="text-gray-300 hover:text-white bg-gray-700 border-gray-600 hover:bg-gray-600"
            >
              Add Remarks
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Special Requests
                </label>
                <Button
                  onClick={() => {
                    setShowRemarks(false);
                    handleRemarksChange('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white px-2"
                >
                  Remove
                </Button>
              </div>
              <Textarea
                placeholder="Enter any special customer requests..."
                value={pendingItem.remarks || ''}
                onChange={(e) => handleRemarksChange(e.target.value)}
                className="min-h-[80px] bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 flex-1" disabled={isConfirmDisabled}>
            {/* --- MODIFIED: Fixed button text --- */}
            {isEditing ? 'Update Item' : 'Add to Order'}
          </Button>
          <Button onClick={onCancel} variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemConfigurationCard;
