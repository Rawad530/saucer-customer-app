import React, { useState, useEffect, useMemo } from "react"; // <-- ADDED useEffect, useMemo
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // <-- IMPORTED
import { Label } from "@/components/ui/label"; // <-- IMPORTED
import { MenuItem } from "@/types/order";
import { supabase } from "@/integrations/supabase/client"; // <-- IMPORTED (YOUR PATH)
import { 
  sauceOptions as masterSauceOptions, 
  drinkOptions as masterDrinkOptions, 
  addOnOptions as masterAddOnOptions,
  bunOptions as masterBunOptions // <-- IMPORTED NEW BUNS
} from "@/data/menu"; // <-- YOUR ORIGINAL, CORRECT PATH

// Interface for the data we fetch from Supabase
interface OptionAvailability {
  option_name: string;
  option_type: string;
  is_available: boolean;
}

interface PendingItem {
  menuItem: MenuItem;
  quantity: number; 
  bunType?: string; // <-- ADDED
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
  
  // YOUR EXISTING LOGIC
  const isMainItem = pendingItem.menuItem.category === 'mains';
  
  // --- NEW LOGIC FOR BUNS (AS REQUESTED) ---
  const isBurgerItem = pendingItem.menuItem.name.toLowerCase().includes('burger');
  
  // --- NEW STATE TO HOLD LIVE AVAILABILITY DATA ---
  const [availableOptions, setAvailableOptions] = useState<OptionAvailability[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // --- NEW: FETCH LIVE AVAILABILITY FROM SUPABASE ---
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingOptions(true);
      const { data, error } = await supabase
        .from('option_availability')
        .select('option_name, option_type, is_available')
        .eq('is_available', true); // Only fetch items that are ON

      if (error) {
        console.error("Failed to fetch option availability:", error);
        // Fallback: In case of error, just use the master lists
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
  }, []); // Runs once when the popup opens

  // --- NEW: CREATE FILTERED LISTS USING useMemo ---
  const getFilteredList = (type: string, masterList: any[]) => {
    // We wait for loading to finish
    if (loadingOptions) return []; 
    
    // Get all items from the db that match this type
    const liveNames = new Set(
      availableOptions
        .filter(opt => opt.option_type === type)
        .map(opt => opt.option_name)
    );

    // If masterList is simple string array (like sauces)
    if (masterList.length === 0) return [];
    if (typeof masterList[0] === 'string') {
      return masterList.filter(name => liveNames.has(name) || name === 'None'); // Always include 'None'
    }
    // If masterList is object array (like addons/buns)
    return masterList.filter(item => liveNames.has(item.name));
  };

  const availableBuns = useMemo(() => getFilteredList('bun', masterBunOptions), [availableOptions, loadingOptions]);
  const availableSauces = useMemo(() => getFilteredList('sauce', masterSauceOptions), [availableOptions, loadingOptions]);
  
  // Use 'sauce_cup' type for sauce cups, but fallback to 'sauce' list if empty
  const availableSauceCups = useMemo(() => {
    let cups = getFilteredList('sauce_cup', masterSauceOptions);
    // <= 1 because 'None' is included in the string list
    if (cups.length <= 1 && availableOptions.some(opt => opt.option_type === 'sauce_cup')) { 
      // User has defined 'sauce_cup' items, so respect the (empty) list
      return cups;
    } else {
      // User has not defined any 'sauce_cup' items, so fall back to the main 'sauce' list
      return getFilteredList('sauce', masterSauceOptions);
    }
  }, [availableOptions, loadingOptions]);

  const availableDrinks = useMemo(() => getFilteredList('drink', masterDrinkOptions), [availableOptions, loadingOptions]);
  const availableAddons = useMemo(() => getFilteredList('addon', masterAddOnOptions), [availableOptions, loadingOptions]);
  
  const isSpicyAvailable = useMemo(() => {
    if (loadingOptions) return false;
    // Check if 'Spicy (Free)' exists in the db list
    const spicyOption = availableOptions.find(opt => opt.option_type === 'other' && opt.option_name === 'Spicy (Free)');
    // If it's not in the db at all, default to showing it (legacy behavior)
    if (!spicyOption) return true;
    // Otherwise, respect the toggle
    return spicyOption.is_available;
  }, [availableOptions, loadingOptions]);


  // --- YOUR EXISTING HANDLERS (UNTOUCHED) ---
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
  
  // --- UPDATED PRICE CALCULATION ---
  const calculateOptionsPrice = () => {
    // 1. Get bun price
    // We check the MASTER list for the price, not the available list
    const bunPrice = masterBunOptions.find(b => b.name === pendingItem.bunType)?.price || 0;

    // 2. Get addons price (Your existing logic, renamed)
    const addonsPrice = pendingItem.addons.reduce((total, addon) => {
      const addonOption = masterAddOnOptions.find(option => option.name === addon);
      return total + (addonOption?.price || 0);
    }, 0);

    return bunPrice + addonsPrice; // Return combined price
  };

  // --- UPDATED TOTAL PRICE (uses new function name) ---
  const totalPrice = (pendingItem.menuItem.price + calculateOptionsPrice()) * pendingItem.quantity;
  
  // --- YOUR EXISTING VALIDATION LOGIC ---
  const isMainSauceRequired = pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && !pendingItem.sauce;
  const isSauceCupSectionVisible = pendingItem.menuItem.is_combo || (pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category === 'value');
  const isSauceCupRequired = isSauceCupSectionVisible && !pendingItem.sauceCup;
  const isDrinkRequired = pendingItem.menuItem.is_combo && !pendingItem.drink;

  // --- UPDATED VALIDATION LOGIC ---
  const isBunRequired = isBurgerItem && availableBuns.length > 0 && !pendingItem.bunType;
  // User cannot confirm while options are loading
  const isConfirmDisabled = isMainSauceRequired || isSauceCupRequired || isDrinkRequired || isBunRequired || loadingOptions;

  return (
    <Card className="border-none shadow-none bg-gray-800 text-white">
      <CardContent className="p-4 space-y-4">
        {/* --- YOUR HEADER (UNTOUCHED) --- */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg text-white">
            {pendingItem.menuItem.name}
          </h4>
          <span className="text-amber-400 font-bold text-lg">₾{totalPrice.toFixed(2)}</span>
        </div>
        
        {/* --- NEW BUN SELECTION SECTION (FOR BURGERS ONLY) --- */}
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
        
        {/* --- Main Sauce (NOW USES FILTERED LIST) --- */}
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

        {/* --- Sauce Cup (NOW USES FILTERED LIST) --- */}
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
        
        {/* --- Drink (NOW USES FILTERED LIST) --- */}
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

        {/* --- Add-ons (NOW USES FILTERED LIST) --- */}
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
              {/* --- Spicy (NOW CONDITIONAL) --- */}
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

        {/* --- YOUR QUANTITY SELECTOR (UNTOUCHED) --- */}
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

        {/* --- YOUR REMARKS (UNTOUCHED) --- */}
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
                className="min-h-[80px] bg-gray-700 border-gray-60Good0 text-white"
              />
            </div>
          )}
        </div>

        {/* --- YOUR ACTION BUTTONS (UNTOUCHED) --- */}
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