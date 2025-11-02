// src/components/GuestOrderTypeDialog.tsx

import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'; // Assuming this is your dialog component path
import { Button } from '@/components/ui/button';
import { Truck, ShoppingBag } from 'lucide-react';

interface GuestOrderTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuestOrderTypeDialog = ({ isOpen, onClose }: GuestOrderTypeDialogProps) => {
  const navigate = useNavigate();

  const handlePickUp = () => {
    onClose();
    navigate('/order');
  };

  const handleDelivery = () => {
    onClose();
    navigate('/delivery-location');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-amber-400">
            How would you like to order?
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Please choose an option to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Delivery Button */}
          <Button
            onClick={handleDelivery}
            className="flex flex-col h-32 text-lg bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Truck className="w-10 h-10 mb-2" />
            Delivery
          </Button>

          {/* Pick-up Button */}
          <Button
            onClick={handlePickUp}
            className="flex flex-col h-32 text-lg bg-gray-600 hover:bg-gray-500 text-white"
          >
            <ShoppingBag className="w-10 h-10 mb-2" />
            Pick-up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestOrderTypeDialog;