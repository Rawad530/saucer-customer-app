
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, History, Archive, CloudDownload, CloudUpload } from "lucide-react";
import { Order } from "@/types/order";
import HistoryFilters from "./HistoryFilters";
import OrderStatusCard from "./OrderStatusCard";
import DeleteOrderDialog from "./DeleteOrderDialog";
import { backupToCloud, restoreFromCloud } from "@/utils/exportUtils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface HistorySectionProps {
  orders: Order[];
  onOrdersUpdate: (orders: Order[]) => void;
}

const HistorySection = ({ orders, onOrdersUpdate }: HistorySectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteOrderDialog, setDeleteOrderDialog] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({ isOpen: false, order: null });
  const ordersPerPage = 10;

  const handleBackup = async () => {
    const success = await backupToCloud(orders);
    if (success) {
      alert('Orders backed up successfully and sent to email!');
    } else {
      alert('Failed to backup orders. Please try again.');
    }
  };

  const handleRestore = async () => {
    if (confirm('This will restore orders from the latest backup. Are you sure?')) {
      const restoredOrders = await restoreFromCloud();
      if (restoredOrders) {
        onOrdersUpdate(restoredOrders);
        alert('Orders restored successfully!');
      } else {
        alert('No backup found or failed to restore.');
      }
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const orderToDelete = orders.find(order => order.id === orderId);
    if (orderToDelete) {
      setDeleteOrderDialog({ isOpen: true, order: orderToDelete });
    }
  };

  const confirmDeleteOrder = () => {
    if (deleteOrderDialog.order) {
      const updatedOrders = orders.filter(order => order.id !== deleteOrderDialog.order!.id);
      onOrdersUpdate(updatedOrders);
      setFilteredOrders(prev => prev.filter(order => order.id !== deleteOrderDialog.order!.id));
    }
    setDeleteOrderDialog({ isOpen: false, order: null });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const completedOrders = filteredOrders.filter(order => order.status === 'completed');
  const preparingOrders = filteredOrders.filter(order => order.status === 'preparing');

  return (
    <div className="mt-8">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-6 w-6 text-blue-500" />
                  <span>Order History</span>
                  <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                      {orders.length} Total
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                      {completedOrders.length} Completed
                    </span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-medium">
                      {preparingOrders.length} Preparing
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBackup();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <CloudUpload className="h-4 w-4 mr-1" />
                    Backup
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <CloudDownload className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="space-y-6">
            <HistoryFilters 
              orders={orders} 
              onFilterChange={setFilteredOrders}
            />

            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
                  <p className="text-gray-500">Try adjusting your filters or create some orders first</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {currentOrders.map(order => (
                    <OrderStatusCard
                      key={order.id}
                      order={order}
                      onDeleteOrder={handleDeleteOrder}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(currentPage - 1)}
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 2
                        )
                        .map((page, index, array) => (
                          <PaginationItem key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2">...</span>
                            )}
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))
                      }
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <DeleteOrderDialog
        isOpen={deleteOrderDialog.isOpen}
        onClose={() => setDeleteOrderDialog({ isOpen: false, order: null })}
        onConfirm={confirmDeleteOrder}
        order={deleteOrderDialog.order}
      />
    </div>
  );
};

export default HistorySection;
