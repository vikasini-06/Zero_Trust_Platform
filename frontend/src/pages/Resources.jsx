import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FolderLock,
  Search,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import ZeroTrustModal from '../components/ZeroTrustModal';
import SecurityBadge from '../components/SecurityBadge';
import { useNavigate, Link } from 'react-router-dom';

export const Resources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const res = await api.get('/access-requests/resources');
        if (res.success) {
          setResources(res.data);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const categories = ['ALL', ...new Set(resources.map((r) => r.category))];

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || res.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleLaunch = (res) => {
    setSelectedResource(res);
    setIsModalOpen(true);
  };

  const handleRequestAccess = (res) => {
    navigate('/access-requests', { state: { targetResource: res } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderLock className="w-6 h-6 text-cyan-400" /> Enterprise Protected Resources
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            "Never Trust, Always Verify" • All resources protected by continuous perimeter verification
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applications, repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Resources */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          Querying enterprise resources catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          No resources match filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((res) => (
            <div
              key={res._id || res.resourceId}
              className="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {res.requiresMFA && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold"
                        title="Requires Second Factor TOTP"
                      >
                        MFA REQ
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        res.classification === 'RESTRICTED'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : res.classification === 'CONFIDENTIAL'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {res.classification}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="text-slate-200">{res.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware Trust:</span>
                    <span className="text-cyan-400">{res.minTrustLevel} Trust Req</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authorized Roles:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">
                      {res.requiredRole.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <Link
                  to={`/resources/${res.resourceId || res._id}`}
                  className="px-3 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono transition-all text-center"
                >
                  Posture Check
                </Link>
                <button
                  onClick={() => handleLaunch(res)}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/15"
                >
                  <span>Verify & Access</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zero Trust Live Decision Modal */}
      <ZeroTrustModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestAccess={handleRequestAccess}
      />
    </div>
  );
};

export default Resources;
