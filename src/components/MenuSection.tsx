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
      {/* Changed to flexbox for better control, allowing items to wrap naturally */}
      {/* Added `gap-4` for spacing between items */}
      {/* Changed to `grid` for more responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> 
        {items.map(item => (
          <Card 
            key={item.id} 
            // Removed `flex` from Card to let it size naturally within the grid
            className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors"
          >
            {/* Reduced padding and made it a flex container to arrange image and text horizontally */}
            <CardContent className="p-3 flex items-start gap-3"> {/* Adjusted padding to p-3, gap-3 */}
              
              {/* --- Image Zoom Implementation --- */}
              {item.image_url && (
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      // Reduced image size for a more compact look
                      className="w-20 h-20 rounded-md object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity" // Changed w-24 h-24 to w-20 h-20
                    />
                  </DialogTrigger>
                  <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-3xl">
                    <img src={item.image_url} alt={item.name} className="w-full h-auto rounded-lg" />
                  </DialogContent>
                </Dialog>
              )}
              {/* --- End of Image Zoom Implementation --- */}

              {/* Flex-grow to take remaining space, flex-col for stacking name/price/description */}
              <div className="flex-grow flex flex-col justify-between">
                {/* Top row: Name, Price, Add button */}
                <div className="flex justify-between items-start w-full mb-1"> {/* Added mb-1 for slight spacing to description */}
                  <div>
                    <h5 className="font-semibold text-white text-base leading-tight">{item.name}</h5> {/* Adjusted text-lg to text-base, added leading-tight */}
                    <p className="text-amber-500 font-bold text-sm">₾{item.price.toFixed(2)}</p> {/* Adjusted text-lg to text-sm */}
                  </div>
                  <Button
                    onClick={() => onAddItem(item)}
                    size="icon" // Changed size to "icon" for a smaller, square button
                    className="bg-amber-600 hover:bg-amber-700 shrink-0 h-8 w-8" // Explicitly set height/width
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description below name/price/button */}
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2"> {/* Adjusted text-sm to text-xs, mt-2 to mt-1. Added line-clamp-2 to limit description length. */}
                    {item.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuSection;