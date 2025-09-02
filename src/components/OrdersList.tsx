
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Clock, CheckCircle } from "lucide-react";
import { Order } from "@/types/order";
import OrderStatusCard from "./OrderStatusCard";

interface OrdersListProps {
  orders: Order[];
  onCompleteOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
}

const OrdersList = ({ orders, onCompleteOrder, onCancelOrder }: OrdersListProps) => {
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const completedOrders = orders.filter(order => order.status === 'completed');

  if (orders.length === 0) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-8 text-center">
          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Yet</h3>
          <p className="text-gray-500">Click "New Order" to create your first order</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Being Prepared Section */}
      {preparingOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-800">Being Prepared</h2>
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-medium">
              {preparingOrders.length}
            </span>
          </div>
          <div className="grid gap-4">
            {preparingOrders.map(order => (
              <OrderStatusCard
                key={order.id}
                order={order}
                onCompleteOrder={onCompleteOrder}
                onCancelOrder={onCancelOrder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {completedOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800">Completed Orders</h2>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
              {completedOrders.length}
            </span>
          </div>
          <div className="grid gap-4">
            {completedOrders.map(order => (
              <OrderStatusCard
                key={order.id}
                order={order}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
