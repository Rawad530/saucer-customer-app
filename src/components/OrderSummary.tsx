import { Button } from "@/components/ui/button";
import { OrderItem as OrderItemType } from "@/types/order";
import OrderItem from "./OrderItem";
import ItemConfigurationCard from "./ItemConfigurationCard";
import { MenuItem } from "@/types/order";

interface PendingItem {
  menuItem: MenuItem;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
}

interface OrderSummaryProps {
  selectedItems: OrderItemType[];
  pendingItem: PendingItem | null;
  totalPrice: number;
  onUpdateItemQuantity: (index: number, newQuantity: number) => void;
  onUpdatePendingItem: (updater: (prev: PendingItem | null) => PendingItem | null) => void;
  onConfirmPendingItem: () => void;
  onCancelPendingItem: () => void;
  onCreateOrder: () => void;
}

const OrderSummary = ({
  selectedItems,
  pendingItem,
  totalPrice,
  onUpdateItemQuantity,
  onUpdatePendingItem,
  onConfirmPendingItem,
  onCancelPendingItem,
  onCreateOrder
}: OrderSummaryProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Order Summary</h3>
      
      {/* Pending Item Configuration */}
      {pendingItem && (
        <ItemConfigurationCard
          pendingItem={pendingItem}
          onUpdatePendingItem={onUpdatePendingItem}
          onConfirm={onConfirmPendingItem}
          onCancel={onCancelPendingItem}
        />
      )}

      {selectedItems.length === 0 && !pendingItem ? (
        <p className="text-gray-500 text-center py-8">No items selected</p>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedItems.map((item, index) => (
              <OrderItem
                key={index}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateItemQuantity}
              />
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span className="text-orange-600">₾{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={onCreateOrder}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 text-lg font-semibold"
            disabled={selectedItems.length === 0}
          >
            Select Payment Mode
          </Button>
        </>
      )}
    </div>
  );
};

export default OrderSummary;
