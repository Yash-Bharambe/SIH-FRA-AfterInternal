import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, XCircle, MapPin, Calendar, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { claimsService, Claim } from '../../services/claimsService';

export const MyClaims: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadClaims();
    }
  }, [user?.id]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const userClaims = await claimsService.getUserClaims(user!.id);
      const userStats = await claimsService.getUserClaimStats(user!.id);
      
      setClaims(userClaims);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
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
      <div className="forest-card bg-gradient-to-r from-forest-sage/10 to-forest-medium/10 border-forest-medium/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-forest-dark mb-2">Welcome {user?.name}</h1>
            <p className="text-forest-medium text-lg">Manage your FRA claims and track their status</p>
          </div>
          <div className="forest-badge-success">
            <div className="w-2 h-2 bg-forest-medium rounded-full animate-forest-pulse mr-2"></div>
            <span>Poduchunapadar, Odisha</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="forest-stat-card text-center">
          <div className="forest-stat-value text-forest-dark">{stats.total}</div>
          <div className="forest-stat-label">Total Claims</div>
        </div>
        <div className="forest-stat-card text-center">
          <div className="forest-stat-value text-green-600">{stats.approved}</div>
          <div className="forest-stat-label">Approved</div>
        </div>
        <div className="forest-stat-card text-center">
          <div className="forest-stat-value text-forest-accent">{stats.pending}</div>
          <div className="forest-stat-label">Pending</div>
        </div>
        <div className="forest-stat-card text-center">
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
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-forest-medium mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-forest-dark mb-2">No claims submitted yet</h3>
            <p className="text-forest-medium">Submit your first FRA claim to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="forest-card p-6 hover:shadow-forest-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-forest-sage/10 rounded-lg">
                      {getStatusIcon(claim.status)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-forest-dark mb-1">
                        Claim #{claim.id?.slice(-8)}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-forest-medium">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{claim.village}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(claim.created_at!)}</span>
                        </div>
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
                        className="p-2 text-forest-medium hover:text-forest-dark rounded-lg hover:bg-forest-sage/10 transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-forest-medium font-medium">Area:</span>
                    <p className="text-forest-dark font-semibold">{claim.area} hectares</p>
                  </div>
                  <div>
                    <span className="text-forest-medium font-medium">Coordinates:</span>
                    <p className="text-forest-dark font-semibold">
                      {claim.coordinates}
                    </p>
                  </div>
                  <div>
                    <span className="text-forest-medium font-medium">Status:</span>
                    <p className="text-forest-dark font-semibold">
                      {claim.status === 'approved' && claim.approved_at
                        ? `Approved on ${formatDate(claim.approved_at)}`
                        : claim.status.charAt(0).toUpperCase() + claim.status.slice(1)
                      }
                    </p>
                  </div>
                </div>

                {claim.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      This claim was rejected. Please review the requirements and submit a new claim.
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
