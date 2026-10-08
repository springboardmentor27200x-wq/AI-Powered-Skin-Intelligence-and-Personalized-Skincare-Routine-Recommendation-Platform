import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/admin';

const MaintenanceContext = createContext({
  maintenanceMode: false,
  maintenanceConfig: {},
  refreshMaintenance: () => {},
  loading: false,
});

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await adminService.getPublicSetting('ui_branding');
      const cfg = res?.value || {};
      setMaintenanceConfig(cfg);
      setMaintenanceMode(Boolean(cfg.maintenance_mode));
    } catch (err) {
      // In case of error, assume false to prevent lockout
      console.warn('Failed to fetch maintenance status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll maintenance status every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <MaintenanceContext.Provider
      value={{
        maintenanceMode,
        maintenanceConfig,
        refreshMaintenance: fetchStatus,
        loading,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);
