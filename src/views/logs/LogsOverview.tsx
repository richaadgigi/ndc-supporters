'use client';
import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { EmptyState, ErrorState } from '../../components/common';
import { OverviewSkeleton } from '../../components/skeletons';
import { MetricCard } from '../../components/overview';
import { Renew, DataBase, Catalog } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { LogStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const LogsOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('logs', 'logs-overview');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchStats = useCallback(async () => {
    if (!moduleId) {
      setError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await analyticsService.getLogStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load log stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load log stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Logs Overview" subtitle="Log analytics and statistics" />

      <div className="xui-py-1-half">
        {loading ? (
          <OverviewSkeleton />
        ) : error ? (
          <ErrorState title="Failed to load log analytics" message={error} onRetry={fetchStats} />
        ) : !stats ? (
          <EmptyState title="No data available" message="There is nothing to display yet." />
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <MetricCard
                title="Total Logs"
                value={stats.total_logs}
                icon={<DataBase size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Log Types"
                value={stats.total_log_via_type.length}
                icon={<Catalog size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Logs by Type</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_log_via_type.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_log_via_type.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_log_via_type.map((item) => item.type || 'Unknown'),
                        colors: ['#009A49', '#111827', '#009A49', '#111827', '#29AA66', '#111827', '#007E3C', '#5CBE8B'],
                        legend: { position: 'bottom', fontSize: '12px' },
                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                        plotOptions: { pie: { donut: { size: '55%' } } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Log Count by Type</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_log_via_type.length > 0 ? (
                    <Chart
                      type="bar"
                      height={250}
                      series={[{
                        name: 'Logs',
                        data: stats.total_log_via_type.map((item) => item.total_count),
                      }]}
                      options={{
                        xaxis: {
                          categories: stats.total_log_via_type.map((item) => item.type || 'Unknown'),
                          labels: { style: { fontSize: '11px' }, rotate: -45 },
                        },
                        yaxis: { title: { text: 'Count' } },
                        colors: ['#009A49'],
                        plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
                        dataLabels: { enabled: false },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogsOverview;
