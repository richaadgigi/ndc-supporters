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
  SupporterStats,
  ApprovalStats,
  SupportGroupPortalStats,
} from '../../services/analytics.service';
import { OverviewSkeleton } from '../../components/skeletons';
import { Bullhorn, Category, EventSchedule, Image as ImageIcon, Blog, Help, View, Timer } from '@carbon/icons-react';

const CHART_COLORS = ['#009A49', '#111827', '#009A49', '#111827', '#29AA66', '#111827', '#007E3C', '#5CBE8B'];

const Dashboard = () => {
  const { user, acls, getAccessIds, userType } = useGeneral();
  const [adminStats, setAdminStats] = useState<AdministrationStats | null>(null);
  const [supporterStats, setSupporterStats] = useState<SupporterStats | null>(null);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [portalStats, setPortalStats] = useState<SupportGroupPortalStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = acls[0]?.Role?.name || 'User';
  const generalModuleId = acls[0]?.module_unique_id;

  const adminIds = useMemo(() => getAccessIds('administration', 'administration-overview'), [acls]);
  const supporterIds = useMemo(() => getAccessIds('supporter', 'supporter-overview'), [acls]);
  const approvalIds = useMemo(() => getAccessIds('approvals', 'approvals-overview'), [acls]);
  const portalIds = useMemo(() => getAccessIds('supporter-portal', 'supporter-portal-overview'), [acls]);

  useEffect(() => {
    if (!generalModuleId) { setLoading(false); return; }

    let cancelled = false;

    const promises = [];

    if (userType === 'portal' && portalIds) {
      promises.push(
        analyticsService.getPortalSupportGroupPortalStats({ module_unique_id: portalIds.module_unique_id, sub_module_unique_id: portalIds.sub_module_unique_id })
          .then(res => { if (!cancelled && res.success && res.data) setPortalStats(res.data); })
          .catch(err => console.error('Failed to load portal stats:', err))
      );
    }

    if (adminIds) {
      promises.push(
        analyticsService.getAdministrationStats({ module_unique_id: adminIds.module_unique_id, sub_module_unique_id: adminIds.sub_module_unique_id })
          .then(res => { if (!cancelled && res.success && res.data) setAdminStats(res.data); })
          .catch(() => {})
      );
    }

    if (supporterIds) {
      promises.push(
        analyticsService.getSupporterStats({ module_unique_id: supporterIds.module_unique_id, sub_module_unique_id: supporterIds.sub_module_unique_id })
          .then(res => { if (!cancelled && res.success && res.data) setSupporterStats(res.data); })
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

    Promise.all(promises).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [generalModuleId, adminIds, supporterIds, approvalIds, portalIds, userType]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#009A49';
      case 'denied': return '#111827';
      case 'pending': return '#111827';
      default: return '#29AA66';
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
              Here's an overview of the supporter network.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dash-badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>{userRole}</span>
          </div>
        </div>

        {loading && <OverviewSkeleton />}

        {!loading && (
        <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1 xui-mb-2">
          {portalStats && (
            <>
              <MetricCard title="Announcements" value={portalStats.total_announcements} icon={<Bullhorn size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
              <MetricCard title="Events" value={portalStats.total_events} icon={<EventSchedule size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
              <MetricCard title="Posts" value={portalStats.total_posts} icon={<Blog size={24} />} iconBgColor="#E0F3E9" iconColor="#111827" />
              <MetricCard title="Gallery" value={portalStats.total_galleries} icon={<ImageIcon size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
              <MetricCard title="Categories" value={portalStats.total_categories} icon={<Category size={24} />} iconBgColor="var(--neutral-100)" iconColor="var(--neutral-600)" />
              <MetricCard title="FAQs" value={portalStats.total_faqs} icon={<Help size={24} />} iconBgColor="#E5E7EB" iconColor="#111827" />
              <MetricCard title="Members" value={portalStats.total_members} icon={<GroupPresentation size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
              <MetricCard title="Enquiries" value={portalStats.total_enquiries} icon={<UserMultiple size={24} />} iconBgColor="var(--warning-light)" iconColor="var(--warning)" />
            </>
          )}
          {adminStats && (
            <MetricCard title="Total Users" value={adminStats.total_users} icon={<UserMultiple size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
          )}
          {supporterStats && (
            <>
              <MetricCard title="Support Group Types" value={supporterStats.total_support_group_types} icon={<Trophy size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
              <MetricCard title="Support Groups" value={supporterStats.total_support_groups} icon={<Person size={24} />} iconBgColor="#E0F3E9" iconColor="#111827" />
              <MetricCard title="Members" value={supporterStats.total_members} icon={<GroupPresentation size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
            </>
          )}
          {approvalStats && (
            <MetricCard title="Total Approvals" value={approvalStats.total_approvals} icon={<Checkmark size={24} />} iconBgColor="var(--warning-light)" iconColor="var(--warning)" />
          )}
        </div>
        )}

        <div className="xui-mb-2">
          <QuickActions />
        </div>

        {portalStats && (
          <>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: '0 0 12px' }}>Content Engagement</h3>
            <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1 xui-mb-2">
              <MetricCard title="Announcement Views" value={portalStats.announcement_views_sum ?? 0} icon={<View size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
              <MetricCard title="Post Views" value={portalStats.post_views_sum ?? 0} icon={<View size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
              <MetricCard title="Event Views" value={portalStats.event_views_sum ?? 0} icon={<View size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
              <MetricCard title="Minutes Read" value={portalStats.post_minutes_read_sum ?? 0} icon={<Timer size={24} />} iconBgColor="var(--warning-light)" iconColor="var(--warning)" />
            </div>
          </>
        )}

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

          {supporterStats && (supporterStats.total_support_groups_via_support_group_types ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#111827' }} />
                  Support Groups by Type
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: 'Support Groups', data: (supporterStats.total_support_groups_via_support_group_types ?? []).map((i) => i.total_count) }]}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: {
                      categories: (supporterStats.total_support_groups_via_support_group_types ?? []).map((i) => i.SupportGroupType?.title || i.SupportGroupType?.name || 'Unknown'),
                      labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' }, rotate: -45 },
                    },
                    yaxis: { labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' } } },
                    colors: ['#009A49'],
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
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#009A49' }} />
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

        <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-2">
          {portalStats && (portalStats.total_posts_via_category ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#009A49' }} />
                  Posts by Category
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={portalStats.total_posts_via_category.map((i) => i.total_count)}
                  options={{
                    labels: portalStats.total_posts_via_category.map((i) => i.Category?.name || 'Uncategorised'),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {portalStats && (portalStats.total_enquiries_via_enquiry_status ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#111827' }} />
                  Enquiries by Status
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={portalStats.total_enquiries_via_enquiry_status.map((i) => i.total_count)}
                  options={{
                    labels: portalStats.total_enquiries_via_enquiry_status.map((i) => i.enquiry_status),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {portalStats && (portalStats.total_newsletters_via_subscription ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#009A49' }} />
                  Newsletter Subscriptions
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={portalStats.total_newsletters_via_subscription.map((i) => i.total_count)}
                  options={{
                    labels: portalStats.total_newsletters_via_subscription.map((i) => (i.subscription ? 'Subscribed' : 'Unsubscribed')),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {portalStats && (portalStats.total_members_via_member_role ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#111827' }} />
                  Members by Role
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={portalStats.total_members_via_member_role.map((i) => i.total_count)}
                  options={{
                    labels: portalStats.total_members_via_member_role.map((i) => i.MemberRole?.name || 'Unassigned'),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {portalStats && (portalStats.total_file_storage_via_file_type ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#009A49' }} />
                  Files by Type
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="donut"
                  height={260}
                  series={portalStats.total_file_storage_via_file_type.map((i) => i.total_count)}
                  options={{
                    labels: portalStats.total_file_storage_via_file_type.map((i) => i.file_type || 'Unknown'),
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px' } },
                    plotOptions: { pie: { donut: { size: '60%' } } },
                  }}
                />
              </div>
            </div>
          )}

          {supporterStats && (supporterStats.total_support_group_via_state ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#009A49' }} />
                  Support Groups by State
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: 'Support Groups', data: supporterStats.total_support_group_via_state.map((i) => i.total_count) }]}
                  options={{
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    chart: { toolbar: { show: false } },
                    dataLabels: { enabled: false },
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                    grid: { borderColor: 'var(--neutral-100)', strokeDashArray: 4 },
                    yaxis: { labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' } } },
                    xaxis: { categories: supporterStats.total_support_group_via_state.map((i) => i.state || 'Unknown'), labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' }, rotate: -35 } },
                  }}
                />
              </div>
            </div>
          )}

          {supporterStats && (supporterStats.total_support_group_via_zone ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#111827' }} />
                  Support Groups by Zone
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: 'Support Groups', data: supporterStats.total_support_group_via_zone.map((i) => i.total_count) }]}
                  options={{
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    chart: { toolbar: { show: false } },
                    dataLabels: { enabled: false },
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                    grid: { borderColor: 'var(--neutral-100)', strokeDashArray: 4 },
                    yaxis: { labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' } } },
                    xaxis: { categories: supporterStats.total_support_group_via_zone.map((i) => i.zone || 'Unspecified'), labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' }, rotate: -35 } },
                  }}
                />
              </div>
            </div>
          )}

          {supporterStats && (supporterStats.total_members_via_support_group ?? []).length > 0 && (
            <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: '#009A49' }} />
                  Members by Support Group
                </h3>
              </div>
              <div className="xui-py-1 xui-px-1-half">
                <Chart
                  type="bar"
                  height={260}
                  series={[{ name: 'Members', data: supporterStats.total_members_via_support_group.map((i) => i.total_count) }]}
                  options={{
                    colors: CHART_COLORS,
                    legend: { position: 'bottom', fontSize: '11px' },
                    chart: { toolbar: { show: false } },
                    dataLabels: { enabled: false },
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
                    grid: { borderColor: 'var(--neutral-100)', strokeDashArray: 4 },
                    yaxis: { labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' } } },
                    xaxis: { categories: supporterStats.total_members_via_support_group.map((i) => i.SupportGroup?.name || 'Unknown'), labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' }, rotate: -35 } },
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
