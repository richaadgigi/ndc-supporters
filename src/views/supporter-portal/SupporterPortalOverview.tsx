'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Bullhorn, Category, Email, EventSchedule, Help, FolderOpen, Image, Email as Newsletter, Blog, UserMultiple } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { SupportGroupPortalStats } from '../../services/analytics.service';
import { EmptyState, ErrorState } from '../../components/common';
import { OverviewSkeleton } from '../../components/skeletons';

const SupporterPortalOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<SupportGroupPortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = useMemo(() => getAccessIds('supporter-portal', 'supporter-portal-overview'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchStats = useCallback(async () => {
    if (!moduleId || !subModuleId) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res = await analyticsService.getPortalSupportGroupPortalStats({ module_unique_id: moduleId, sub_module_unique_id: subModuleId });
      if (res.success && res.data) setStats(res.data);
    } catch (err) {
      console.error('Failed to load portal stats:', err);
      setError('Failed to load portal stats');
    } finally { setLoading(false); }
  }, [moduleId, subModuleId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div>
      <Navbar title="Portal Overview" subtitle="Support group portal at a glance" />
      <div className="xui-py-1-half">
        {loading ? (
          <OverviewSkeleton />
        ) : error ? (
          <ErrorState title="Failed to load portal stats" message={error} onRetry={fetchStats} />
        ) : !stats ? (
          <EmptyState title="No stats available" message="There are no portal statistics to display yet." />
        ) : (
          <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1">
            <MetricCard title="Announcements" value={stats.total_announcements} icon={<Bullhorn size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
            <MetricCard title="Categories" value={stats.total_categories} icon={<Category size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
            <MetricCard title="Enquiries" value={stats.total_enquiries} icon={<Email size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
            <MetricCard title="Events" value={stats.total_events} icon={<EventSchedule size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
            <MetricCard title="FAQs" value={stats.total_faqs} icon={<Help size={24} />} iconBgColor="#fff7ed" iconColor="#f59e0b" />
            <MetricCard title="File Storage" value={stats.total_file_storage} icon={<FolderOpen size={24} />} iconBgColor="var(--neutral-100)" iconColor="var(--neutral-600)" />
            <MetricCard title="Gallery" value={stats.total_galleries} icon={<Image size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
            <MetricCard title="Members" value={stats.total_members} icon={<UserMultiple size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
            <MetricCard title="Newsletter" value={stats.total_newsletters} icon={<Newsletter size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
            <MetricCard title="Posts" value={stats.total_posts} icon={<Blog size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SupporterPortalOverview;
