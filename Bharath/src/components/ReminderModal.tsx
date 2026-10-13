import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { RoutineReminderSettings, ReminderAlertItem, PageRoute } from "../types";
import {
  Bell,
  Sun,
  Moon,
  Droplets,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  X,
  Volume2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: PageRoute) => void;
}

const DEFAULT_SETTINGS: RoutineReminderSettings = {
  morning_routine_enabled: true,
  morning_routine_time: "08:00",
  evening_routine_enabled: true,
  evening_routine_time: "21:30",
  hydration_reminder_enabled: true,
  hydration_reminder_time: "14:00",
  sunscreen_reapply_enabled: true,
  sunscreen_reapply_time: "12:30",
  consultation_alerts_enabled: true,
  browser_notifications_permitted: false,
};

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 1;
  const storageKey = `skinintel_reminders_${userId}`;
  const alertsKey = `skinintel_alerts_${userId}`;

  const [settings, setSettings] = useState<RoutineReminderSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [alerts, setAlerts] = useState<ReminderAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem(alertsKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Seed default helpful initial reminder alerts
    return [
      {
        id: "alert-am-1",
        title: "Morning Routine Reminder",
        message: "Time for your AM regimen: Gentle Cleanser, Niacinamide Serum & SPF 50+.",
        type: "routine",
        timestamp: "Today at 08:00 AM",
        read: false,
        route: "/routine",
      },
      {
        id: "alert-hydro-1",
        title: "Daily Hydration Milestone",
        message: "Log your afternoon water intake. Target: 2.5L to maintain skin barrier plumpness.",
        type: "hydration",
        timestamp: "Today at 02:00 PM",
        read: false,
        route: "/lifestyle",
      },
      {
        id: "alert-pm-1",
        title: "Evening Regimen Scheduled",
        message: "Evening routine set for 9:30 PM: Double cleanse and barrier Ceramide cream.",
        type: "routine",
        timestamp: "Scheduled for 09:30 PM",
        read: true,
        route: "/routine",
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<"settings" | "alerts">("settings");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "granted") {
        setSettings((prev) => ({ ...prev, browser_notifications_permitted: true }));
      }
    }
  }, []);

  // Save settings when modified
  const handleSaveSettings = (newSettings: RoutineReminderSettings) => {
    setSettings(newSettings);
    localStorage.setItem(storageKey, JSON.stringify(newSettings));
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof Notification === "undefined") {
      alert("Browser push notifications are not supported in this environment.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      const isGranted = permission === "granted";
      handleSaveSettings({
        ...settings,
        browser_notifications_permitted: isGranted,
      });

      if (isGranted) {
        setTestSuccessMessage("Browser notification permission granted successfully!");
        try {
          new Notification("SkinIntel Skincare Reminder", {
            body: "Notifications are now active for your morning & evening skincare routines!",
            icon: "/favicon.ico",
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // Permission request error
    }
  };

  const handleSendTestNotification = () => {
    setTestSuccessMessage(null);
    const testTitle = "SkinIntel Skincare Reminder";
    const testBody = `Time for your skincare check-in! Don't forget your SPF and hydration.`;

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(testTitle, {
          body: testBody,
          icon: "/favicon.ico",
        });
        setTestSuccessMessage("Test notification sent to your browser!");
      } catch {
        // Fallback to in-app notification
      }
    }

    // Also add to in-app notification alert log
    const newAlert: ReminderAlertItem = {
      id: `alert-test-${Date.now()}`,
      title: "Test Routine Reminder Triggered",
      message: "Notification system is working properly. Reminders will fire at scheduled times.",
      type: "routine",
      timestamp: "Just now",
      read: false,
      route: "/routine",
    };

    const updatedAlerts = [newAlert, ...alerts];
    setAlerts(updatedAlerts);
    localStorage.setItem(alertsKey, JSON.stringify(updatedAlerts));
    if (!testSuccessMessage) {
      setTestSuccessMessage("Test reminder created in your notification feed below.");
    }
  };

  const handleMarkAllRead = () => {
    const updated = alerts.map((a) => ({ ...a, read: true }));
    setAlerts(updated);
    localStorage.setItem(alertsKey, JSON.stringify(updated));
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    localStorage.removeItem(alertsKey);
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-[#EAE6DE] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-[#2E2C29] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#F2EDE4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/30 flex items-center justify-center text-[#5A6D5C]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#2E2C29] flex items-center gap-2">
                <span>Routine Reminders & Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#6E685E]">
                Stay consistent with AM/PM routines, hydration, and doctor replies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2E2C29] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-1 border-b border-[#F2EDE4] flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "border-[#5A6D5C] text-[#2E2C29]"
                : "border-transparent text-[#8C857B] hover:text-[#2E2C29]"
            }`}
          >
            Schedule & Preferences
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "alerts"
                ? "border-[#5A6D5C] text-[#2E2C29]"
                : "border-transparent text-[#8C857B] hover:text-[#2E2C29]"
            }`}
          >
            <span>Recent Alerts</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {testSuccessMessage && (
            <div className="p-3 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#2D382E] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5A6D5C] shrink-0" />
                <span className="font-medium">{testSuccessMessage}</span>
              </div>
              <button
                onClick={() => setTestSuccessMessage(null)}
                className="text-[#6E685E] hover:text-[#2E2C29] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === "settings" ? (
            <div className="space-y-4">
              {/* Browser Push Permission Card */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#5A6D5C]" />
                    <span className="font-semibold text-[#2E2C29]">
                      Browser Desktop Notifications
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      notificationPermission === "granted"
                        ? "bg-[#E8EFE9] text-[#2D382E]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {notificationPermission === "granted" ? "Enabled" : "Needs Permission"}
                  </span>
                </div>
                <p className="text-[#6E685E] text-[11px] leading-relaxed">
                  Receive gentle alerts even when SkinIntel is running in the background so you never skip your sunscreen or barrier routine.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {notificationPermission !== "granted" && (
                    <button
                      onClick={handleRequestBrowserPermission}
                      className="px-3 py-1.5 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      Allow Browser Notifications
                    </button>
                  )}
                  <button
                    onClick={handleSendTestNotification}
                    className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#2E2C29] border border-[#EAE6DE] font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Send Test Reminder
                  </button>
                </div>
              </div>

              {/* Reminder Items */}
              <div className="space-y-3">
                {/* 1. Morning Routine */}
                <div className="p-3.5 rounded-xl border border-[#EAE6DE] bg-white flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#2E2C29]">
                        Morning (AM) Regimen
                      </div>
                      <p className="text-[11px] text-[#6E685E]">
                        Cleanse, antioxidant serum, barrier cream & SPF 50+.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="time"
                      value={settings.morning_routine_time}
                      onChange={(e) =>
                        handleSaveSettings({
                          ...settings,
                          morning_routine_time: e.target.value,
                        })
                      }
                      className="px-2 py-1 bg-[#FAF8F5] border border-[#EAE6DE] rounded-md text-xs text-[#2E2C29]"
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.morning_routine_enabled}
                        onChange={(e) =>
                          handleSaveSettings({
                            ...settings,
                            morning_routine_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5A6D5C]"></div>
                    </label>
                  </div>
                </div>

                {/* 2. Evening Routine */}
                <div className="p-3.5 rounded-xl border border-[#EAE6DE] bg-white flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 mt-0.5">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#2E2C29]">
                        Evening (PM) Regimen
                      </div>
                      <p className="text-[11px] text-[#6E685E]">
                        Double cleanse, active treatment & overnight lipid repair.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="time"
                      value={settings.evening_routine_time}
                      onChange={(e) =>
                        handleSaveSettings({
                          ...settings,
                          evening_routine_time: e.target.value,
                        })
                      }
                      className="px-2 py-1 bg-[#FAF8F5] border border-[#EAE6DE] rounded-md text-xs text-[#2E2C29]"
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.evening_routine_enabled}
                        onChange={(e) =>
                          handleSaveSettings({
                            ...settings,
                            evening_routine_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5A6D5C]"></div>
                    </label>
                  </div>
                </div>

                {/* 3. Mid-day Sunscreen Reapplication */}
                <div className="p-3.5 rounded-xl border border-[#EAE6DE] bg-white flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#2E2C29]">
                        Sunscreen Reapplication
                      </div>
                      <p className="text-[11px] text-[#6E685E]">
                        Maintain UV protection index during peak daylight hours.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="time"
                      value={settings.sunscreen_reapply_time}
                      onChange={(e) =>
                        handleSaveSettings({
                          ...settings,
                          sunscreen_reapply_time: e.target.value,
                        })
                      }
                      className="px-2 py-1 bg-[#FAF8F5] border border-[#EAE6DE] rounded-md text-xs text-[#2E2C29]"
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sunscreen_reapply_enabled}
                        onChange={(e) =>
                          handleSaveSettings({
                            ...settings,
                            sunscreen_reapply_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5A6D5C]"></div>
                    </label>
                  </div>
                </div>

                {/* 4. Hydration & Water Intake */}
                <div className="p-3.5 rounded-xl border border-[#EAE6DE] bg-white flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 mt-0.5">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#2E2C29]">
                        Water Intake Check-In
                      </div>
                      <p className="text-[11px] text-[#6E685E]">
                        Track towards your 2.5L daily cellular hydration goal.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="time"
                      value={settings.hydration_reminder_time}
                      onChange={(e) =>
                        handleSaveSettings({
                          ...settings,
                          hydration_reminder_time: e.target.value,
                        })
                      }
                      className="px-2 py-1 bg-[#FAF8F5] border border-[#EAE6DE] rounded-md text-xs text-[#2E2C29]"
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.hydration_reminder_enabled}
                        onChange={(e) =>
                          handleSaveSettings({
                            ...settings,
                            hydration_reminder_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5A6D5C]"></div>
                    </label>
                  </div>
                </div>

                {/* 5. Dermatologist Consultation Alerts */}
                <div className="p-3.5 rounded-xl border border-[#EAE6DE] bg-white flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#F0F5F1] text-[#5A6D5C] mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#2E2C29]">
                        Dermatologist Response Alerts
                      </div>
                      <p className="text-[11px] text-[#6E685E]">
                        Immediate notification when a doctor resolves your consultation query.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.consultation_alerts_enabled}
                      onChange={(e) =>
                        handleSaveSettings({
                          ...settings,
                          consultation_alerts_enabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5A6D5C]"></div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Alerts Feed Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F2EDE4]">
                <span className="text-xs text-[#6E685E]">
                  {alerts.length} notifications logged
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#5A6D5C] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                  <span className="text-[#8C857B]">·</span>
                  <button
                    onClick={handleClearAlerts}
                    className="text-[11px] font-semibold text-[#8C857B] hover:text-rose-700 cursor-pointer"
                  >
                    Clear history
                  </button>
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="py-8 text-center text-[#8C857B] space-y-1">
                  <p>No recent reminder notifications.</p>
                  <p className="text-[11px]">
                    Upcoming reminders will populate here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        alert.read
                          ? "bg-white border-[#EAE6DE]"
                          : "bg-[#FDFBF7] border-[#8BA88E]/50 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-[#2E2C29]">
                            {!alert.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block shrink-0" />
                            )}
                            <span>{alert.title}</span>
                          </div>
                          <p className="text-xs text-[#6E685E] leading-relaxed">
                            {alert.message}
                          </p>
                          <span className="text-[10px] text-[#8C857B] block pt-1">
                            {alert.timestamp}
                          </span>
                        </div>

                        {alert.route && onNavigate && (
                          <button
                            onClick={() => {
                              onNavigate(alert.route!);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg text-[#5A6D5C] hover:bg-[#F0F5F1] transition-colors cursor-pointer shrink-0"
                            title="Open section"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F2EDE4] bg-[#FAF8F5] flex items-center justify-between text-xs">
          <span className="text-[#8C857B]">
            Automated alerts synced with local time
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
