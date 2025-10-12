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
                    
                    <DialogContent 
                      // --- MODIFIED LINE 1: Increased max-width of the dialog itself ---
                      className="max-w-2xl md:max-w-3xl lg:max-w-4xl p-6 bg-gray-900 border-gray-700 rounded-lg"
                    >
                      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Image on one side (or top on small screens) */}
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          // --- MODIFIED LINE 2: Increased image width within the dialog ---
                          className="w-full md:w-3/5 lg:w-2/3 h-auto rounded-lg object-cover max-h-96" // Changed md:w-1/2 to md:w-3/5, added lg:w-2/3, and max-h-80 to max-h-96
                        />
                        {/* Details on the other side (or bottom on small screens) */}
                        <div className="flex flex-col justify-between flex-grow w-full md:w-2/5 lg:w-1/3"> {/* Adjusted md:w-1/2 to md:w-2/5 and added lg:w-1/3 */}
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-300 text-base mb-4">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700">
                            <p className="text-amber-400 font-bold text-xl">₾{item.price.toFixed(2)}</p>
                            <Button
                              onClick={() => {
                                onAddItem(item);
                                // You might want to close the dialog after adding to cart
                                // This requires setting up state or using a context
                                // For now, we'll leave it open unless you implement a close function
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <Plus className="h-5 w-5 mr-2" /> Add to Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
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