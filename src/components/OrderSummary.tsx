// src/components/OrderSummary.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderItem as OrderItemType } from "@/types/order"; 
import OrderItem from "./OrderItem";
import { addOnOptions, bunOptions } from "@/data/menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, Pencil, Gift } from "lucide-react";

interface OrderSummaryProps {
  selectedItems: OrderItemType[];
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  onUpdateItemQuantity: (index: number, newQuantity: number) => void;
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
  deliveryAddress?: string | null;
  deliveryFee?: number;
  paymentMethod: 'card' | 'transfer' | 'shop';
  setPaymentMethod: (method: 'card' | 'transfer' | 'shop') => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  isRestaurantOpen: boolean | null; 
  userPoints?: number; 
  availableRewards?: any[]; 
  onAddReward?: (reward: any) => void; 
}

const OrderSummary = ({
  selectedItems,
  subtotal,
  discountAmount,
  totalPrice,
  onUpdateItemQuantity,
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
  deliveryAddress,
  deliveryFee,
  paymentMethod,
  setPaymentMethod,
  customerPhone,
  setCustomerPhone,
  isRestaurantOpen,
  userPoints,
  availableRewards,
  onAddReward
}: OrderSummaryProps) => {

  const isWalletDisabled = walletBalance <= 0;
  const isDelivery = !!deliveryAddress;

  return (
    <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-amber-400">
        {isDelivery ? "Delivery Order Summary" : "Pick-up Order Summary"}
      </h3>

      {/* --- THE BLINGING REWARD BANNER --- */}
      {availableRewards && userPoints !== undefined && availableRewards.length > 0 && userPoints > 0 && (
        <div className="my-4 bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg p-4 shadow-lg border border-amber-400 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-white text-amber-600 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
            {userPoints} Pts Available
          </div>
          <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 animate-pulse" /> Unlock a Free Reward!
          </h4>
          <div className="space-y-2">
            {availableRewards
              .filter(r => userPoints >= r.points_required)
              .map(reward => (
                <div key={reward.id} className="flex justify-between items-center bg-black/20 p-2 rounded-md">
                  <div>
                    <p className="text-white font-semibold text-sm">{reward.title}</p>
                    <p className="text-amber-100 text-xs">{reward.points_required} Points</p>
                  </div>
                  <Button
                    onClick={() => onAddReward && onAddReward(reward)}
                    size="sm"
                    className="bg-white text-amber-600 hover:bg-gray-100 font-bold h-8"
                  >
                    Add Free
                  </Button>
                </div>
            ))}
            {availableRewards.filter(r => userPoints >= r.points_required).length === 0 && (
               <p className="text-sm text-amber-100 font-medium">Keep earning points to unlock more!</p>
            )}
          </div>
        </div>
      )}

      {selectedItems.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Your cart is empty</p>
      ) : (
        <>
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

          <div className="space-y-3 pr-2">
            {selectedItems.map((item, index) => (
              <OrderItem
                key={index}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateItemQuantity}
                onEdit={onEditItem}
                addOnOptions={addOnOptions}
                bunOptions={bunOptions}
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

          <div className="border-b border-gray-700 pb-4 space-y-3">
            {totalPrice > 0 ? (
              <>
                <Label className="text-gray-300 font-medium block">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="card" id="pm-card" className="text-amber-500 border-gray-500 mt-1" />
                    <div className="flex flex-col">
                      <Label htmlFor="pm-card" className="text-gray-200 cursor-pointer">Card / Apple Pay / Google Pay</Label>
                      <span className="text-xs text-gray-400 italic mt-1 leading-snug">
                        (You will be securely redirected to Bank of Georgia online payment. We do not retain any payment or card details.)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transfer" id="pm-transfer" className="text-amber-500 border-gray-500" />
                    <Label htmlFor="pm-transfer" className="text-gray-200 cursor-pointer">Bank Transfer</Label>
                  </div>
                  {!isDelivery && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shop" id="pm-shop" className="text-amber-500 border-gray-500" />
                      <Label htmlFor="pm-shop" className="text-gray-200 cursor-pointer">Pay at Counter</Label>
                    </div>
                  )}
                </RadioGroup>

                {paymentMethod === 'transfer' && (
                   <div className="bg-gray-900 p-4 rounded-md border border-gray-700 space-y-2 mt-2">
                       <p className="text-sm text-amber-400 font-bold">Bank of Georgia (BOG)</p>
                       <p className="text-xs text-gray-300 font-mono">IBAN: GE92BG0000000607340404</p>
                       <p className="text-xs text-gray-300">Name: I/E Ahmad Jalwan</p>
                       <div className="pt-2 border-t border-gray-700 mt-2">
                         <p className="text-xs text-gray-400 leading-relaxed">
                           1. Transfer the total amount.<br/>
                           2. Click "Confirm and Place Order".<br/>
                           3. A button will appear to send your receipt via WhatsApp.
                         </p>
                       </div>
                   </div>
                )}

                {(paymentMethod === 'shop' || paymentMethod === 'transfer') && (
                   <div className="bg-gray-900 p-4 rounded-md border border-gray-700 space-y-2 mt-2">
                       <p className="text-sm text-amber-400 font-bold">Phone Verification</p>
                       <p className="text-xs text-gray-300 leading-snug">We require a valid phone number to call and confirm this order.</p>
                       <Input
                           placeholder="e.g., +995 591 92 06 65"
                           value={customerPhone}
                           onChange={(e) => setCustomerPhone(e.target.value)}
                           className="bg-gray-800 border-gray-600 focus:border-amber-500 text-white mt-1 h-9 text-sm"
                       />
                   </div>
                )}
              </>
            ) : (
              <div className="bg-green-900/30 border border-green-500 p-3 rounded-md">
                <p className="text-green-400 font-bold flex items-center gap-2">
                  ✓ Full amount covered by Wallet Balance
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-md">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-gray-400">₾{subtotal.toFixed(2)}</span>
            </div>

            {appliedDiscount && discountAmount > 0 && (
              <div className="flex justify-between items-center text-md text-green-400">
                <span>Discount:</span>
                <span>- ₾{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {isDelivery && deliveryFee > 0 && (
              <div className="flex justify-between items-center text-md text-gray-300">
                <span>Delivery Fee:</span>
                <span>₾{deliveryFee.toFixed(2)}</span>
              </div>
            )}

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

          <Button
            onClick={onProceedToPayment}
            className={`w-full py-3 text-lg font-semibold mt-2 ${
              isRestaurantOpen === false 
                ? 'bg-gray-600 hover:bg-gray-600 text-gray-300 cursor-not-allowed' 
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
            disabled={selectedItems.length === 0 || isPlacingOrder || isRestaurantOpen === false}
          >
            {isRestaurantOpen === false 
              ? "Restaurant Closed" 
              : isPlacingOrder 
                ? "Processing..." 
                : "Confirm and Place Order"}
          </Button>
        </>
      )}
    </div>
  );
};

export default OrderSummary;