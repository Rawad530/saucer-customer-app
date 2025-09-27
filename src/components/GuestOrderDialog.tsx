// src/components/GuestOrderDialog.tsx

import { useState } from 'react';
// REMOVED: useNavigate is no longer needed here.
// import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// --- CHANGE 1: ADD 'onSubmit' TO THE PROPS ---
// This allows the parent page (OrderPage) to receive the data.
interface GuestOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { name: string; phone: string }) => void;
}

const GuestOrderDialog = ({ isOpen, onClose, onSubmit }: GuestOrderDialogProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // REMOVED: We don't need navigate here anymore.

  const handleContinue = () => {
    if (name.trim() && phone.trim()) {
      // --- CHANGE 2: THE COMPONENT'S LOGIC IS NOW SIMPLER ---
      // It no longer saves to localStorage or navigates.
      // It just sends the data up to the parent component using the new onSubmit prop.
      onSubmit({ name: name.trim(), phone: phone.trim() });
      onClose(); // We still close the dialog after submission
    } else {
      alert('Please provide both your name and phone number.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-amber-400">Order as Guest</DialogTitle>
          <DialogDescription className="text-gray-400">
            Please provide your name and phone number for pickup identification.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <DialogFooter>
          {/* --- CHANGE 3: UPDATED BUTTON TEXT FOR CLARITY --- */}
          <Button onClick={handleContinue} className="bg-amber-600 hover:bg-amber-700 w-full">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuestOrderDialog;