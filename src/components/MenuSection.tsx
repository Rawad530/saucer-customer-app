// src/components/MenuSection.tsx -- Focus on the DialogContent

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
                    {/* --- START OF MODIFIED DIALOGCONTENT --- */}
                    <DialogContent className="max-w-xl md:max-w-2xl lg:max-w-3xl p-6 bg-gray-900 border-gray-700 rounded-lg">
                      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Image on one side (or top on small screens) */}
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full md:w-1/2 h-auto rounded-lg object-cover max-h-80" 
                        />
                        {/* Details on the other side (or bottom on small screens) */}
                        <div className="flex flex-col justify-between flex-grow w-full md:w-1/2">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-300 text-base mb-4">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700">
                            <p className="text-amber-400 font-bold text-xl">₾{item.price.toFixed(2)}</p>
                            {/* Optionally, add an "Add to Cart" button directly in the dialog */}
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
                    {/* --- END OF MODIFIED DIALOGCONTENT --- */}
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