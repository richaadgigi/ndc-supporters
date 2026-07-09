'use client';
import { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Trophy, Person, UserMultiple, UserAdmin } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { CampaignStats } from '../../services/analytics.service';

const CHART_COLORS = ['#3f4195', '#ed3337', '#3B82F6', '#F59E0B', '#6567AA', '#D42D30', '#32347B', '#8C8DBF'];

const CampaignOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = useMemo(() => getAccessIds('campaign', 'campaign-overview'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  useEffect(() => {
    if (!moduleId || !subModuleId) { setLoading(false); return; }
    let cancelled = false;
    analyticsService.getCampaignStats({ module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => { if (!cancelled && res.success && res.data) setStats(res.data); })
      .catch(() => { if (!cancelled) setError('Failed to load campaign stats'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [moduleId, subModuleId]);

  const candidatesByPosition = stats?.total_candidates_via_positions ?? [];
  const membersByRole = stats?.total_members_via_member_role ?? [];

  return (
    <div>
      <Navbar title="Campaign Overview" subtitle="Campaign statistics at a glance" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ minHeight: '200px', color: 'var(--neutral-400)', fontSize: '14px' }}>
            Loading stats...
          </div>
        ) : error ? (
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-center" style={{ minHeight: '200px', color: 'var(--error)', fontSize: '14px' }}>
            {error}
          </div>
        ) : stats ? (
          <>
            <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1 xui-mb-2">
              <MetricCard title="Positions" value={stats.total_positions} icon={<Trophy size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
              <MetricCard title="Candidates" value={stats.total_candidates} icon={<Person size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
              <MetricCard title="Members" value={stats.total_members} icon={<UserMultiple size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
              <MetricCard title="Member Roles" value={stats.total_member_roles} icon={<UserAdmin size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-2">
              {candidatesByPosition.length > 0 && (
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>Candidates by Position</h3>
                  </div>
                  <div className="xui-py-1 xui-px-1-half">
                    <Chart
                      type="bar"
                      height={260}
                      series={[{ name: 'Candidates', data: candidatesByPosition.map(i => i.total_count) }]}
                      options={{
                        chart: { toolbar: { show: false } },
                        xaxis: {
                          categories: candidatesByPosition.map(i => i.Position?.name || 'Unknown'),
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

            {candidatesByPosition.length > 0 && (
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-py-1 xui-px-1-half" style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>Positions Breakdown</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Position</th>
                        <th>Candidates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidatesByPosition.map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-opacity-5 xui-font-sz-80">{idx + 1}</td>
                          <td className="xui-font-w-500">{item.Position?.name || 'Unknown'}</td>
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
        ) : null}
      </div>
    </div>
  );
};

export default CampaignOverview;
