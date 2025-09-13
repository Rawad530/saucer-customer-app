import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MenuItem } from "@/types/order";

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
                {/* 1. Image Display: An image tag is added here. */}
                {/* It will only appear if 'item.image_url' exists. */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 rounded-md object-cover"
                  />
                )}
                {/* 2. Layout Adjustment: The text and button now grow to fill the remaining space. */}
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