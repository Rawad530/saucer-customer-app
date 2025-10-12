// src/components/MenuSection.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MenuItem } from "@/types/order";
// Import Dialog components
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
          <Card key={item.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors flex">
            <CardContent className="p-4 flex-grow">
              <div className="flex items-start gap-4 h-full">
                
                {/* --- Image Zoom Implementation --- */}
                {item.image_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      {/* The thumbnail acts as the trigger */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 rounded-md object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </DialogTrigger>
                    {/* The Dialog Content (Zoomed Image) */}
                    <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-3xl">
                      <img src={item.image_url} alt={item.name} className="w-full h-auto rounded-lg" />
                    </DialogContent>
                  </Dialog>
                )}
                {/* --- End of Image Zoom Implementation --- */}

                {/* This container will now hold both the top row and the description below it */}
                <div className="flex-grow flex flex-col">
                  {/* This top row keeps the name/price and button aligned */}
                  <div className="flex justify-between items-start">
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

                  {/* This conditionally renders the description if it exists */}
                  {item.description && (
                    <p className="text-sm text-gray-400 mt-2 pr-2">
                      {item.description}
                    </p>
                  )}
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