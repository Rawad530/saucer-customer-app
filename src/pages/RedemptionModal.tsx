// src/pages/RedemptionModal.tsx

import QRCode from "react-qr-code";

interface Reward {
  id: number;
  title: string;
}

interface RedemptionModalProps {
  reward: Reward | null;
  customerId: string;
  onClose: () => void;
}

const RedemptionModal = ({ reward, customerId, onClose }: RedemptionModalProps) => {
  if (!reward) return null;

  // This creates a JSON string with all the info the POS scanner will need
  const qrCodeValue = JSON.stringify({
    type: 'REDEEM_REWARD',
    customerId: customerId,
    rewardId: reward.id,
  });

  return (
    // This creates the modal overlay
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
    >
      {/* This is the modal content */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 p-8 rounded-lg shadow-xl text-center"
      >
        <h2 className="text-2xl font-bold mb-2">Redeem Reward</h2>
        <p className="text-lg text-amber-400 font-semibold mb-4">{reward.title}</p>
        <p className="text-gray-400 mb-4">Have your cashier scan this code to redeem.</p>
        
        <div className="bg-white p-4 rounded-md">
          <QRCode value={qrCodeValue} size={256} viewBox={`0 0 256 256`} />
        </div>

        <button 
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default RedemptionModal;