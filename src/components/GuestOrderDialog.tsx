// src/components/GuestOrderDialog.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface GuestOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuestOrderDialog = ({ isOpen, onClose }: GuestOrderDialogProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleContinue = () => {
    if (name.trim() && phone.trim()) {
      // Store guest information in localStorage
      const guestInfo = { name: name.trim(), phone: phone.trim() };
      localStorage.setItem('guest_info', JSON.stringify(guestInfo));
      
      // Navigate to the Order Page
      navigate('/order');
      onClose();
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
          <Button onClick={handleContinue} className="bg-amber-600 hover:bg-amber-700 w-full">
            Continue to Menu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuestOrderDialog;