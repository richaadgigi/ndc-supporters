'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Group, GroupPresentation, UserMultiple, UserAdmin, Bullhorn, Email, EventSchedule, Blog, View } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { SupporterStats, SupportGroupPortalStats } from '../../services/analytics.service';
import { EmptyState, ErrorState } from '../../components/common';
import { OverviewSkeleton } from '../../components/skeletons';

const CHART_COLORS = ['#3f4195', '#ed3337', '#3B82F6', '#F59E0B', '#6567AA', '#D42D30', '#32347B', '#8C8DBF'];

const SupporterOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<SupporterStats | null>(null);
  const [portalStats, setPortalStats] = useState<SupportGroupPortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = useMemo(() => getAccessIds('supporter', 'supporter-overview'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchStats = useCallback(async () => {
    if (!moduleId || !subModuleId) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res = await analyticsService.getSupporterStats({ module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (res.success && res.data) setStats(res.data);
      try {
        const portalRes = await analyticsService.getSupportGroupPortalStats({ module_unique_id: moduleId, sub_module_unique_id: subModuleId });
        if (portalRes.success && portalRes.data) setPortalStats(portalRes.data);
      } catch (portalErr) { console.error('Failed to load support group portal stats:', portalErr); }
    } catch (err) {
      console.error('Failed to load supporter stats:', err);
      setError('Failed to load supporter stats');
    } finally { setLoading(false); }
  }, [moduleId, subModuleId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const groupsByType = stats?.total_support_groups_via_support_group_types ?? [];
  const membersByRole = stats?.total_members_via_member_role ?? [];
  const groupsByState = stats?.total_support_group_via_state ?? [];

  return (
    <div>
      <Navbar title="Supporter Overview" subtitle="Support group administration at a glance" />

      <div className="xui-py-1-half">
        {loading ? (
          <OverviewSkeleton />
        ) : error ? (
          <ErrorState title="Failed to load supporter stats" message={error} onRetry={fetchStats} />
        ) : !stats ? (
          <EmptyState title="No stats available" message="There are no supporter statistics to display yet." />
        ) : (
          <>
            <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1 xui-mb-2">
              <MetricCard title="Support Groups" value={stats.total_support_groups} icon={<Group size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
              <MetricCard title="Support Group Types" value={stats.total_support_group_types} icon={<GroupPresentation size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
              <MetricCard title="Members" value={stats.total_members} icon={<UserMultiple size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
              <MetricCard title="Member Roles" value={stats.total_member_roles} icon={<UserAdmin size={24} />} iconBgColor="var(--warning-light)" iconColor="var(--warning)" />
            </div>

            {portalStats && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: '0 0 12px' }}>Support Group Portal Content</h3>
                <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1 xui-mb-2">
                  <MetricCard title="Announcements" value={portalStats.total_announcements} icon={<Bullhorn size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
                  <MetricCard title="Posts" value={portalStats.total_posts} icon={<Blog size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
                  <MetricCard title="Events" value={portalStats.total_events} icon={<EventSchedule size={24} />} iconBgColor="var(--warning-light)" iconColor="var(--warning)" />
                  <MetricCard title="Enquiries" value={portalStats.total_enquiries} icon={<Email size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
                  <MetricCard title="Announcement Views" value={portalStats.announcement_views_sum} icon={<View size={24} />} iconBgColor="var(--neutral-100)" iconColor="var(--neutral-600)" />
                  <MetricCard title="Post Views" value={portalStats.post_views_sum} icon={<View size={24} />} iconBgColor="var(--neutral-100)" iconColor="var(--neutral-600)" />
                  <MetricCard title="Event Views" value={portalStats.event_views_sum} icon={<View size={24} />} iconBgColor="var(--neutral-100)" iconColor="var(--neutral-600)" />
                  <MetricCard title="Minutes Read" value={portalStats.post_minutes_read_sum} icon={<Blog size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
                </div>
              </>
            )}

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-2">
              {groupsByType.length > 0 && (
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>Support Groups by Type</h3>
                  </div>
                  <div className="xui-py-1 xui-px-1-half">
                    <Chart
                      type="bar"
                      height={260}
                      series={[{ name: 'Support Groups', data: groupsByType.map(i => i.total_count) }]}
                      options={{
                        chart: { toolbar: { show: false } },
                        xaxis: {
                          categories: groupsByType.map(i => i.SupportGroupType?.title || i.SupportGroupType?.name || 'Unknown'),
                          labels: { style: { fontSize: '11px', colors: 'var(--neutral-400)' }, rotate: -30 },
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

              {membersByRole.length > 0 && (
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>Members by Role</h3>
                  </div>
                  <div className="xui-py-1 xui-px-1-half">
                    <Chart
                      type="donut"
                      height={260}
                      series={membersByRole.map(i => i.total_count)}
                      options={{
                        labels: membersByRole.map(i => i.MemberRole?.name || 'Unassigned'),
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

            {groupsByState.length > 0 && (
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>Support Groups by State</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>State</th>
                        <th>Support Groups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupsByState.map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-opacity-5 xui-font-sz-80">{idx + 1}</td>
                          <td className="xui-font-w-500">{item.state || 'Unknown'}</td>
                          <td>
                            <span className="xui-badge xui-badge-blue xui-font-sz-80">{item.total_count}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SupporterOverview;
