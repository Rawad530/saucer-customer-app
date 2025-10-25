// src/components/OrderSummary.tsx (Corrected Title Logic)

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderItem as OrderItemType, PendingItem } from "@/types/order";
import OrderItem from "./OrderItem";
import ItemConfigurationCard from "./ItemConfigurationCard";
import { addOnOptions } from "@/data/menu"; // Assuming this exists and is correct
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Truck, Pencil } from "lucide-react"; // Make sure Pencil is used or remove it

interface OrderSummaryProps {
  selectedItems: OrderItemType[];
  pendingItem: PendingItem | null;
  subtotal: number;
  discountAmount: number;
  totalPrice: number; // This should be the final price including delivery fee
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
  appliedDiscount: boolean; // True if a discount > 0 is applied
  isPlacingOrder: boolean;
  onEditItem: (index: number) => void;
  walletBalance: number;
  useWallet: boolean; // Whether the user wants to use the wallet
  onUseWalletChange: (use: boolean) => void;
  walletCreditApplied: number; // The amount actually deducted from the wallet
  deliveryAddress?: string | null; // The address text, passed from OrderPage
  deliveryFee?: number; // The fee amount, passed from OrderPage
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
  deliveryAddress, // Use this prop
  deliveryFee,       // Use this prop
}: OrderSummaryProps) => {

  const isWalletDisabled = walletBalance <= 0;
  // Determine if it's a delivery order based on the presence of the address
  const isDelivery = !!deliveryAddress;

  return (
    <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
       {/* --- Corrected Title --- */}
      <h3 className="text-xl font-semibold text-amber-400">
        {isDelivery ? "Delivery Order Summary" : "Pick-up Order Summary"}
      </h3>
       {/* --- End Title --- */}


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
          {/* --- Corrected Delivery Address Box --- */}
          {isDelivery && deliveryAddress && (
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
          {/* --- End Delivery Address Box --- */}


          {/* Item List */}
          <div className="space-y-3 max-h-[calc(100vh-35rem)] overflow-y-auto pr-2"> {/* Adjust max-h if needed */}
            {selectedItems.map((item, index) => (
              <OrderItem
                key={index}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateItemQuantity}
                onEdit={onEditItem}
                addOnOptions={addOnOptions} // Ensure addOnOptions is available/imported
              />
            ))}
          </div>

          {/* Promo Code */}
          <div className="border-t border-b border-gray-700 py-4 space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Promo Code"
                className="bg-gray-700 border-gray-600 text-white"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={appliedDiscount} // Disable if discount already applied
              />
              <Button
                onClick={handleApplyPromoCode}
                disabled={isCheckingPromo || appliedDiscount} // Disable if checking or already applied
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

          {/* Wallet Toggle */}
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

          {/* Totals Section */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-md">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-gray-400">₾{subtotal.toFixed(2)}</span>
            </div>

            {appliedDiscount && discountAmount > 0 && ( // Also check discountAmount > 0
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Discount:</span>
                <span>- ₾{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* --- Corrected Delivery Fee Display --- */}
            {isDelivery && deliveryFee > 0 && (
              <div className="flex justify-between items-center text-md text-gray-300">
                <span>Delivery Fee:</span>
                <span>₾{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {/* --- End Delivery Fee --- */}


            {useWallet && walletCreditApplied > 0 && (
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Wallet Credit:</span>
                <span>- ₾{walletCreditApplied.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-white">Total:</span>
              <span className="text-amber-500">₾{totalPrice.toFixed(2)}</span>
            </div>
          </div>

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