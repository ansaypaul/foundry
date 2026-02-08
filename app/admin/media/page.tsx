'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MediaManager from './MediaManager';

export default function MediaPage() {
  const searchParams = useSearchParams();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/sites')
      .then(res => res.json())
      .then(data => {
        setSites(data.sites || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Médias</h2>
          <p className="text-gray-400 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  const preSelectedSiteId = searchParams.get('site_id') || undefined;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Médias</h2>
        <p className="text-gray-400 mt-2">
          Gérez vos images et fichiers
        </p>
      </div>

      <MediaManager sites={sites} preSelectedSiteId={preSelectedSiteId} />
    </div>
  );
}
