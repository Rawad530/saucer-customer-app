import { Order } from "@/types/order";

interface BackupData {
  timestamp: string;
  orders: Order[];
  version: string;
  deviceId: string;
  user?: string;
}

export const createBackup = (orders: Order[], user?: string): BackupData => {
  return {
    timestamp: new Date().toISOString(),
    orders: orders,
    version: '2.0',
    deviceId: getDeviceId(),
    user: user
  };
};

export const saveBackupToStorage = (backup: BackupData): boolean => {
  try {
    const backupKey = `burger_orders_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    localStorage.setItem('burger_orders_latest_backup', JSON.stringify(backup));
    
    // Clean up old backups - keep only last 20
    cleanupOldBackups();
    
    console.log('Backup saved successfully:', backup.timestamp);
    return true;
  } catch (error) {
    console.error('Failed to save backup:', error);
    return false;
  }
};

export const loadLatestBackup = (): Order[] | null => {
  try {
    const latestBackup = localStorage.getItem('burger_orders_latest_backup');
    if (!latestBackup) return null;
    
    const backup: BackupData = JSON.parse(latestBackup);
    return backup.orders.map(order => ({
      ...order,
      timestamp: new Date(order.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load backup:', error);
    return null;
  }
};

export const getAllBackups = (): BackupData[] => {
  try {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('burger_orders_backup_'))
      .sort()
      .reverse();
    
    return backupKeys.map(key => {
      const backup = localStorage.getItem(key);
      return backup ? JSON.parse(backup) : null;
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to get backups:', error);
    return [];
  }
};

export const restoreFromBackup = (backupTimestamp: string): Order[] | null => {
  try {
    const backups = getAllBackups();
    const backup = backups.find(b => b.timestamp === backupTimestamp);
    
    if (!backup) return null;
    
    return backup.orders.map(order => ({
      ...order,
      timestamp: new Date(order.timestamp)
    }));
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return null;
  }
};

export const getBackupStats = () => {
  try {
    const backups = getAllBackups();
    const totalSize = JSON.stringify(backups).length;
    
    return {
      count: backups.length,
      latest: backups[0]?.timestamp || null,
      totalSize: totalSize,
      oldestBackup: backups[backups.length - 1]?.timestamp || null
    };
  } catch (error) {
    return {
      count: 0,
      latest: null,
      totalSize: 0,
      oldestBackup: null
    };
  }
};

const cleanupOldBackups = () => {
  try {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('burger_orders_backup_'))
      .sort()
      .reverse();
    
    if (backupKeys.length > 20) {
      backupKeys.slice(20).forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
  }
};

const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('burger_app_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('burger_app_device_id', deviceId);
  }
  return deviceId;
};
