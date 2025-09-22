// src/components/GuestOrderDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// --- FIX 1: Import the OrderItem TYPE as "OrderItemType" to avoid name collision ---
import { OrderItem as OrderItemType, MenuItem } from "@/types/order";
import { addOnOptions } from "@/data/menu";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "./MenuSection";
import ItemConfigurationCard from "./ItemConfigurationCard";
// --- FIX 2: Correctly import the OrderItem COMPONENT ---
import OrderItem from "./OrderItem";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface GuestOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingItem {
  menuItem: MenuItem;
  quantity: number;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
}

const GuestOrderDialog = ({ isOpen, onClose }: GuestOrderDialogProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedItems, setSelectedItems] = useState<OrderItemType[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [step, setStep] = useState<'ordering' | 'details'>('ordering');
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (isOpen && menuItems.length === 0) {
      const fetchMenu = async () => {
        setLoadingMenu(true);
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('id');
        if (error) console.error("Error fetching menu for guest:", error);
        else if (data) setMenuItems(data);
        setLoadingMenu(false);
      };
      fetchMenu();
    }
  }, [isOpen, menuItems.length]);

  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      setPendingItem({ menuItem, addons: [], spicy: false, quantity: 1 });
    } else {
      addFinalItem({ menuItem, quantity: 1, addons: [], spicy: false });
    }
  };

  const addFinalItem = (item: OrderItemType) => {
      const existingIndex = selectedItems.findIndex(existing =>
        existing.menuItem.id === item.menuItem.id && existing.sauce === item.sauce && existing.sauceCup === item.sauceCup &&
        existing.drink === item.drink && JSON.stringify(existing.addons.sort()) === JSON.stringify(item.addons.sort()) &&
        existing.spicy === item.spicy && existing.remarks === item.remarks
      );
      if (existingIndex >= 0) {
        setSelectedItems(prev => prev.map((existing, index) => index === existingIndex ? { ...existing, quantity: existing.quantity + 1 } : existing));
      } else {
        setSelectedItems(prev => [...prev, item]);
      }
  };

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    addFinalItem({
        menuItem: pendingItem.menuItem, quantity: pendingItem.quantity, sauce: pendingItem.sauce, sauceCup: pendingItem.sauceCup, drink: pendingItem.drink,
        addons: pendingItem.addons, spicy: pendingItem.spicy, remarks: pendingItem.remarks
    });
    setPendingItem(null);
  };
  
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSelectedItems(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item));
    }
  };

  const totalPrice = selectedItems.reduce((sum, item) => {
    let itemPrice = item.menuItem.price;
    item.addons.forEach(addonName => {
      const addon = addOnOptions.find(opt => opt.name === addonName);
      if (addon) itemPrice += addon.price;
    });
    return sum + (itemPrice * item.quantity);
  }, 0);

  const handleProceedToDetails = () => {
    if (selectedItems.length > 0) {
      setStep('details');
    }
  };

  const handlePlaceGuestOrder = async () => {
    if (!guestName.trim() || !guestContact.trim()) {
      alert("Please provide your name and a contact phone/email.");
      return;
    }
    setIsPlacingOrder(true);
    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-guest-order', {
        body: { guestName, guestContact, orderItems: selectedItems, totalPrice },
      });
      if (orderError) throw orderError;

      const { transactionId } = orderData;
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('bog-payment', {
        body: { orderId: transactionId, amount: totalPrice },
      });
      if (paymentError) throw paymentError;
      if (paymentData.error) throw new Error(paymentData.error);

      window.location.href = paymentData.redirectUrl;

    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.");
      setIsPlacingOrder(false);
    }
  };

  const categorizedItems = {
      value: menuItems.filter(item => item.category === 'value'),
      mains: menuItems.filter(item => item.category === 'mains'),
      sides: menuItems.filter(item => item.category === 'sides'),
      sauces: menuItems.filter(item => item.category === 'sauces'),
      drinks: menuItems.filter(item => item.category === 'drinks'),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-amber-500">Order as a Guest</DialogTitle>
          <DialogDescription>
            Build your order below. Your order details will be sent to the contact info you provide.
          </DialogDescription>
        </DialogHeader>
        
        {step === 'ordering' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto flex-grow pr-4">
            {loadingMenu ? <p>Loading menu...</p> : (
              <div className="space-y-6">
                {Object.entries(categorizedItems).map(([category, items]) => (
                  items.length > 0 && <MenuSection key={category} title={category.charAt(0).toUpperCase() + category.slice(1)} items={items} onAddItem={addItemToOrder} />
                ))}
              </div>
            )}
            <div className="h-full">
              <div className="space-y-4 bg-gray-800 p-6 rounded-lg h-full flex flex-col sticky top-0">
                  <h3 className="text-xl font-semibold text-amber-400">Your Order</h3>
                  {pendingItem && <ItemConfigurationCard pendingItem={pendingItem} onUpdatePendingItem={setPendingItem as any} onConfirm={confirmPendingItem} onCancel={() => setPendingItem(null)} />}
                  {selectedItems.length === 0 && !pendingItem ? <div className="text-gray-400 text-center py-8 flex-grow flex items-center justify-center">Your cart is empty</div> : (
                    <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                        {selectedItems.map((item, index) => (
                            <OrderItem key={`${item.menuItem.id}-${index}`} item={item} index={index} onUpdateQuantity={updateItemQuantity} onEdit={() => {}} addOnOptions={addOnOptions} />
                        ))}
                    </div>
                  )}
                  <div className="border-t border-gray-700 pt-4 mt-auto">
                      <div className="flex justify-between items-center text-xl font-bold"><span className="text-white">Total:</span><span className="text-amber-500">₾{totalPrice.toFixed(2)}</span></div>
                  </div>
                  <Button onClick={handleProceedToDetails} className="w-full bg-amber-600 hover:bg-amber-700" disabled={selectedItems.length === 0}>
                      Proceed to Details
                  </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="w-full max-w-md space-y-4">
              <h2 className="text-2xl font-bold text-center">Your Details</h2>
              <div>
                <Label htmlFor="guest-name" className="text-gray-400">Full Name</Label>
                <Input id="guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your full name" className="bg-gray-700 border-gray-600 text-white mt-1"/>
              </div>
              <div>
                <Label htmlFor="guest-contact" className="text-gray-400">Phone or Email</Label>
                <Input id="guest-contact" value={guestContact} onChange={(e) => setGuestContact(e.target.value)} placeholder="Contact for order updates" className="bg-gray-700 border-gray-600 text-white mt-1"/>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep('ordering')} className="w-full">Back to Order</Button>
                <Button onClick={handlePlaceGuestOrder} disabled={isPlacingOrder} className="w-full bg-green-600 hover:bg-green-700">
                  {isPlacingOrder ? 'Processing...' : `Pay ₾${totalPrice.toFixed(2)}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuestOrderDialog;