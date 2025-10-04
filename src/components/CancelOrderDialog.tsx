
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Order } from '@/types/order';

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | null;
}

const CancelOrderDialog = ({ isOpen, onClose, onConfirm, order }: CancelOrderDialogProps) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Order #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Are you sure you want to cancel this order? This action cannot be undone.
            The order will be removed from the preparing queue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 rounded-lg p-4 my-4">
          <h4 className="font-medium text-gray-700 mb-2">Order Details:</h4>
          <div className="space-y-1 text-sm">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.menuItem.name} x{item.quantity}</span>
                <span>₾{(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-1 mt-2 font-medium">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>₾{order.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Keep Order
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderDialog;
