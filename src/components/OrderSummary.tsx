import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderItem as OrderItemType, PendingItem } from "@/types/order";
import OrderItem from "./OrderItem";
import ItemConfigurationCard from "./ItemConfigurationCard";
import { addOnOptions } from "@/data/menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Truck, Pencil } from "lucide-react";

interface OrderSummaryProps {
  selectedItems: OrderItemType[];
  pendingItem: PendingItem | null;
  subtotal: number;
  discountAmount: number;
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
  onUseWalletChange: (use: boolean) => void;
  walletCreditApplied: number;
  isDeliveryOrder?: boolean;
  deliveryAddress?: string | null;
  // --- CHANGE 1: Add new prop for the fee ---
  deliveryFee?: number;
}

const OrderSummary = ({
  selectedItems,
  pendingItem,
  subtotal,
  discountAmount,
  totalPrice,
  onUpdateItemQuantity,
  onUpdatePendingItem,
  onConfirmPendingItem,
  onCancelPendingItem,
  onProceedToPayment,
  promoCode,
  setPromoCode,
  handleApplyPromoCode,
  promoMessage,
  isCheckingPromo,
  appliedDiscount,
  isPlacingOrder,
  onEditItem,
  walletBalance,
  useWallet,
  onUseWalletChange,
  walletCreditApplied,
  isDeliveryOrder,
  deliveryAddress,
  // --- CHANGE 2: Destructure the new prop ---
  deliveryFee,
}: OrderSummaryProps) => {

  const isWalletDisabled = walletBalance <= 0;

  return (
    // Removed overflow/max-height - scrolling is handled by parent now
    <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-amber-400">
        {isDeliveryOrder ? "Delivery Order Summary" : "Pick-up Order Summary"}
      </h3>

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
          {isDeliveryOrder && deliveryAddress && (
            <div className="p-3 bg-blue-900/40 border border-blue-700 rounded-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-300"/>
                        <span className="text-sm font-medium text-blue-200">Delivering To:</span>
                    </div>
                     <Link to="/delivery-location" className="text-xs text-blue-300 hover:text-blue-100 underline flex items-center gap-1">
                        <Pencil className="w-3 h-3"/> Change
                     </Link>
                </div>
                <p className="text-sm text-gray-300 pl-6">{deliveryAddress}</p>
            </div>
          )}

          {/* Item List with its own internal scroll */}
          <div className="space-y-3 max-h-[calc(100vh-35rem)] overflow-y-auto pr-2">
            {selectedItems.map((item, index) => (
              <OrderItem
                key={index}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateItemQuantity}
                onEdit={onEditItem}
                addOnOptions={addOnOptions}
              />
            ))}
          </div>

          {/* Promo Code section */}
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

          {/* Wallet Toggle section */}
          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-wallet" className={`flex flex-col ${isWalletDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className="font-medium">Use Wallet Balance</span>
                <span className="text-sm text-gray-400">Available: ₾{walletBalance.toFixed(2)}</span>
              </Label>
              <Switch
                id="use-wallet"
                checked={useWallet}
                onCheckedChange={onUseWalletChange}
                disabled={isWalletDisabled}
              />
            </div>
          </div>

          {/* --- CHANGE 3: MODIFIED TOTALS SECTION --- */}
          <div className="space-y-2 pt-2">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-md">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-gray-400">₾{subtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount (if applied) */}
            {appliedDiscount && (
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Discount:</span>
                <span>- ₾{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* --- ADDED DELIVERY FEE LINE ITEM --- */}
            {isDeliveryOrder && deliveryFee > 0 && (
              <div className="flex justify-between items-center text-md text-gray-300">
                <span>Delivery Fee:</span>
                <span>₾{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {/* --- END DELIVERY FEE --- */}

            {/* Wallet Credit (if applied) */}
            {useWallet && walletCreditApplied > 0 && (
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Wallet Credit:</span>
                <span>- ₾{walletCreditApplied.toFixed(2)}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-white">Total:</span>
              <span className="text-amber-500">₾{totalPrice.toFixed(2)}</span>
            </div>
          </div>
          {/* --- END MODIFIED TOTALS SECTION --- */}

          {/* Confirm Button */}
          <Button
            onClick={onProceedToPayment}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
            disabled={selectedItems.length === 0 || isPlacingOrder}
          >
            {isPlacingOrder ? "Processing..." : `Confirm and Pay ₾${totalPrice.toFixed(2)}`}
          </Button>
        </>
      )}
    </div>
  );
};

export default OrderSummary;