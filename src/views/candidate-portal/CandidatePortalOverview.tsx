'use client';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Bullhorn, Category, Email, Calendar, Catalog, DocumentSet, Image, Book, LetterAa, Edit } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { CandidatePortalStats } from '../../services/analytics.service';

const CandidatePortalOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<CandidatePortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = useMemo(() => getAccessIds('candidate-portal', 'candidate-portal-overview'), []);
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  useEffect(() => {
    if (!moduleId || !subModuleId) { setLoading(false); return; }
    let cancelled = false;
    analyticsService.getCandidatePortalStats({ module_unique_id: moduleId, sub_module_unique_id: subModuleId })
      .then(res => { if (!cancelled && res.success && res.data) setStats(res.data); })
      .catch(() => { if (!cancelled) setError('Failed to load candidate portal stats'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [moduleId, subModuleId]);

  return (
    <div>
      <Navbar title="Candidate Portal Overview" subtitle="Candidate portal statistics at a glance" />
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
          <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-4 xui-grid-gap-1">
            <MetricCard title="Announcements" value={stats.total_announcements} icon={<Bullhorn size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
            <MetricCard title="Categories" value={stats.total_categories} icon={<Category size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
            <MetricCard title="Enquiries" value={stats.total_enquiries} icon={<Email size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
            <MetricCard title="Events" value={stats.total_events} icon={<Calendar size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
            <MetricCard title="FAQs" value={stats.total_faqs} icon={<Catalog size={24} />} iconBgColor="#fff7ed" iconColor="#f59e0b" />
            <MetricCard title="File Storage" value={stats.total_file_storage} icon={<DocumentSet size={24} />} iconBgColor="var(--neutral-100)" iconColor="var(--neutral-600)" />
            <MetricCard title="Gallery" value={stats.total_gallery} icon={<Image size={24} />} iconBgColor="var(--info-light)" iconColor="var(--info)" />
            <MetricCard title="Manifestos" value={stats.total_manifestos} icon={<Book size={24} />} iconBgColor="var(--primary-100)" iconColor="var(--primary-700)" />
            <MetricCard title="Newsletter" value={stats.total_newsletter} icon={<LetterAa size={24} />} iconBgColor="#fce7f3" iconColor="#ed3337" />
            <MetricCard title="Posts" value={stats.total_posts} icon={<Edit size={24} />} iconBgColor="var(--success-light)" iconColor="var(--success)" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CandidatePortalOverview;
