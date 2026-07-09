'use client';
import { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard, QuickActions } from '../../components/overview';
import {
  UserMultiple, Trophy, Person, Checkmark, GroupPresentation,
} from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type {
  AdministrationStats,
  CampaignStats,
  ApprovalStats,
} from '../../services/analytics.service';

const CHART_COLORS = ['#3f4195', '#ed3337', '#3B82F6', '#F59E0B', '#6567AA', '#D42D30', '#32347B', '#8C8DBF'];

const Dashboard = () => {
  const { user, acls, getAccessIds } = useGeneral();
  const [adminStats, setAdminStats] = useState<AdministrationStats | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);

  const userRole = acls[0]?.Role?.name || 'User';
  const generalModuleId = acls[0]?.module_unique_id;

  const adminIds = useMemo(() => getAccessIds('administration', 'administration-overview'), [acls]);
  const campaignIds = useMemo(() => getAccessIds('campaign', 'campaign-overview'), [acls]);
  const approvalIds = useMemo(() => getAccessIds('approvals', 'approvals-overview'), [acls]);

  useEffect(() => {
    if (!generalModuleId) return;

    let cancelled = false;

    const promises = [];

    if (adminIds) {
      promises.push(
        analyticsService.getAdministrationStats({ module_unique_id: adminIds.module_unique_id, sub_module_unique_id: adminIds.sub_module_unique_id })
          .then(res => { if (!cancelled && res.success && res.data) setAdminStats(res.data); })
          .catch(() => {})
      );
    }

    if (campaignIds) {
      promises.push(
        analyticsService.getCampaignStats({ module_unique_id: campaignIds.module_unique_id, sub_module_unique_id: campaignIds.sub_module_unique_id })
          .then(res => { if (!cancelled && res.success && res.data) setCampaignStats(res.data); })
          .catch(() => {})
      );
    }

    if (approvalIds) {
      promises.push(
        analyticsService.getApprovalStats({ module_unique_id: approvalIds.module_unique_id, sub_module_unique_id: approvalIds.sub_module_unique_id })
          .then(res => { if (!cancelled && res.success && res.data) setApprovalStats(res.data); })
          .catch(() => {})
      );
    }

    return () => { cancelled = true; };
  }, [generalModuleId, adminIds, campaignIds, approvalIds]);

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
      <Navbar title="Dashboard" />

      <div className="xui-py-1-half">
        <div className="xui-mb-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>
              Welcome back, {user?.fullname?.split(' ')[0] || 'User'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--neutral-500)', margin: '4px 0 0' }}>
              Here's an overview of the campaign.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dash-badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>{userRole}</span>
          </div>
        </div>

        <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1 xui-mb-2">
          {adminStats && (
            <MetricCard title="Total Users" value={adminStats.total_users} icon={<UserMultiple size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
          )}
          {campaignStats && (
            <>
              <MetricCard title="Positions" value={campaignStats.total_positions} icon={<Trophy size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
              <MetricCard title="Candidates" value={campaignStats.total_candidates} icon={<Person size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
              <MetricCard title="Campaign Members" value={campaignStats.total_members} icon={<GroupPresentation size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
            </>
          )}
          {approvalStats && (
            <MetricCard title="Total Approvals" value={approvalStats.total_approvals} icon={<Checkmark size={24} />} iconBgColor="var(--warning-light)" iconColor="var(--warning)" />
          )}
        </div>

        <div className="xui-mb-2">
          <QuickActions />
        </div>

        <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-2">
          {approvalStats && approvalStats.total_approval_via_approval_status.length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: 'var(--warning)' }} />
                  Approvals by Status
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={approvalStats.total_approval_via_approval_status.map((i) => i.total_count)}
                  options={{
                    labels: approvalStats.total_approval_via_approval_status.map((i) => i.approval_status),
                    colors: approvalStats.total_approval_via_approval_status.map((i) => getStatusColor(i.approval_status)),
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {campaignStats && (campaignStats.total_candidates_via_positions ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#ed3337' }} />
                  Candidates by Position
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: 'Candidates', data: (campaignStats.total_candidates_via_positions ?? []).map((i) => i.total_count) }]}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: {
                      categories: (campaignStats.total_candidates_via_positions ?? []).map((i) => i.Position?.name || 'Unknown'),
                      labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' }, rotate: -45 },
                    },
                    yaxis: { labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' } } },
                    colors: ['#3f4195'],
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
                    dataLabels: { enabled: false },
                    grid: { borderColor: 'var(--neutral-100)', strokeDashArray: 4 },
                  }}
                />
              </div>
            </div>
          )}

          {approvalStats && approvalStats.total_approvals_via_module.length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#3f4195' }} />
                  Approvals by Module
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={approvalStats.total_approvals_via_module.map((i) => i.total_count)}
                  options={{
                    labels: approvalStats.total_approvals_via_module.map((i) => i.Module?.name || 'Unknown'),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {adminStats && adminStats.total_users_via_role.length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: 'var(--success)' }} />
                  Users by Role
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={adminStats.total_users_via_role.map((i) => i.total_count)}
                  options={{
                    labels: adminStats.total_users_via_role.map((i) => i.Role?.name || 'Unknown'),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
