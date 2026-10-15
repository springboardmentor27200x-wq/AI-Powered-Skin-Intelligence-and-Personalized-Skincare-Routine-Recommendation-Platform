import React, { useState, useEffect, useCallback } from 'react';
import { Activity, ArrowUpRight, AlertTriangle, FileDown, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { dashboardService } from '../services/dashboardService';
import { hydrationService } from '../services/hydrationService';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { ProfileCompletionCard } from '../components/dashboard/ProfileCompletionCard';
import { SkinSummaryCard } from '../components/dashboard/SkinSummaryCard';
import { LifestyleSummaryCard } from '../components/dashboard/LifestyleSummaryCard';
import { SleepSummaryCard } from '../components/dashboard/SleepSummaryCard';
import { HydrationSummaryCard } from '../components/dashboard/HydrationSummaryCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import api from '../services/api';

function HealthProgressCard({ progress }) {
  if (!progress) return null;

  return (
    <Card
      title="Skin Health Progress"
      subtitle="Your overall condition trend and current alerts"
      icon={Activity}
      action={<span className="text-xs font-semibold text-emerald-600">{progress.overall_skin_health_score}/100</span>}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-900">{progress.overall_skin_health_score}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Overall health score</div>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            +{Math.max(0, progress.overall_skin_health_score - 60)} point trend
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Skin', progress.skin_condition_score],
            ['Lifestyle', progress.lifestyle_score],
            ['Sleep', progress.sleep_score],
            ['Hydration', progress.hydration_score],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
              <div className="mt-1 text-lg font-bold text-slate-800">{value}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Trend</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          {progress.trend?.length ? (
            <div className="flex items-end gap-2 h-16">
              {progress.trend.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300"
                    title={`${point.label}: ${point.score}/100`}
                    style={{ height: `${Math.max(8, point.score)}%` }}
                  />
                  <span className="text-[10px] text-slate-400">{point.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-l-2 border-slate-300 pl-3 text-xs leading-relaxed text-slate-500">
              No saved assessment history yet. Generate a routine to add your first score.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Alerts</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {progress.alerts?.map((alert) => (
              <li key={alert} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{progress.summary}</p>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const [dashboardData, setDashboardData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const [summary, progress] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getProgress(),
      ]);
      setDashboardData(summary);
      setProgressData(progress);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      notifyError('Unable to load dashboard data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickHydrationAdd = async (amountMl) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await hydrationService.logHydration({
        water_intake_ml: amountMl,
        record_date: today,
      });
      notifySuccess(`Logged +${amountMl} ml of water!`);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to log water:', err);
      notifyError('Failed to record water intake.');
    }
  };

  const handleReportExport = async (format) => {
    setExporting(format);
    try {
      const response = await api.get(`/reports/progress?format=${format}`, { responseType: 'blob' });
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `skin-progress-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);
      notifySuccess(`${format.toUpperCase()} report downloaded.`);
    } catch (err) {
      console.error('Report export failed:', err);
      notifyError('Unable to export your progress report.');
    } finally {
      setExporting('');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} message="Loading your skin intelligence dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner user={dashboardData?.user || user} />

      <ProfileCompletionCard completion={dashboardData?.completion} />

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress Analytics</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" icon={FileDown} isLoading={exporting === 'pdf'} disabled={Boolean(exporting)} onClick={() => handleReportExport('pdf')}>PDF</Button>
            <Button size="sm" variant="outline" icon={FileSpreadsheet} isLoading={exporting === 'xlsx'} disabled={Boolean(exporting)} onClick={() => handleReportExport('xlsx')}>Excel</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HealthProgressCard progress={progressData} />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <QuickActions />
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Summary Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkinSummaryCard skinProfile={dashboardData?.skin_profile} />
          <LifestyleSummaryCard lifestyle={dashboardData?.lifestyle} />
          <SleepSummaryCard
            recentSleep={dashboardData?.recent_sleep}
            averageSleepHours={dashboardData?.average_sleep_hours}
          />
          <HydrationSummaryCard
            todayHydrationMl={dashboardData?.today_hydration_ml}
            onQuickAdd={handleQuickHydrationAdd}
          />
        </div>
      </div>
    </div>
  );
}
