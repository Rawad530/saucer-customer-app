import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Order, OrderItem, MenuItem, PaymentMode } from "@/types/order";
import { menuItems, addOnOptions } from "@/data/menu";
import { getNextOrderNumber } from "@/utils/orderUtils";
import MenuSection from "./MenuSection";
import OrderSummary from "./OrderSummary";
import PaymentModeDialog from "@/components/PaymentModeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Order) => void;
}

interface PendingItem {
  menuItem: MenuItem;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
}

const NewOrderDialog = ({ isOpen, onClose, onAddOrder }: NewOrderDialogProps) => {
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();

  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requiresSauce || menuItem.isCombo || menuItem.category === 'mains' || menuItem.category === 'value') {
      setPendingItem({ menuItem, addons: [], spicy: false });
    } else {
      addFinalItem({ menuItem, quantity: 1, addons: [], spicy: false });
    }
  };

  const addFinalItem = (item: OrderItem) => {
    setSelectedItems(prev => {
      const existingIndex = prev.findIndex(existing => 
        existing.menuItem.id === item.menuItem.id &&
        existing.sauce === item.sauce &&
        existing.sauceCup === item.sauceCup &&
        existing.drink === item.drink &&
        JSON.stringify(existing.addons) === JSON.stringify(item.addons) &&
        existing.spicy === item.spicy &&
        existing.remarks === item.remarks
      );
      
      if (existingIndex >= 0) {
        return prev.map((existing, index) =>
          index === existingIndex
            ? { ...existing, quantity: existing.quantity + 1 }
            : existing
        );
      }
      return [...prev, item];
    });
  };

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    
    const requiredSauce = pendingItem.menuItem.requiresSauce && pendingItem.menuItem.category !== 'value' && !pendingItem.sauce;
    const requiredDrink = (pendingItem.menuItem.isCombo || pendingItem.menuItem.name.includes('Meal')) && !pendingItem.drink;
    
    if (requiredSauce || requiredDrink) return;

    // Calculate add-on price
    const addonPrice = pendingItem.addons.reduce((total, addon) => {
      const addonOption = addOnOptions.find(option => option.name === addon);
      return total + (addonOption?.price || 0);
    }, 0);

    const finalPrice = pendingItem.menuItem.price + addonPrice;

    addFinalItem({
      menuItem: { ...pendingItem.menuItem, price: finalPrice },
      quantity: 1,
      sauce: pendingItem.sauce,
      sauceCup: pendingItem.sauceCup,
      drink: pendingItem.drink,
      addons: pendingItem.addons,
      spicy: pendingItem.spicy,
      remarks: pendingItem.remarks
    });
    
    setPendingItem(null);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setSelectedItems(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedItems(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + (item.menuItem.price * item.quantity),
    0
  );

  const handleCreateOrder = () => {
    if (selectedItems.length === 0) return;
    setShowPaymentDialog(true);
  };

  const handleConfirmOrder = async (paymentMode: PaymentMode) => {
    try {
      // Check app version before submitting order
      const { error } = await supabase.functions.invoke('version-check', {
        headers: {
          'x-app-version': '3'
        }
      });

      if (error) {
        toast({
          title: "Update Required",
          description: "A mandatory update is required. Please install the new version.",
          variant: "destructive"
        });
        return;
      }

      const newOrder: Order = {
        id: Date.now().toString(),
        orderNumber: getNextOrderNumber(),
        timestamp: new Date(),
        items: selectedItems,
        totalPrice,
        status: 'preparing',
        paymentMode: paymentMode
      };

      onAddOrder(newOrder);
      setSelectedItems([]);
      setPendingItem(null);
      setShowPaymentDialog(false);
      onClose();
    } catch (error) {
      toast({
        title: "Update Required",
        description: "A mandatory update is required. Please install the new version.",
        variant: "destructive"
      });
    }
  };

  const categorizedItems = {
    value: menuItems.filter(item => item.category === 'value'),
    mains: menuItems.filter(item => item.category === 'mains'),
    sides: menuItems.filter(item => item.category === 'sides'),
    sauces: menuItems.filter(item => item.category === 'sauces'),
    drinks: menuItems.filter(item => item.category === 'drinks'),
    addons: menuItems.filter(item => item.category === 'addons')
  };

  const categoryTitles = {
    value: 'Value Burgers',
    mains: 'Burgers & Wraps',
    sides: 'Bites & Sides',
    sauces: 'Sauces',
    drinks: 'Drinks',
    addons: 'Add-ons'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            New Order
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu Items */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Menu</h3>
            
            {Object.entries(categorizedItems).map(([category, items]) => (
              <MenuSection
                key={category}
                title={categoryTitles[category as keyof typeof categoryTitles]}
                items={items}
                onAddItem={addItemToOrder}
              />
            ))}
          </div>

          {/* Order Summary */}
          <OrderSummary
            selectedItems={selectedItems}
            pendingItem={pendingItem}
            totalPrice={totalPrice}
            onUpdateItemQuantity={updateItemQuantity}
            onUpdatePendingItem={setPendingItem}
            onConfirmPendingItem={confirmPendingItem}
            onCancelPendingItem={() => setPendingItem(null)}
            onCreateOrder={handleCreateOrder}
          />
        </div>
      </DialogContent>
      
      <PaymentModeDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handleConfirmOrder}
      />
    </Dialog>
  );
};

export default NewOrderDialog;
