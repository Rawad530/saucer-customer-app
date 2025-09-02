
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
import { Trash2 } from 'lucide-react';
import { Order } from '@/types/order';

interface DeleteOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | null;
}

const DeleteOrderDialog = ({ isOpen, onClose, onConfirm, order }: DeleteOrderDialogProps) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Order #{order.orderNumber}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Are you sure you want to permanently delete this order from history? 
            This action cannot be undone and will remove all record of this order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 rounded-lg p-4 my-4">
          <h4 className="font-medium text-gray-700 mb-2">Order Details:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{order.timestamp.toLocaleDateString()} {order.timestamp.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="capitalize">{order.status}</span>
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.menuItem.name} x{item.quantity}</span>
                <span>₾{(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-1 mt-2 font-medium">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>₾{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrderDialog;
