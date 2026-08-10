'use client';
import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { EmptyState, ErrorState } from '../../components/common';
import { OverviewSkeleton } from '../../components/skeletons';
import { MetricCard } from '../../components/overview';
import { Renew, UserMultiple } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { AdministrationStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const AdministrationOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<AdministrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('administration', 'administration-overview');
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
      const response = await analyticsService.getAdministrationStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load administration stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load administration stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Administration Overview" subtitle="Administration module analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <OverviewSkeleton />
        ) : error ? (
          <ErrorState title="Failed to load administration analytics" message={error} onRetry={fetchStats} />
        ) : !stats ? (
          <EmptyState title="No data available" message="There is nothing to display yet." />
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <MetricCard
                title="Total Users"
                value={stats.total_users}
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Users by Role</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_users_via_role.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_users_via_role.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_users_via_role.map((item) => item.Role?.name || 'Unknown'),
                        colors: ['#3f4195', '#ed3337', '#3B82F6', '#F59E0B', '#6567AA', '#D42D30'],
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Users by Role (Table)</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_users_via_role.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{item.Role?.name || 'Unknown'}</td>
                          <td className="xui-font-w-600">{item.total_count.toLocaleString()}</td>
                        </tr>
                      ))}
                      {stats.total_users_via_role.length === 0 && (
                        <tr>
                          <td colSpan={2} className="xui-text-center xui-py-2">
                            <p className="xui-opacity-5">No data</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdministrationOverview;
