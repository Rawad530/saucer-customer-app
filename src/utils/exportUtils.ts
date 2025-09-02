import { Order } from "@/types/order";

export const exportOrdersToCSV = (orders: Order[], filename?: string) => {
  const headers = [
    'Order ID',
    'Order Timestamp',
    'Payment Mode',
    'Main Item',
    'Quantity',
    'Protein',
    'Load',
    'Type',
    'Sauce',
    'Drink',
    'Side Sauce',
    'Add Ons',
    'Remarks',
    'Price (GEL)'
  ];

  const csvContent = [
    headers.join(','),
    ...orders.flatMap(order =>
      order.items.map(item => {
        const { mainItem, protein, load, type } = parseItemDetails(item.menuItem.name);
        const addons = Array.isArray(item.addons) ? [...item.addons] : [];
        if (item.spicy) addons.push('Spicy');
        
        return [
          order.orderNumber,
          order.timestamp.toLocaleString('en-GB'),
          order.paymentMode || 'N/A',
          mainItem,
          item.quantity,
          protein,
          load,
          type,
          item.sauce || 'N/A',
          type === 'Combo' ? (item.drink || 'N/A') : 'N/A',
          type === 'Combo' ? (item.sauceCup || 'N/A') : 'N/A',
          addons.length > 0 ? addons.join(', ') : 'N/A',
          item.remarks || 'N/A',
          `₾${(item.menuItem.price * item.quantity).toFixed(2)}`
        ].map(field => `"${field}"`).join(',');
      })
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `orders_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return csvContent;
};

export const generateOrderSummary = (orders: Order[]) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalOrders = orders.length;
  
  const itemCounts: { [key: string]: number } = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.menuItem.name] = (itemCounts[item.menuItem.name] || 0) + item.quantity;
    });
  });
  
  const mostPopularItem = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    mostPopularItem: mostPopularItem ? mostPopularItem[0] : 'None',
    mostPopularItemCount: mostPopularItem ? mostPopularItem[1] : 0,
    dateRange: orders.length > 0 ? {
      from: new Date(Math.min(...orders.map(o => o.timestamp.getTime()))),
      to: new Date(Math.max(...orders.map(o => o.timestamp.getTime())))
    } : null
  };
};

const parseItemDetails = (itemName: string) => {
  const lowerName = itemName.toLowerCase();
  
  // Check for specific categories
  const isDrink = ['coca cola', 'fanta', 'sprite', 'cappy', 'ice tea', 'water'].some(drink => lowerName.includes(drink));
  const isSauce = ['sauce', 'cup', 'jalapeno'].some(sauce => lowerName.includes(sauce));
  const isSide = ['fries', 'onion rings', 'strips'].some(side => lowerName.includes(side));
  const isAddon = lowerName.includes('add ');
  
  if (isDrink) {
    return {
      mainItem: itemName,
      protein: 'N/A',
      load: 'N/A',
      type: 'Drink'
    };
  }
  
  if (isSauce) {
    return {
      mainItem: itemName,
      protein: 'N/A',
      load: 'N/A',
      type: 'Sauce'
    };
  }
  
  if (isSide) {
    return {
      mainItem: itemName,
      protein: 'N/A',
      load: 'N/A',
      type: 'Side'
    };
  }
  
  if (isAddon) {
    return {
      mainItem: itemName,
      protein: 'N/A',
      load: 'N/A',
      type: 'Add-on'
    };
  }
  
  // Check if item is actually a burger or wrap
  const isBurgerOrWrap = lowerName.includes('burger') || lowerName.includes('wrap');
  
  if (!isBurgerOrWrap) {
    return {
      mainItem: itemName,
      protein: 'N/A',
      load: 'N/A',
      type: 'Other'
    };
  }
  
  // Original logic for burgers and wraps only
  const isWrap = lowerName.includes('wrap');
  const mainItem = isWrap ? 'Wrap' : 'Burger';
  
  const isChicken = lowerName.includes('chicken');
  const isBeef = lowerName.includes('beef');
  const protein = isChicken ? 'Chicken' : isBeef ? 'Beef' : 'N/A';
  
  const isDouble = lowerName.includes('double');
  const load = isDouble ? 'Double' : 'Single';
  
  const isCombo = lowerName.includes('combo');
  const type = isCombo ? 'Combo' : 'A la carte';
  
  return { mainItem, protein, load, type };
};

// Email backup functionality using Supabase Edge Function
export const sendEmailBackup = async (orders: Order[], email: string) => {
  try {
    console.log('Starting email backup process...');
    console.log('Orders count:', orders.length);
    console.log('Email:', email);
    
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Serialize orders with proper date handling
    const serializedOrders = orders.map(order => ({
      ...order,
      timestamp: order.timestamp.toISOString(), // Convert Date to string
      items: order.items.map(item => ({
        ...item,
        menuItem: {
          ...item.menuItem
        }
      }))
    }));
    
    console.log('Calling Supabase Edge Function...');
    const { data, error } = await supabase.functions.invoke('send-backup-email', {
      body: {
        orders: serializedOrders,
        email: email
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(`Edge Function failed: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || !data.success) {
      console.error('Edge Function returned unsuccessful response:', data);
      throw new Error('Email backup failed - no success response from Edge Function');
    }

    console.log('Backup email sent successfully:', data);
    return true;
  } catch (error: any) {
    console.error('Failed to send email backup:', error);
    // Show user-friendly error
    alert(`Email backup failed: ${error.message || 'Unknown error occurred'}`);
    return false;
  }
};

// Cloud backup functionality (using localStorage as fallback)
export const backupToCloud = async (orders: Order[]) => {
  try {
    // For now, we'll use localStorage with timestamp-based backups
    const backup = {
      timestamp: new Date().toISOString(),
      orders: orders,
      version: '1.0'
    };
    
    localStorage.setItem(`burger_orders_backup_${Date.now()}`, JSON.stringify(backup));
    console.log('Orders backed up successfully');
    
    // Clean up old backups - keep only last 10
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('burger_orders_backup_'))
      .sort()
      .reverse();
    
    if (backupKeys.length > 10) {
      backupKeys.slice(10).forEach(key => localStorage.removeItem(key));
    }
    
    // Send email backup
    const emailSent = await sendEmailBackup(orders, 'sarrecordsinc@gmail.com');
    
    if (!emailSent) {
      throw new Error('Failed to send email backup');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to backup orders:', error);
    return false;
  }
};

export const restoreFromCloud = async (): Promise<Order[] | null> => {
  try {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('burger_orders_backup_'))
      .sort()
      .reverse();
    
    if (backupKeys.length === 0) return null;
    
    const latestBackup = localStorage.getItem(backupKeys[0]);
    if (!latestBackup) return null;
    
    const backup = JSON.parse(latestBackup);
    return backup.orders.map((order: any) => ({
      ...order,
      timestamp: new Date(order.timestamp)
    }));
  } catch (error) {
    console.error('Failed to restore orders:', error);
    return null;
  }
};
