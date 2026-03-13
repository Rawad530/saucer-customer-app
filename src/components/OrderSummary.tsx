import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderItem as OrderItemType } from "@/types/order"; 
import OrderItem from "./OrderItem";
import { addOnOptions, bunOptions } from "@/data/menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Truck, Pencil, AlertTriangle, CheckCircle } from "lucide-react";

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
  currentUserId?: string; 
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
  currentUserId,
}: OrderSummaryProps) => {

  // --- TROLL TRAP LOGIC ---
  const COUSIN_ID = "5cb6780b-dbf3-4f1b-9956-39fcba1469f8";
  const MY_DUMMY_ID = "735bd252-d20e-4058-b0e8-d669a2747858"; 
  
  const isTarget = currentUserId === COUSIN_ID || currentUserId === MY_DUMMY_ID;

  const [showTrollTrap, setShowTrollTrap] = useState(false);
  const [trollStage, setTrollStage] = useState(0); 
  const [trollInput, setTrollInput] = useState("");
  // ------------------------

  const isWalletDisabled = walletBalance <= 0;
  const isDelivery = !!deliveryAddress;

  const handleToggleWallet = (checked: boolean) => {
    // THE PHANTOM CLICK: If it's him trying to turn it OFF
    if (isTarget && !checked) {
      setShowTrollTrap(true);
      return; // Execution stops. Parent state never changes. Toggle is visually stuck ON.
    }
    // Normal behavior for everyone else
    onUseWalletChange(checked);
  };

  return (
    <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-amber-400">
        {isDelivery ? "Delivery Order Summary" : "Pick-up Order Summary"}
      </h3>

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

          {/* Wallet Toggle */}
          <div className={`${showTrollTrap ? '' : 'border-b border-gray-700 pb-4'}`}>
            <div className="flex items-center justify-between">
              <Label htmlFor="use-wallet" className={`flex flex-col ${isWalletDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className="font-medium text-white">Use Wallet Balance</span>
                <span className="text-sm text-gray-400">Available: ₾{walletBalance.toFixed(2)}</span>
              </Label>
              <Switch
                id="use-wallet"
                checked={useWallet}
                onCheckedChange={handleToggleWallet}
                disabled={isWalletDisabled}
              />
            </div>
          </div>

          {/* --- THE TROLL TRAP MODAL --- */}
          {showTrollTrap && (
            <div className="mt-4 p-5 border border-red-900 bg-gray-900 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
              
              {/* Attempt 1 */}
              {trollStage === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-amber-400">Confirmation Required</h4>
                  </div>
                  <p className="text-sm text-gray-300">Are you absolutely sure you want to disable your wallet balance and pay with your own money?</p>
                  <Button 
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                    onClick={() => {
                      setShowTrollTrap(false);
                      setTrollStage(1);
                    }}
                  >
                    Yes, I am sure
                  </Button>
                </div>
              )}

              {/* Attempt 2 */}
              {trollStage === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-red-400">Anti-Fraud Verification</h4>
                  </div>
                  <p className="text-sm text-gray-300">Why did you call Rayan complaining about free money? Explain yourself in 50 words or more.</p>
                  <textarea 
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-red-500" 
                    rows={4}
                    placeholder="Type your explanation here..."
                    value={trollInput}
                    onChange={(e) => setTrollInput(e.target.value)}
                  />
                  <Button 
                    className="w-full bg-red-800 hover:bg-red-700 text-white"
                    onClick={() => {
                      // Let him pass regardless of what he typed (No word count check!)
                      setShowTrollTrap(false);
                      setTrollStage(2);
                      setTrollInput("");
                    }}
                  >
                    Submit Answer
                  </Button>
                </div>
              )}

              {/* Attempt 3 */}
              {trollStage === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-red-400">Final Verification</h4>
                  </div>
                  <p className="text-sm text-gray-300">Do you think this is a joke?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="bg-gray-700 hover:bg-gray-600"
                      onClick={() => { setShowTrollTrap(false); setTrollStage(3); }}
                    >
                      1. Yes
                    </Button>
                    <Button 
                      className="bg-gray-700 hover:bg-gray-600"
                      onClick={() => { setShowTrollTrap(false); setTrollStage(3); }}
                    >
                      2. Absolutely
                    </Button>
                  </div>
                </div>
              )}

              {/* Attempt 4 */}
              {trollStage === 3 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-amber-400">Okay, last one before we unlock your pay button.</h4>
                  <p className="text-sm text-gray-300">Who makes the best food in Tbilisi?</p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      className="bg-gray-700 hover:bg-gray-600"
                      onClick={() => setTrollStage(4)}
                    >
                      Saucer Burger and Wrap
                    </Button>
                    <Button 
                      className="bg-gray-700 hover:bg-gray-600"
                      onClick={() => setTrollStage(4)}
                    >
                      Obviously Saucer Burger and Wrap
                    </Button>
                  </div>
                </div>
              )}

              {/* The "Thank You" Infinite Loop Reset */}
              {trollStage === 4 && (
                <div className="space-y-4 text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h4 className="font-bold text-green-400 text-lg">Thank You!</h4>
                  <p className="text-sm text-gray-300">
                    We appreciate your cooperation. Your answers have been recorded. <br/><br/>
                    As a courtesy, your Saucer Wallet will remain <strong>permanently active</strong> for this transaction. Enjoy the free food.
                  </p>
                  <Button 
                    className="w-full mt-4 bg-gray-700 hover:bg-gray-600"
                    onClick={() => {
                      // INFINITE LOOP: Closes the modal, but resets the trap to stage 0
                      setShowTrollTrap(false);
                      setTrollStage(0); 
                    }}
                  >
                    Accept Fate & Close
                  </Button>
                </div>
              )}

            </div>
          )}
          {/* --- END TROLL TRAP --- */}

          {/* Totals Section */}
          <div className="space-y-2 pt-2 border-t border-gray-700">
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

            {isDelivery && deliveryFee !== undefined && deliveryFee > 0 && (
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