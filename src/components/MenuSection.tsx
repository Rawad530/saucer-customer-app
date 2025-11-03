// src/components/MenuSection.tsx (Fixed)

import { useState } from "react"; // <-- IMPORT useState
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MenuItem } from "@/types/order";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

// --- FIX: This component now needs to be separate to manage its own state ---
const MenuItemCard = ({ item, onAddItem }: { item: MenuItem, onAddItem: (item: MenuItem) => void }) => {
  // We add a state to control *this specific* popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          
          {item.image_url && (
            // --- MODIFIED: The Dialog now uses our state ---
            <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
              <DialogTrigger asChild>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-24 h-24 rounded-md object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </DialogTrigger>
              
              <DialogContent 
                className="max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 bg-transparent border-none shadow-none"
              >
                <div className="flex flex-col w-full">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-auto rounded-lg object-cover max-h-[80vh] sm:max-h-[70vh] md:max-h-[65vh] lg:max-h-[60vh]"
                  />
                  
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mt-4 mx-2 sm:mx-0">
                    <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-300 text-base mb-4">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <p className="text-amber-400 font-bold text-xl">₾{item.price.toFixed(2)}</p>
                      
                      {/* --- FIX: This button now closes the popup on click --- */}
                      <Button
                        onClick={() => {
                          onAddItem(item);
                          setIsPopupOpen(false); // <-- This closes the popup
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Plus className="h-5 w-5 mr-2" /> Add to Order
                      </Button>
                      {/* --- END FIX --- */}

                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            // --- END MODIFICATION ---
          )}

          <div className="flex-grow flex justify-between items-center">
            <div>
              <h5 className="font-semibold text-white">{item.name}</h5>
              <p className="text-amber-500 font-bold">₾{item.price.toFixed(2)}</p>
            </div>
            <Button
              onClick={() => onAddItem(item)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
// --- END NEW COMPONENT ---


const MenuSection = ({ title, items, onAddItem }: MenuSectionProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-400 mb-4 capitalize">
        {title}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(item => (
          // --- MODIFIED: Use the new component ---
          <MenuItemCard 
            key={item.id} 
            item={item} 
            onAddItem={onAddItem} 
          />
          // --- END MODIFICATION ---
        ))}
      </div>
    </div>
  );
};

export default MenuSection;