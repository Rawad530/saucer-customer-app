import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OrderItem as OrderItemType } from "@/types/order";
import OrderItem from "./OrderItem";
import ItemConfigurationCard from "./ItemConfigurationCard";
import { MenuItem } from "@/types/order";
import { addOnOptions } from "@/data/menu";
import React from "react";

// --- THIS INTERFACE IS NOW CORRECTED ---
interface PendingItem {
  menuItem: MenuItem;
  quantity: number; // This was missing
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
  discount?: number;
}
// --- END OF CORRECTION ---

interface OrderSummaryProps {
  selectedItems: OrderItemType[];
  pendingItem: PendingItem | null;
  subtotal: number;
  promoDiscountAmount: number;
  totalPrice: number;
  onUpdateItemQuantity: (index: number, newQuantity: number) => void;
  onUpdatePendingItem: React.Dispatch<React.SetStateAction<PendingItem | null>>;
  onConfirmPendingItem: () => void;
  onCancelPendingItem: () => void;
  onProceedToPayment: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  handleApplyPromoCode: () => void;
  promoMessage: string;
  isCheckingPromo: boolean;
  appliedDiscount: boolean;
  isPlacingOrder: boolean;
  onEditItem: (index: number) => void;
  walletBalance: number;
  useWallet: boolean;
  setUseWallet: (value: boolean) => void;
  walletAmountApplied: number;
}

const OrderSummary = ({
  selectedItems, pendingItem, subtotal, promoDiscountAmount, totalPrice,
  onUpdateItemQuantity, onUpdatePendingItem, onConfirmPendingItem, onCancelPendingItem,
  onProceedToPayment, promoCode, setPromoCode, handleApplyPromoCode,
  promoMessage, isCheckingPromo, appliedDiscount, isPlacingOrder, onEditItem,
  walletBalance, useWallet, setUseWallet, walletAmountApplied
}: OrderSummaryProps) => {
  return (
    <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-amber-400">Order Summary</h3>
      
      {pendingItem && (
        <ItemConfigurationCard
          pendingItem={pendingItem}
          onUpdatePendingItem={onUpdatePendingItem}
          onConfirm={onConfirmPendingItem}
          onCancel={onCancelPendingItem}
        />
      )}

      {selectedItems.length === 0 && !pendingItem ? (
        <p className="text-gray-400 text-center py-8">Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {selectedItems.map((item, index) => (
              <OrderItem
                key={`${item.menuItem.id}-${index}`}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateItemQuantity}
                onEdit={onEditItem}
                addOnOptions={addOnOptions}
              />
            ))}
          </div>

          <div className="border-t border-b border-gray-700 py-4 space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Promo Code"
                className="bg-gray-700 border-gray-600 text-white"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={appliedDiscount}
              />
              <Button
                onClick={handleApplyPromoCode}
                disabled={isCheckingPromo || appliedDiscount}
                className="bg-gray-600 hover:bg-gray-500"
              >
                {isCheckingPromo ? "..." : "Apply"}
              </Button>
            </div>
            {promoMessage && (
              <p className={`text-sm ${promoMessage.startsWith('Success') ? 'text-green-400' : 'text-red-400'}`}>
                {promoMessage}
              </p>
            )}
          </div>

          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-wallet" className="flex flex-col cursor-pointer">
                <span className="font-medium text-white">Use Wallet Balance</span>
                <span className="text-sm text-gray-400">Available: ₾{walletBalance.toFixed(2)}</span>
              </Label>
              <Switch
                id="use-wallet"
                checked={useWallet}
                onCheckedChange={setUseWallet}
                disabled={walletBalance <= 0}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-md">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-gray-400">₾{subtotal.toFixed(2)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Promo Discount:</span>
                <span>- ₾{promoDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {useWallet && walletAmountApplied > 0 && (
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Wallet Credit:</span>
                <span>- ₾{walletAmountApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-white">Total:</span>
              <span className="text-amber-500">₾{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={onProceedToPayment}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
            disabled={selectedItems.length === 0 || isPlacingOrder}
          >
            {isPlacingOrder ? "Processing..." : `Pay ${totalPrice > 0 ? '₾' + totalPrice.toFixed(2) : 'with Wallet'}`}
          </Button>
        </>
      )}
    </div>
  );
};

export default OrderSummary;