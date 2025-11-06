import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MenuItem } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { 
  // We no longer need the hard-coded sauce/drink lists
  addOnOptions as masterAddOnOptions,
  bunOptions as masterBunOptions 
} from "@/data/menu";

// Interface for the data we fetch from Supabase
interface OptionAvailability {
  option_name: string;
  option_type: string;
  is_available: boolean;
}

interface PendingItem {
  menuItem: MenuItem;
  quantity: number; 
  bunType?: string; 
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
  isEditing: boolean; 
}

const ItemConfigurationCard = ({ 
  pendingItem, 
  onUpdatePendingItem, 
  onConfirm, 
  onCancel,
  isEditing 
}: ItemConfigurationCardProps) => {
  const [showRemarks, setShowRemarks] = useState(!!pendingItem.remarks);
  
  const isMainItem = pendingItem.menuItem.category === 'mains';
  const isBurgerItem = pendingItem.menuItem.name.toLowerCase().includes('burger');
  
  const [availableOptions, setAvailableOptions] = useState<OptionAvailability[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch ALL available options from the database
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingOptions(true);
      const { data, error } = await supabase
        .from('option_availability')
        .select('option_name, option_type, is_available')
        .eq('is_available', true); // Only fetch items that are ON

      if (error) {
        console.error("Failed to fetch option availability:", error);
        setAvailableOptions([]); // Set to empty on error
      } else {
        setAvailableOptions(data as OptionAvailability[]);
      }
      setLoadingOptions(false);
    };

    fetchAvailability();
  }, []); // Runs once when the popup opens

  // --- THIS IS THE NEW, FULLY DYNAMIC LOGIC ---

  // Build the lists directly from the database response
  const availableSauces = useMemo(() => {
    const sauces = availableOptions
      .filter(opt => opt.option_type === 'sauce')
      .map(opt => opt.option_name);
    return ['None', ...sauces]; // Add 'None' to the start
  }, [availableOptions]);

  const availableSauceCups = useMemo(() => {
    let cups = availableOptions
      .filter(opt => opt.option_type === 'sauce_cup')
      .map(opt => opt.option_name);
    
    // Fallback: If no specific "sauce_cup" items are defined, use the main "sauce" list
    if (cups.length === 0) {
      cups = availableOptions
        .filter(opt => opt.option_type === 'sauce')
        .map(opt => opt.option_name);
    }
    return ['None', ...cups];
  }, [availableOptions]);

  const availableDrinks = useMemo(() => {
    return availableOptions
      .filter(opt => opt.option_type === 'drink')
      .map(opt => opt.option_name);
  }, [availableOptions]);

  // Addons and Buns still use the master list because they have prices
  const availableAddons = useMemo(() => {
    const liveNames = new Set(
      availableOptions
        .filter(opt => opt.option_type === 'addon')
        .map(opt => opt.option_name)
    );
    return masterAddOnOptions.filter(item => liveNames.has(item.name));
  }, [availableOptions]);

  const availableBuns = useMemo(() => {
    const liveNames = new Set(
      availableOptions
        .filter(opt => opt.option_type === 'bun')
        .map(opt => opt.option_name)
    );
    return masterBunOptions.filter(item => liveNames.has(item.name));
  }, [availableOptions]);
  
  const isSpicyAvailable = useMemo(() => {
    return availableOptions.some(opt => opt.option_type === 'other' && opt.option_name === 'Spicy (Free)');
  }, [availableOptions]);

  // --- END NEW DYNAMIC LOGIC ---

  
  // Your original handlers (UNTOUCHED)
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

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return; // Don't allow less than 1
    onUpdatePendingItem(prev => prev ? { ...prev, quantity: newQuantity } : null);
  };

  // --- UPDATED PRICE CALCULATION ---
  const calculateOptionsPrice = () => {
    const bunPrice = masterBunOptions.find(b => b.name === pendingItem.bunType)?.price || 0;
    const addonsPrice = pendingItem.addons.reduce((total, addon) => {
      const addonOption = masterAddOnOptions.find(option => option.name === addon);
      return total + (addonOption?.price || 0);
    }, 0);
    return bunPrice + addonsPrice;
  };

  const totalPrice = (pendingItem.menuItem.price + calculateOptionsPrice()) * pendingItem.quantity;
  
  // Your original validation logic
  const isMainSauceRequired = pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && !pendingItem.sauce;
  const isSauceCupSectionVisible = pendingItem.menuItem.is_combo || (pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category === 'value');
  const isSauceCupRequired = isSauceCupSectionVisible && !pendingItem.sauceCup;
  const isDrinkRequired = pendingItem.menuItem.is_combo && !pendingItem.drink;

  // --- UPDATED VALIDATION LOGIC ---
  const isBunRequired = isBurgerItem && availableBuns.length > 0 && !pendingItem.bunType;
  const isConfirmDisabled = isMainSauceRequired || isSauceCupRequired || isDrinkRequired || isBunRequired || loadingOptions;

  return (
    <Card className="border-none shadow-none bg-gray-800 text-white">
      <CardContent className="p-4 space-y-4">
        {/* Your header (UNTOUCHED) */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg text-white">
            {pendingItem.menuItem.name}
          </h4>
          <span className="text-amber-400 font-bold text-lg">₾{totalPrice.toFixed(2)}</span>
        </div>
        
        {/* ADDED: BUN SELECTION */}
        {isBurgerItem && availableBuns.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bun Selection *
            </label>
            <RadioGroup
              value={pendingItem.bunType}
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, bunType: value} : null)
              }
              className="space-y-2"
            >
              {availableBuns.map(bun => (
                <div key={bun.name} className="flex items-center space-x-2">
                  <RadioGroupItem value={bun.name} id={bun.name} className="text-amber-500 border-gray-500" />
                  <Label htmlFor={bun.name} className="text-sm text-gray-200">
                    {bun.name} {bun.price > 0 ? `(+₾${bun.price.toFixed(2)})` : ''}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        
        {/* Main Sauce (NOW FULLY DYNAMIC) */}
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
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select sauce"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {availableSauces.map(sauce => (
                  <SelectItem key={sauce} value={sauce} className="focus:bg-gray-600">{sauce}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sauce Cup (NOW FULLY DYNAMIC) */}
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
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select sauce cup"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {availableSauceCups.map(sauce => (
                  <SelectItem key={sauce} value={sauce} className="focus:bg-gray-600">{sauce}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Drink (NOW FULLY DYNAMIC) */}
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
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select drink"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {availableDrinks.map(drink => (
                  <SelectItem key={drink} value={drink} className="focus:bg-gray-600">{drink}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Add-ons (FILTERED) */}
        {isMainItem && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add-ons
            </label>
            <div className="space-y-2">
              {availableAddons.map(addon => (
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
              {isSpicyAvailable && (
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
              )}
            </div>
          </div>
        )}

        {/* Your Quantity Selector (UNTOUCHED) */}
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

        {/* Your Remarks (UNTOUCHED) */}
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

        {/* Your Action Buttons (UNTOUCHED) */}
        <div className="flex space-x-2">
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 flex-1" disabled={isConfirmDisabled}>
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