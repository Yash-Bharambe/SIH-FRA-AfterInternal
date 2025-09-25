import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, XCircle, MapPin, Calendar, Download, Search, Trash2 } from 'lucide-react';
import { supabaseClaimsService } from '../../services/supabaseClaimsService';
import { deleteGeojsonByClaimId } from '../../services/supabaseGeoService';
import { useAuth } from '../../contexts/AuthContext';
import { Claim } from '../../services/claimsService';

type ClaimWithAck = Claim & { ack_id?: string | null; rejection_reason?: string | null };

export const MyClaims: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimWithAck[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [ackSearch, setAckSearch] = useState('');
  const [ackResult, setAckResult] = useState<Claim | null>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadClaims();
    }
  }, [user?.id]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      // fetch from Supabase, filter by user_id
      const rows = await supabaseClaimsService.listAll();
      const userRows = rows.filter(r => r.user_id === user!.id);
      const userClaims: ClaimWithAck[] = userRows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        village: r.village,
        area: r.area,
        coordinates: r.coordinates,
        document_url: r.document_url ?? undefined,
        status: r.status,
        created_at: r.created_at,
        approved_at: r.approved_at ?? undefined,
        applicantName: r.applicant_name ?? undefined,
        claimType: r.claim_type ?? undefined,
        documents: r.documents ?? undefined,
        ack_id: r.ack_id ?? undefined,
        rejection_reason: r.rejection_reason ?? undefined,
      }));
      const userStats = {
        total: userClaims.length,
        approved: userClaims.filter(c => c.status === 'approved').length,
        pending: userClaims.filter(c => c.status === 'pending').length,
        rejected: userClaims.filter(c => c.status === 'rejected').length,
      };
      
      setClaims(userClaims);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackByAck = async () => {
    if (!ackSearch.trim()) return;
    try {
      setAckLoading(true);
      setAckResult(null);
      const row = await supabaseClaimsService.getByAckId(ackSearch.trim());
      if (row) {
        const mapped: Claim = {
          id: row.id,
          user_id: row.user_id,
          village: row.village,
          area: row.area,
          coordinates: row.coordinates,
          document_url: row.document_url ?? undefined,
          status: row.status,
          created_at: row.created_at,
          approved_at: row.approved_at ?? undefined,
          applicantName: row.applicant_name ?? undefined,
          claimType: row.claim_type ?? undefined,
          documents: row.documents ?? undefined,
        };
        setAckResult(mapped);
      } else {
        setAckResult(null);
      }
    } catch (e) {
      console.error('Ack lookup failed', e);
      setAckResult(null);
    } finally {
      setAckLoading(false);
    }
  };

  const deleteClaim = async (id: string) => {
    if (!confirm('Are you sure you want to delete this claim? This action cannot be undone.')) return;
    try {
      setDeletingId(id);
      console.log('Deleting claim with ID:', id);
      
      // Remove any FRA Atlas geometry first to keep data consistent
      await deleteGeojsonByClaimId(id);
      console.log('Deleted GeoJSON for claim:', id);
      
      // Delete the claim from database
      await supabaseClaimsService.deleteById(id);
      console.log('Successfully deleted claim from database:', id);
      
      // Optimistically update UI
      setClaims(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({
        total: prev.total - 1,
        approved: prev.approved - (claims.find(c => c.id === id)?.status === 'approved' ? 1 : 0),
        pending: prev.pending - (claims.find(c => c.id === id)?.status === 'pending' ? 1 : 0),
        rejected: prev.rejected - (claims.find(c => c.id === id)?.status === 'rejected' ? 1 : 0),
      }));
      
      alert('Claim successfully deleted from database and FRA Atlas.');
    } catch (e) {
      console.error('Delete failed', e);
      alert(`Failed to delete the claim: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-forest-accent" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-forest-medium" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'forest-badge-success';
      case 'pending':
        return 'forest-badge-warning';
      case 'rejected':
        return 'forest-badge-error';
      default:
        return 'forest-badge-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="forest-card">
          <div className="flex items-center justify-center py-12">
            <div className="forest-spinner"></div>
            <span className="ml-3 text-forest-medium">Loading your claims...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="forest-card bg-gradient-to-r from-green-50 to-white border-green-200 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-forest-deep mb-2">Welcome {user?.name}</h1>
            <p className="text-forest-medium text-lg">Manage your FRA claims and track their status</p>
          </div>
          <div className="forest-badge-primary">
            <div className="w-2 h-2 bg-forest-medium rounded-full animate-forest-pulse mr-2"></div>
            <span>Poduchunapadar, Odisha</span>
          </div>
        </div>
      </div>

      {/* Track Status */}
      <div className="forest-card bg-white/90 border border-green-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-forest-medium" />
            <h3 className="text-forest-deep font-semibold">Track your claim</h3>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              value={ackSearch}
              onChange={(e) => setAckSearch(e.target.value)}
              placeholder="Enter Acknowledgment ID (e.g., FRA-240926-ABCD)"
              className="flex-1 md:w-96 px-3 py-2 border border-green-100 rounded-lg focus:outline-none focus:border-green-600 text-sm"
            />
            <button onClick={trackByAck} disabled={ackLoading} className="forest-button-secondary">
              {ackLoading ? 'Searching…' : 'Check Status'}
            </button>
          </div>
        </div>
        {ackResult && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-forest-medium font-medium">Village</span>
              <p className="text-forest-deep font-semibold">{ackResult.village}</p>
            </div>
            <div>
              <span className="text-forest-medium font-medium">Submitted</span>
              <p className="text-forest-deep font-semibold">{formatDate(ackResult.created_at!)}</p>
            </div>
            <div>
              <span className="text-forest-medium font-medium">Status</span>
              <p className="text-forest-deep font-semibold">{ackResult.status.charAt(0).toUpperCase() + ackResult.status.slice(1)}</p>
            </div>
          </div>
        )}
        {ackResult === null && ackSearch && !ackLoading && (
          <div className="mt-3 text-sm text-forest-medium">No claim found for the provided acknowledgment ID.</div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="forest-stat-card text-center bg-white/80 border border-green-100">
          <div className="forest-stat-value text-forest-dark">{stats.total}</div>
          <div className="forest-stat-label">Total Claims</div>
        </div>
        <div className="forest-stat-card text-center bg-white/80 border border-green-100">
          <div className="forest-stat-value text-green-600">{stats.approved}</div>
          <div className="forest-stat-label">Approved</div>
        </div>
        <div className="forest-stat-card text-center bg-white/80 border border-green-100">
          <div className="forest-stat-value text-forest-accent">{stats.pending}</div>
          <div className="forest-stat-label">Pending</div>
        </div>
        <div className="forest-stat-card text-center bg-white/80 border border-green-100">
          <div className="forest-stat-value text-red-600">{stats.rejected}</div>
          <div className="forest-stat-label">Rejected</div>
        </div>
      </div>

      {/* Claims List */}
      <div className="forest-chart">
        <div className="forest-chart-header">
          <h3 className="forest-chart-title">Your FRA Claims</h3>
          <div className="text-sm text-forest-medium">
            Showing {claims.length} claim{claims.length !== 1 ? 's' : ''}
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12 bg-white/80 border border-green-100 rounded-xl">
            <FileText className="h-12 w-12 text-forest-medium mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-forest-deep mb-2">No claims submitted yet</h3>
            <p className="text-forest-medium">Submit your first FRA claim to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="forest-card p-6 hover:shadow-forest-lg transition-shadow bg-white/90 border border-green-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      {getStatusIcon(claim.status)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-forest-deep mb-1">
                        Claim #{claim.id?.slice(-8)}
                      </h4>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-forest-medium">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{claim.village}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(claim.created_at!)}</span>
                        </div>
                        {claim.ack_id && (
                          <span className="px-2 py-0.5 rounded-full border border-green-100 bg-green-50 text-forest-deep text-xs font-medium">
                            Ack: {claim.ack_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`forest-badge ${getStatusColor(claim.status)}`}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </span>
                    {claim.document_url && (
                      <a
                        href={claim.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-forest-medium hover:text-forest-dark rounded-lg hover:bg-green-50 border border-green-100 transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteClaim(claim.id!)}
                      className="p-2 text-red-600 hover:text-white rounded-lg hover:bg-red-600 border border-red-200 transition-colors"
                      title="Delete Claim"
                      disabled={deletingId === claim.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-forest-medium font-medium">Area:</span>
                    <p className="text-forest-deep font-semibold">{claim.area} hectares</p>
                  </div>
                  <div>
                    <span className="text-forest-medium font-medium">Coordinates:</span>
                    <p className="text-forest-deep font-semibold">
                      {claim.coordinates}
                    </p>
                  </div>
                  <div>
                    <span className="text-forest-medium font-medium">Status:</span>
                    <p className="text-forest-deep font-semibold">
                      {claim.status === 'approved' && claim.approved_at
                        ? `Approved on ${formatDate(claim.approved_at)}`
                        : claim.status.charAt(0).toUpperCase() + claim.status.slice(1)
                      }
                    </p>
                  </div>
                </div>

                {claim.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-semibold mb-2">
                      This claim was rejected.
                    </p>
                    {claim.rejection_reason && (
                      <div className="mt-2">
                        <p className="text-sm text-red-700 font-medium">Reason for rejection:</p>
                        <p className="text-sm text-red-600 mt-1 italic">"{claim.rejection_reason}"</p>
                      </div>
                    )}
                    <p className="text-sm text-red-700 mt-2">
                      Please review the requirements and submit a new claim.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="forest-card bg-forest-dark text-white">
        <div className="text-center py-6">
          <h3 className="text-lg font-semibold mb-2">Currently showing data for Poduchunapadar – 100% Mapping Success</h3>
          <p className="text-forest-sage">
            Forest Rights Act Implementation Portal • Ministry of Tribal Affairs
          </p>
        </div>
      </div>
    </div>
  );
};
