
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Receipt, CheckCircle, X, Trash2, CreditCard } from "lucide-react";
import { Order } from "@/types/order";
import { formatTimestamp } from "@/utils/orderUtils";

interface OrderStatusCardProps {
  order: Order;
  onCompleteOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

const OrderStatusCard = ({ order, onCompleteOrder, onCancelOrder, onDeleteOrder }: OrderStatusCardProps) => {
  const isCompleted = order.status === 'completed';

  return (
    <Card className={`bg-white shadow-lg border-0 hover:shadow-xl transition-shadow ${
      isCompleted ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Order #{order.orderNumber}
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-orange-500" />
              )}
            </CardTitle>
            <div className="flex items-center text-gray-600 mt-1">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {formatTimestamp(order.timestamp)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-white ${
              isCompleted 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}>
              ₾{order.totalPrice.toFixed(2)}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {order.paymentMode}
              </Badge>
              <Badge variant={isCompleted ? 'default' : 'secondary'}>
                {isCompleted ? 'Completed' : 'Preparing'}
              </Badge>
              {onDeleteOrder && (
                <Button
                  onClick={() => onDeleteOrder(order.id)}
                  variant="destructive"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Items:</h4>
          <div className="grid gap-2">
            {order.items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{item.menuItem.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        x{item.quantity}
                      </Badge>
                    </div>
                    {(item.sauce || item.sauceCup || item.drink) && (
                      <div className="mt-1 text-sm text-gray-600">
                        {item.sauce && <div>• Sauce: {item.sauce}</div>}
                        {item.sauceCup && <div>• Sauce Cup: {item.sauceCup}</div>}
                        {item.drink && <div>• Drink: {item.drink}</div>}
                      </div>
                    )}
                  </div>
                  <span className="text-orange-600 font-semibold">
                    ₾{(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {!isCompleted && (onCompleteOrder || onCancelOrder) && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
              {onCompleteOrder && (
                <Button
                  onClick={() => onCompleteOrder(order.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
              {onCancelOrder && (
                <Button
                  onClick={() => onCancelOrder(order.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusCard;
