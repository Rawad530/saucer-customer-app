import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMode } from "@/types/order";
import { useState } from "react";

interface PaymentModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMode: PaymentMode) => void;
}

const PaymentModeDialog = ({ isOpen, onClose, onConfirm }: PaymentModeDialogProps) => {
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode | "">("");

  const handleConfirm = () => {
    if (selectedPaymentMode) {
      onConfirm(selectedPaymentMode as PaymentMode);
      setSelectedPaymentMode("");
    }
  };

  const handleClose = () => {
    setSelectedPaymentMode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Payment Mode</DialogTitle>
          <DialogDescription>
            Choose the payment method for this order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Select value={selectedPaymentMode} onValueChange={(value) => setSelectedPaymentMode(value as PaymentMode | "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Card - Terminal">Card - Terminal</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedPaymentMode}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Confirm Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModeDialog;