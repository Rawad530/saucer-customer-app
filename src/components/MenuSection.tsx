// src/components/MenuSection.tsx

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

const MenuSection = ({ title, items, onAddItem }: MenuSectionProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-amber-400 mb-4 capitalize">
        {title}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(item => (
          <Card key={item.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                
                {item.image_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 rounded-md object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </DialogTrigger>
                    
                    {/* --- MODIFIED DIALOGCONTENT STRUCTURE --- */}
                    <DialogContent 
                      // Keeping a wide max-width for the overall dialog
                      className="max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 bg-transparent border-none shadow-none"
                    >
                      {/* This div will ensure the image always takes precedence at the top */}
                      <div className="flex flex-col w-full">
                        {/* The Image itself, now taking full width of the dialog's content area */}
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-auto rounded-lg object-cover max-h-[80vh] sm:max-h-[70vh] md:max-h-[65vh] lg:max-h-[60vh]"
                        />
                        
                        {/* Details block, placed BELOW the image */}
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mt-4 mx-2 sm:mx-0"> {/* Added margin for spacing, and background/padding */}
                          <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                          {item.description && (
                            <p className="text-gray-300 text-base mb-4">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                            <p className="text-amber-400 font-bold text-xl">₾{item.price.toFixed(2)}</p>
                            <Button
                              onClick={() => {
                                onAddItem(item);
                                // If you want the dialog to close automatically after adding to order:
                                // document.getElementById('dialog-close-button')?.click(); // This is a hacky way, better to use state from a parent
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <Plus className="h-5 w-5 mr-2" /> Add to Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                    {/* --- END OF MODIFIED DIALOGCONTENT STRUCTURE --- */}
                  </Dialog>
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
        ))}
      </div>
    </div>
  );
};

export default MenuSection;