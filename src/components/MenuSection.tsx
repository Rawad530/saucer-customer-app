
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
      <h4 className="text-lg font-medium text-gray-700 mb-3 capitalize">
        {title}
      </h4>
      <div className="grid gap-3">
        {items.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium text-gray-800">{item.name}</h5>
                  <p className="text-orange-600 font-semibold">₾{item.price.toFixed(2)}</p>
                </div>
                <Button
                  onClick={() => onAddItem(item)}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuSection;
