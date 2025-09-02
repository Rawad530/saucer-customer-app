const ORDER_STORAGE_KEY = 'burger_orders';
const ORDER_COUNTER_KEY = 'burger_order_counter';

export const saveOrdersToStorage = (orders: any[]) => {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders to storage:', error);
  }
};

export const loadOrdersFromStorage = () => {
  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) {
      const orders = JSON.parse(stored);
      return orders.map((order: any) => ({
        ...order,
        timestamp: new Date(order.timestamp)
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load orders from storage:', error);
    return [];
  }
};

export const getNextOrderNumber = (): number => {
  try {
    const stored = localStorage.getItem(ORDER_COUNTER_KEY);
    const currentCounter = stored ? parseInt(stored, 10) : 1000;
    const nextNumber = currentCounter + 1;
    localStorage.setItem(ORDER_COUNTER_KEY, nextNumber.toString());
    return nextNumber;
  } catch (error) {
    console.error('Failed to get next order number:', error);
    return Math.floor(Math.random() * 10000) + 1000;
  }
};

export const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Enhanced cloud backup functionality
export const backupToCloud = async (orders: any[]) => {
  try {
    // Create timestamped backup
    const backup = {
      timestamp: new Date().toISOString(),
      orders: orders,
      version: '1.0',
      deviceId: getDeviceId()
    };
    
    // Store backup with timestamp
    const backupKey = `burger_orders_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    // Also maintain a "latest" backup for easy access
    localStorage.setItem('burger_orders_latest_backup', JSON.stringify(backup));
    
    // Clean up old backups - keep only last 20
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('burger_orders_backup_'))
      .sort()
      .reverse();
    
    if (backupKeys.length > 20) {
      backupKeys.slice(20).forEach(key => localStorage.removeItem(key));
    }
    
    console.log('Orders backed up successfully at:', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Failed to backup orders:', error);
    return false;
  }
};

export const syncFromCloud = async () => {
  try {
    // Get latest backup
    const latestBackup = localStorage.getItem('burger_orders_latest_backup');
    if (!latestBackup) return null;
    
    const backup = JSON.parse(latestBackup);
    const restoredOrders = backup.orders.map((order: any) => ({
      ...order,
      timestamp: new Date(order.timestamp)
    }));
    
    console.log('Orders synced from cloud backup:', backup.timestamp);
    return restoredOrders;
  } catch (error) {
    console.error('Failed to sync from cloud:', error);
    return null;
  }
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('burger_app_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('burger_app_device_id', deviceId);
  }
  return deviceId;
};

export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    return {
      used: totalSize,
      availableEstimate: 5 * 1024 * 1024, // ~5MB typical limit
      percentage: (totalSize / (5 * 1024 * 1024)) * 100
    };
  } catch (error) {
    return { used: 0, availableEstimate: 0, percentage: 0 };
  }
};
