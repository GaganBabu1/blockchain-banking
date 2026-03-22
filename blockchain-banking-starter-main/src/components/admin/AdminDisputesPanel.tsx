import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Table } from '../common/Table';
import { Input } from '../common/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export function AdminDisputesPanel() {
  const [disputes, setDisputes] = useState([]);
  const [filteredDisputes, setFilteredDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    filterDisputes();
  }, [disputes, searchTerm, filterStatus]);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/disputes');
      if (response.data.success) {
        setDisputes(response.data.disputes);
      }
    } catch (err) {
      setError('Failed to fetch disputes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterDisputes = () => {
    let filtered = disputes;

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d._id.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    setFilteredDisputes(filtered);
  };

  const handleResolveClick = (dispute) => {
    setSelectedDispute(dispute);
    setResolution('');
    setRefundAmount(dispute.refundAmount || '');
    setShowResolveDialog(true);
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert('Please enter resolution details');
      return;
    }

    setResolving(true);
    try {
      const response = await api.post(
        `/admin/disputes/${selectedDispute._id}/resolve`,
        {
          resolution,
          refundAmount: parseFloat(refundAmount) || 0,
          notes: ''
        }
      );

      if (response.data.success) {
        alert('Dispute resolved successfully');
        setShowResolveDialog(false);
        fetchDisputes();
      }
    } catch (err) {
      alert('Failed to resolve dispute: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'investigating':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'investigating':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Manage Disputes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <Button onClick={fetchDisputes} className="w-full">
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Dispute ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading disputes...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No disputes found
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => (
                  <tr key={dispute._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {dispute._id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm">{dispute.title}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="outline">
                        {dispute.category?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getStatusColor(dispute.status)}>
                        {dispute.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getPriorityColor(dispute.priority)}>
                        {dispute.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ${dispute.refundAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {dispute.status === 'open' || dispute.status === 'investigating' ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolveClick(dispute)}
                        >
                          Resolve
                        </Button>
                      ) : (
                        <span className="text-gray-500">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 text-sm text-gray-600">
          Total Disputes: {filteredDisputes.length} / {disputes.length}
        </div>
      </Card>

      {/* Resolve Dispute Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Dispute Title
                </label>
                <p className="text-sm text-gray-700">{selectedDispute.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <p className="text-sm text-gray-700">{selectedDispute.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Resolution Details *
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution details..."
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Refund Amount (if applicable)
                </label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDisputesPanel;
