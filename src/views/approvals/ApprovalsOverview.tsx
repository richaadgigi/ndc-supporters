'use client';
import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { EmptyState, ErrorState } from '../../components/common';
import { OverviewSkeleton } from '../../components/skeletons';
import { MetricCard } from '../../components/overview';
import { Renew, Checkmark, AppConnectivity, Catalog, DataTable } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { ApprovalStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const ApprovalsOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('approvals', 'approvals-overview');
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
      const response = await analyticsService.getApprovalStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load approval stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load approval stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#3f4195';
      case 'denied': return '#ed3337';
      case 'pending': return '#F59E0B';
      default: return '#6567AA';
    }
  };

  return (
    <div>
      <Navbar title="Approvals Overview" subtitle="Approval analytics and statistics" />

      <div className="xui-py-1-half">
        {loading ? (
          <OverviewSkeleton />
        ) : error ? (
          <ErrorState title="Failed to load approval analytics" message={error} onRetry={fetchStats} />
        ) : !stats ? (
          <EmptyState title="No data available" message="There is nothing to display yet." />
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1 xui-mb-1-half">
              <MetricCard
                title="Total Approvals"
                value={stats.total_approvals}
                icon={<Checkmark size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Approval Statuses"
                value={stats.total_approval_via_approval_status.length}
                icon={<DataTable size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Modules Requested"
                value={stats.total_approvals_via_module.length}
                icon={<AppConnectivity size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
              <MetricCard
                title="Sub Modules Requested"
                value={stats.total_approvals_via_sub_module.length}
                icon={<Catalog size={24} />}
                iconBgColor="var(--warning-light)"
                iconColor="var(--warning)"
              />
            </div>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Approvals by Status</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_approval_via_approval_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_approval_via_approval_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_approval_via_approval_status.map((item) => item.approval_status),
                        colors: stats.total_approval_via_approval_status.map((item) => getStatusColor(item.approval_status)),
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Approvals by Module</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_approvals_via_module.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_approvals_via_module.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_approvals_via_module.map((item) => item.Module?.name || 'Unknown'),
                        colors: ['#3f4195', '#ed3337', '#3B82F6', '#F59E0B', '#6567AA', '#D42D30', '#32347B', '#8C8DBF'],
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

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)', gridColumn: '1 / -1' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Approvals by Sub Module</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_approvals_via_sub_module.length > 0 ? (
                    <Chart
                      type="bar"
                      height={300}
                      series={[{
                        name: 'Approvals',
                        data: stats.total_approvals_via_sub_module.map((item) => item.total_count),
                      }]}
                      options={{
                        xaxis: {
                          categories: stats.total_approvals_via_sub_module.map((item) => item.SubModule?.name || 'Unknown'),
                          labels: { style: { fontSize: '11px' }, rotate: -45 },
                        },
                        yaxis: { title: { text: 'Count' } },
                        colors: ['#3f4195'],
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

export default ApprovalsOverview;

