// src/components/ItemConfigurationCard.tsx
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
  sauceOptions as masterSauceOptions, 
  drinkOptions as masterDrinkOptions, 
  addOnOptions as masterAddOnOptions,
  bunOptions as masterBunOptions
} from "@/data/menu";

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

  useEffect(() => {
    const fetchAvailability = async () => {
      if (availableOptions.length === 0) {
          setLoadingOptions(true);
      }

      const { data, error } = await supabase
        .from('option_availability')
        .select('option_name, option_type, is_available')
        .eq('is_available', true);

      if (error) {
        console.error("Failed to fetch option availability:", error);
        const allOptions = [
          ...masterSauceOptions.map(name => ({ option_name: name, option_type: 'sauce', is_available: true })),
          ...masterSauceOptions.map(name => ({ option_name: name, option_type: 'sauce_cup', is_available: true })),
          ...masterDrinkOptions.map(name => ({ option_name: name, option_type: 'drink', is_available: true })),
          ...masterAddOnOptions.map(item => ({ option_name: item.name, option_type: 'addon', is_available: true })),
          ...masterBunOptions.map(item => ({ option_name: item.name, option_type: 'bun', is_available: true })),
          { option_name: 'Spicy (Free)', option_type: 'other', is_available: true }
        ];
        setAvailableOptions(allOptions as OptionAvailability[]);
      } else {
        setAvailableOptions(data as OptionAvailability[]);
      }
      setLoadingOptions(false);
    };

    fetchAvailability();

    const channel = supabase
      .channel('public:option_availability')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'option_availability' },
        (payload) => {
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredList = (type: string, masterList: any[]) => {
    if (loadingOptions) return []; 
    
    const liveNames = new Set(
      availableOptions
        .filter(opt => opt.option_type === type)
        .map(opt => opt.option_name)
    );

    if (masterList.length === 0) return [];

    if (typeof masterList[0] === 'string') {
      return masterList.filter(name => liveNames.has(name) || name === 'None'); 
    }
    return masterList.filter(item => liveNames.has(item.name));
  };

  const availableBuns = useMemo(() => getFilteredList('bun', masterBunOptions), [availableOptions, loadingOptions]);
  const availableSauces = useMemo(() => getFilteredList('sauce', masterSauceOptions), [availableOptions, loadingOptions]);
  
  const availableSauceCups = useMemo(() => {
    let cups = getFilteredList('sauce_cup', masterSauceOptions);
    const hasSpecificSauceCups = availableOptions.some(opt => opt.option_type === 'sauce_cup');

    if (hasSpecificSauceCups && cups.length <= 1) { 
      return cups;
    } else if (hasSpecificSauceCups) {
      return cups;
    } else {
      return getFilteredList('sauce', masterSauceOptions);
    }
  }, [availableOptions, loadingOptions]);

  const availableDrinks = useMemo(() => getFilteredList('drink', masterDrinkOptions), [availableOptions, loadingOptions]);
  const availableAddons = useMemo(() => getFilteredList('addon', masterAddOnOptions), [availableOptions, loadingOptions]);
  
  const isSpicyAvailable = useMemo(() => {
    if (loadingOptions) return false;
    const spicyOption = availableOptions.find(opt => opt.option_type === 'other' && opt.option_name === 'Spicy (Free)');
    return !!spicyOption;
  }, [availableOptions, loadingOptions]);

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
    if (newQuantity < 1) return;
    onUpdatePendingItem(prev => prev ? { ...prev, quantity: newQuantity } : null);
  };
  
  const calculateOptionsPrice = () => {
    const bunPrice = masterBunOptions.find(b => b.name === pendingItem.bunType)?.price || 0;
    const addonsPrice = pendingItem.addons.reduce((total, addon) => {
      const addonOption = masterAddOnOptions.find(option => option.name === addon);
      return total + (addonOption?.price || 0);
    }, 0);
    return bunPrice + addonsPrice;
  };

  const totalPrice = (pendingItem.menuItem.price + calculateOptionsPrice()) * pendingItem.quantity;
  
  const isMainSauceRequired = pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && !pendingItem.sauce;
  const isSauceCupSectionVisible = pendingItem.menuItem.is_combo || (pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category === 'value');
  const isSauceCupRequired = isSauceCupSectionVisible && !pendingItem.sauceCup;
  const isDrinkRequired = pendingItem.menuItem.is_combo && !pendingItem.drink;
  const isBunRequired = isBurgerItem && availableBuns.length > 0 && !pendingItem.bunType;
  const isConfirmDisabled = isMainSauceRequired || isSauceCupRequired || isDrinkRequired || isBunRequired || loadingOptions;

  return (
    <Card dir="ltr" className="border-none shadow-none bg-gray-800 text-white text-left">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-3">
          <h4 className="font-medium text-lg text-white">
            {pendingItem.menuItem.name}
          </h4>
          <span className="text-amber-400 font-bold text-lg">₾{totalPrice.toFixed(2)}</span>
        </div>
        
        {/* --- BUN SELECTION SECTION --- */}
        {isBurgerItem && availableBuns.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bun Selection <span className="text-amber-500">*</span>
            </label>
            <RadioGroup
              value={pendingItem.bunType}
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, bunType: value} : null)
              }
              className="space-y-3"
            >
              {availableBuns.map(bun => (
                <div key={bun.name} className="flex items-center space-x-3">
                  <RadioGroupItem value={bun.name} id={bun.name} className="text-amber-500 border-gray-500 focus:ring-amber-500" />
                  <Label htmlFor={bun.name} className="text-sm text-gray-200 cursor-pointer">
                    {bun.name} {bun.price > 0 ? `(+₾${bun.price.toFixed(2)})` : ''}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        
        {/* --- Main Sauce --- */}
        {pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sauce <span className="text-amber-500">*</span>
            </label>
            <Select 
              value={pendingItem.sauce} 
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, sauce: value} : null)
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full">
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select sauce"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {availableSauces.map(sauce => (
                  <SelectItem key={sauce} value={sauce} className="focus:bg-gray-600 cursor-pointer">{sauce}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* --- Sauce Cup --- */}
        {isSauceCupSectionVisible && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sauce Cup <span className="text-amber-500">*</span>
            </label>
            <Select 
              value={pendingItem.sauceCup} 
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, sauceCup: value} : null)
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full">
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select sauce cup"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {availableSauceCups.map(sauce => (
                  <SelectItem key={sauce} value={sauce} className="focus:bg-gray-600 cursor-pointer">{sauce}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* --- Drink --- */}
        {pendingItem.menuItem.is_combo && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Drink <span className="text-amber-500">*</span>
            </label>
            <Select 
              value={pendingItem.drink} 
              onValueChange={(value) => 
                onUpdatePendingItem(prev => prev ? {...prev, drink: value} : null)
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full">
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select drink"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {availableDrinks.map(drink => (
                  <SelectItem key={drink} value={drink} className="focus:bg-gray-600 cursor-pointer">{drink}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* --- Add-ons --- */}
        {isMainItem && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Add-ons
            </label>
            <div className="space-y-3">
              {availableAddons.map(addon => (
                <div key={addon.name} className="flex items-center space-x-3">
                  <Checkbox
                    id={addon.name}
                    checked={pendingItem.addons.includes(addon.name)}
                    onCheckedChange={(checked) => handleAddonChange(addon.name, checked as boolean)}
                    className="data-[state=checked]:bg-amber-500 border-gray-500 focus:ring-amber-500"
                  />
                  <label htmlFor={addon.name} className="text-sm text-gray-200 cursor-pointer">
                    {addon.name} (+₾{addon.price.toFixed(2)})
                  </label>
                </div>
              ))}
              {/* --- Spicy --- */}
              {isSpicyAvailable && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="spicy"
                    checked={pendingItem.spicy}
                    onCheckedChange={(checked) => handleSpicyChange(checked as boolean)}
                    className="data-[state=checked]:bg-amber-500 border-gray-500 focus:ring-amber-500"
                  />
                  <label htmlFor="spicy" className="text-sm text-gray-200 cursor-pointer">
                    Spicy (Free)
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-700">
          <label className="text-sm font-medium text-gray-300">Quantity</label>
          <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="w-8 h-8 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-amber-500"
                onClick={() => handleQuantityChange(pendingItem.quantity - 1)}
                disabled={pendingItem.quantity <= 1}
              >
                -
              </Button>
              <span className="font-bold text-lg w-8 text-center">{pendingItem.quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="w-8 h-8 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-amber-500"
                onClick={() => handleQuantityChange(pendingItem.quantity + 1)}
              >
                +
              </Button>
          </div>
        </div>

        <div className="mb-4">
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
            <div className="space-y-2 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
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
                  className="text-gray-400 hover:text-white px-2 h-6"
                >
                  Remove
                </Button>
              </div>
              <Textarea
                placeholder="Enter any special customer requests..."
                value={pendingItem.remarks || ''}
                onChange={(e) => handleRemarksChange(e.target.value)}
                className="min-h-[80px] bg-gray-700 border-gray-600 text-white focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-2">
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 flex-1 font-bold shadow-lg" disabled={isConfirmDisabled}>
            {isEditing ? 'Update Item' : 'Add to Order'}
          </Button>
          <Button onClick={onCancel} variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600 hover:text-white font-bold">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemConfigurationCard;