
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Download, RotateCcw } from "lucide-react";
import { Order } from "@/types/order";
import { exportOrdersToCSV, generateOrderSummary } from "@/utils/exportUtils";
import { DateRange } from "react-day-picker";

interface HistoryFiltersProps {
  orders: Order[];
  onFilterChange: (filteredOrders: Order[]) => void;
}

const HistoryFilters = ({ orders, onFilterChange }: HistoryFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toString().includes(searchTerm) ||
        order.items.some(item => 
          item.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(order => order.timestamp >= today);
          break;
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          filtered = filtered.filter(order => 
            order.timestamp >= yesterday && order.timestamp < today
          );
          break;
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(order => order.timestamp >= weekAgo);
          break;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(order => order.timestamp >= monthAgo);
          break;
        case "custom":
          if (customDateRange?.from) {
            filtered = filtered.filter(order => order.timestamp >= customDateRange.from!);
          }
          if (customDateRange?.to) {
            const toEndOfDay = new Date(customDateRange.to);
            toEndOfDay.setHours(23, 59, 59, 999);
            filtered = filtered.filter(order => order.timestamp <= toEndOfDay);
          }
          break;
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    onFilterChange(filtered);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setStatusFilter("all");
    setCustomDateRange(undefined);
    onFilterChange(orders);
  };

  const handleExport = () => {
    // Apply current filters for export
    let filtered = [...orders];
    // Apply same filtering logic as above
    onFilterChange(filtered);
    exportOrdersToCSV(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, statusFilter, customDateRange, orders]);

  const summary = generateOrderSummary(orders);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order History Filters</span>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={resetFilters} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-xl font-bold">{summary.totalOrders}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-xl font-bold">₾{summary.totalRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Avg Order Value</div>
            <div className="text-xl font-bold">₾{summary.averageOrderValue.toFixed(2)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Popular Item</div>
            <div className="text-sm font-bold">{summary.mostPopularItem}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? customDateRange.from.toLocaleDateString() : "Pick dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryFilters;
