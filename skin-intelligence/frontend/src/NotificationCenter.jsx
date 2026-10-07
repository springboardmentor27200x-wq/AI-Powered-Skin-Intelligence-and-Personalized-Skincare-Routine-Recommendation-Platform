import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function NotificationCenter({ onClose, onNavigateTab }) {
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'replenishment' | 'settings'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replenishments, setReplenishments] = useState([]);
  const [settings, setSettings] = useState({
    am_reminder_enabled: true,
    am_reminder_time: '08:00',
    pm_reminder_enabled: true,
    pm_reminder_time: '21:00',
    midday_spf_reminder_enabled: true,
    midday_spf_time: '13:00',
    replenishment_alerts_enabled: true,
    cycling_phase_alerts_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Add Product Modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Moisturizer');
  const [newProdSize, setNewProdSize] = useState(50);
  const [newProdDate, setNewProdDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProdLifespan, setNewProdLifespan] = useState(45);
  const [newProdFreq, setNewProdFreq] = useState(1);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [notifsData, replData, settData] = await Promise.all([
        api.getNotifications().catch(() => ({ notifications: [], unread_count: 0 })),
        api.getProductReplenishments().catch(() => []),
        api.getNotificationSettings().catch(() => ({})),
      ]);
      setNotifications(notifsData.notifications || []);
      setUnreadCount(notifsData.unread_count || 0);
      setReplenishments(replData || []);
      if (settData && Object.keys(settData).length > 0) {
        setSettings(prev => ({ ...prev, ...settData }));
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.dismissNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification dismissed');
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionClick = (actionUrl, id) => {
    handleMarkRead(id);
    if (actionUrl) {
      const tabMap = {
        '#routine': 'routine',
        '#products': 'products',
        '#skincycle': 'skincycle',
        '#assessment': 'assessment',
        '#texture': 'texture',
        '#progress': 'progress'
      };
      const targetTab = tabMap[actionUrl];
      if (targetTab && onNavigateTab) {
        onNavigateTab(targetTab);
        onClose();
      }
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateNotificationSettings(settings);
      showToast('Reminder preferences saved successfully!');
    } catch (err) {
      showToast('Failed to save preferences.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRestock = async (id) => {
    try {
      const res = await api.restockProduct(id);
      showToast(res.message || 'Bottle restocked to 100%!');
      loadAll();
    } catch (err) {
      showToast('Failed to restock product.');
    }
  };

  const handleDeleteReplenishment = async (id) => {
    if (!window.confirm('Stop tracking replenishment for this product?')) return;
    try {
      await api.deleteProductReplenishment(id);
      setReplenishments(prev => prev.filter(p => p.id !== id));
      showToast('Product untracked.');
    } catch (err) {
      showToast('Failed to delete tracked product.');
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addProductReplenishment({
        product_name: newProdName,
        category: newProdCategory,
        bottle_size_ml: parseInt(newProdSize),
        opened_date: newProdDate,
        estimated_lifespan_days: parseInt(newProdLifespan),
        daily_usage_frequency: parseInt(newProdFreq)
      });
      setShowAddProduct(false);
      setNewProdName('');
      showToast('Product replenishment tracking activated!');
      loadAll();
    } catch (err) {
      showToast('Error adding product.');
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Skin Intelligence', {
          body: 'Reminders enabled! You will receive gentle routine and restock alerts.',
          icon: '/favicon.ico'
        });
        showToast('Browser notifications enabled!');
      } else {
        showToast('Browser permission denied or dismissed.');
      }
    } else {
      showToast('Browser does not support push notifications.');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: 760, width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #FFF9FA 0%, #FFFFFF 100%)',
          borderBottom: '1px solid rgba(192, 99, 122, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 4px 12px rgba(192, 99, 122, 0.25)'
            }}>
              🔔
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 20,
                fontWeight: 700,
                color: '#1A1219',
                margin: 0
              }}>
                Notification & Reminder Center
              </h2>
              <p style={{ fontSize: 12, color: '#7D737B', margin: '2px 0 0 0' }}>
                Automated routine alerts, UV reminders, and bottle replenishment tracking
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="close-modal-btn" style={{ fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        {/* TOAST ALERT */}
        {toastMsg && (
          <div style={{
            background: '#1E8C5F',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 600,
            padding: '8px 24px',
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            {toastMsg}
          </div>
        )}

        {/* SUB-TABS */}
        <div style={{
          display: 'flex',
          padding: '0 24px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFB',
          gap: 24
        }}>
          {[
            { key: 'notifications', label: `Notifications (${unreadCount})`, icon: '📬' },
            { key: 'replenishment', label: `Product Replenishment (${replenishments.filter(r => r.status !== 'GOOD').length} Alert)`, icon: '🧴' },
            { key: 'settings', label: 'Reminder Settings', icon: '⚙️' },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '14px 4px',
                border: 'none',
                borderBottom: activeTab === t.key ? '2.5px solid #C0637A' : '2.5px solid transparent',
                background: 'transparent',
                color: activeTab === t.key ? '#C0637A' : '#6B7280',
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
          
          {/* TAB 1: NOTIFICATIONS LIST */}
          {activeTab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  Active Alerts & Directives
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C0637A',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9A8F95' }}>Loading alerts...</div>
              ) : notifications.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  background: '#F8F9FA',
                  borderRadius: 16,
                  border: '1px dashed rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#1A1219' }}>You're all caught up!</h4>
                  <p style={{ fontSize: 12.5, color: '#7D737B', margin: 0 }}>No pending routine or replenishment reminders.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: n.is_read ? '#FFFFFF' : '#FFF9FA',
                        border: `1.5px solid ${!n.is_read ? 'rgba(192, 99, 122, 0.3)' : 'rgba(0,0,0,0.06)'}`,
                        boxShadow: !n.is_read ? '0 2px 8px rgba(192, 99, 122, 0.08)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {!n.is_read && (
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#C0637A',
                              flexShrink: 0
                            }} />
                          )}
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1219' }}>
                            {n.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#9A8F95' }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDismiss(n.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#9CA3AF',
                              cursor: 'pointer',
                              fontSize: 14,
                              padding: '0 4px'
                            }}
                            title="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: 12.5, color: '#4B5563', margin: 0, lineHeight: 1.45 }}>
                        {n.message}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {n.action_label ? (
                          <button
                            type="button"
                            onClick={() => handleActionClick(n.action_url, n.id)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                              color: '#FFFFFF',
                              fontSize: 11.5,
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {n.action_label} →
                          </button>
                        ) : <div />}

                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(n.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6B7280',
                              fontSize: 11.5,
                              cursor: 'pointer'
                            }}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT REPLENISHMENT TRACKER */}
          {activeTab === 'replenishment' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1219', margin: '0 0 2px 0' }}>
                    Skincare Product Inventory & Replenishment
                  </h3>
                  <p style={{ fontSize: 12, color: '#7D737B', margin: 0 }}>
                    Tracks estimated bottle depletion based on daily usage frequency and opening date.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#C0637A',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>+</span> Track Product
                </button>
              </div>

              {replenishments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9A8F95' }}>No products being tracked.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {replenishments.map((prod) => {
                    const isLow = prod.status === 'LOW';
                    const isEmpty = prod.status === 'EMPTY';

                    return (
                      <div
                        key={prod.id}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 16,
                          background: '#FFFFFF',
                          border: `1.5px solid ${isEmpty ? '#DC2626' : isLow ? '#D97706' : 'rgba(0,0,0,0.06)'}`,
                          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1219' }}>
                                {prod.product_name}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 10.5,
                                fontWeight: 700,
                                background: isEmpty ? '#FDEAEA' : isLow ? '#FEF3C7' : '#E8F8F0',
                                color: isEmpty ? '#DC2626' : isLow ? '#B45309' : '#1E8C5F'
                              }}>
                                {isEmpty ? 'Empty / Depleted' : isLow ? 'Restock Soon' : 'Optimal Level'}
                              </span>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>
                              {prod.category} · {prod.bottle_size_ml}ml · Opened: {prod.opened_date} (~{prod.days_left} days remaining)
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleRestock(prod.id)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 8,
                                background: '#F8F9FA',
                                border: '1px solid rgba(0,0,0,0.12)',
                                color: '#1A1219',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Reset bottle to 100%"
                            >
                              ↺ New Bottle (100%)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReplenishment(prod.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                fontSize: 14
                              }}
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* BOTTLE PROGRESS BAR */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>
                            <span>Bottle Level</span>
                            <span style={{ color: isEmpty ? '#DC2626' : isLow ? '#D97706' : '#1E8C5F' }}>
                              {prod.remaining_percentage}% remaining
                            </span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${prod.remaining_percentage}%`,
                                height: '100%',
                                background: isEmpty ? '#DC2626' : isLow ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #10B981, #059669)',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMINDER PREFERENCE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1219', margin: '0 0 4px 0' }}>
                  Daily Routine & Notification Preferences
                </h3>
                <p style={{ fontSize: 12, color: '#7D737B', margin: 0 }}>
                  Configure when and how you receive skincare and product alerts.
                </p>
              </div>

              {/* BROWSER PUSH BUTTON */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #FDF2F4, #FFFFFF)',
                border: '1px solid rgba(192, 99, 122, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1219' }}>
                    Enable Desktop & Mobile Push Notifications
                  </div>
                  <div style={{ fontSize: 11.5, color: '#7D737B' }}>
                    Receive real-time alerts even when the tab is running in the background.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestBrowserPermission}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: '#C0637A',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Test / Enable Push
                </button>
              </div>

              {/* MORNING ROUTINE */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1219' }}>
                    ☀️ Morning Skincare Routine Reminder
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                    Prompts you to cleanse, apply antioxidant serum, and SPF 50+.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="time"
                    value={settings.am_reminder_time || '08:00'}
                    onChange={(e) => setSettings({ ...settings, am_reminder_time: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 12 }}
                  />
                  <input
                    type="checkbox"
                    checked={settings.am_reminder_enabled}
                    onChange={(e) => setSettings({ ...settings, am_reminder_enabled: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#C0637A', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* MIDDAY SPF ALERT */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1219' }}>
                    ☀️ Midday Sunscreen (SPF) Reapplication Alert
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                    Alerts you when UV index is elevated to reapply sunscreen.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="time"
                    value={settings.midday_spf_time || '13:00'}
                    onChange={(e) => setSettings({ ...settings, midday_spf_time: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 12 }}
                  />
                  <input
                    type="checkbox"
                    checked={settings.midday_spf_reminder_enabled}
                    onChange={(e) => setSettings({ ...settings, midday_spf_reminder_enabled: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#C0637A', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* EVENING SKIN CYCLING */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1219' }}>
                    🌙 Night Skincare & Cycling Directive
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                    Notifies you of tonight's active phase (Exfoliation vs Retinoid vs Recovery).
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="time"
                    value={settings.pm_reminder_time || '21:00'}
                    onChange={(e) => setSettings({ ...settings, pm_reminder_time: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 12 }}
                  />
                  <input
                    type="checkbox"
                    checked={settings.pm_reminder_enabled}
                    onChange={(e) => setSettings({ ...settings, pm_reminder_enabled: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#C0637A', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* REPLENISHMENT ALERTS TOGGLE */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1219' }}>
                    🧴 Product Depletion & Restock Warning Alerts
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                    Sends an alert when any product drops below 25% remaining bottle capacity.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.replenishment_alerts_enabled}
                  onChange={(e) => setSettings({ ...settings, replenishment_alerts_enabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#C0637A', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={savingSettings}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(192, 99, 122, 0.25)'
                  }}
                >
                  {savingSettings ? 'Saving Preferences...' : 'Save Reminder Settings'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* MODAL: ADD PRODUCT REPLENISHMENT */}
      {showAddProduct && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>Track Product Lifespan</h2>
              <button type="button" onClick={() => setShowAddProduct(false)} className="close-modal-btn">×</button>
            </div>
            <form onSubmit={handleAddProductSubmit} className="modal-form">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Niacinamide 10% + Zinc 1%"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={newProdCategory} onChange={(e) => setNewProdCategory(e.target.value)}>
                    <option value="Cleanser">Cleanser</option>
                    <option value="Serum">Serum</option>
                    <option value="Treatment">Treatment / Active</option>
                    <option value="Moisturizer">Moisturizer</option>
                    <option value="Sunscreen">Sunscreen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Bottle Size (ml)</label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={newProdSize}
                    onChange={(e) => setNewProdSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date Opened</label>
                  <input
                    type="date"
                    required
                    value={newProdDate}
                    onChange={(e) => setNewProdDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Expected Lifespan (Days)</label>
                  <input
                    type="number"
                    min="10"
                    max="365"
                    value={newProdLifespan}
                    onChange={(e) => setNewProdLifespan(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddProduct(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Start Tracking</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
