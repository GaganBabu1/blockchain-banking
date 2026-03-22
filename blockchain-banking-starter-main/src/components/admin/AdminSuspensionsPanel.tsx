import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
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
import { Lock, Unlock, AlertTriangle } from 'lucide-react';

export function AdminSuspensionsPanel() {
  const [suspensions, setSuspensions] = useState([]);
  const [filteredSuspensions, setFilteredSuspensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSeverity, setSuspendSeverity] = useState('temporary');
  const [suspendUntil, setSuspendUntil] = useState('');
  const [suspendNotes, setSuspendNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSuspensions();
  }, []);

  useEffect(() => {
    filterSuspensions();
  }, [suspensions, searchTerm]);

  const fetchSuspensions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/suspensions');
      if (response.data.success) {
        setSuspensions(response.data.suspensions);
      }
    } catch (err) {
      setError('Failed to fetch suspensions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterSuspensions = () => {
    let filtered = suspensions;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.userId._id.includes(searchTerm)
      );
    }

    setFilteredSuspensions(filtered);
  };

  const handleSuspendClick = (user) => {
    setSelectedUser(user);
    setSuspendReason('');
    setSuspendSeverity('temporary');
    setSuspendUntil('');
    setSuspendNotes('');
    setShowSuspendDialog(true);
  };

  const handleUnsuspendClick = (suspension) => {
    setSelectedUser(suspension.userId);
    setSuspendNotes('');
    setShowUnsuspendDialog(true);
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please enter suspension reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post(
        `/admin/users/${selectedUser._id}/suspend`,
        {
          reason: suspendReason,
          severity: suspendSeverity,
          suspendUntil: suspendUntil ? new Date(suspendUntil) : null,
          notes: suspendNotes
        }
      );

      if (response.data.success) {
        alert('User suspended successfully');
        setShowSuspendDialog(false);
        fetchSuspensions();
      }
    } catch (err) {
      alert('Failed to suspend user: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    setProcessing(true);
    try {
      const response = await api.post(
        `/admin/users/${selectedUser._id}/unsuspend`,
        {
          notes: suspendNotes
        }
      );

      if (response.data.success) {
        alert('User unsuspended successfully');
        setShowUnsuspendDialog(false);
        fetchSuspensions();
      }
    } catch (err) {
      alert('Failed to unsuspend user: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'permanent':
        return 'destructive';
      case 'temporary':
        return 'secondary';
      case 'warning':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isSuspensionExpired = (suspension) => {
    if (suspension.suspendedUntil && new Date() > new Date(suspension.suspendedUntil)) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Manage User Suspensions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={fetchSuspensions} className="w-full">
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Suspended Since
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Until
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
                    Loading suspensions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredSuspensions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No suspended users found
                  </td>
                </tr>
              ) : (
                filteredSuspensions.map((suspension) => (
                  <tr key={suspension._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {suspension.userId.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {suspension.userId.email}
                    </td>
                    <td className="px-6 py-4 text-sm">{suspension.reason}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getSeverityColor(suspension.severity)}>
                        {suspension.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(suspension.suspendedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {suspension.suspendedUntil ? (
                        <span className={isSuspensionExpired(suspension) ? 'text-gray-400 line-through' : ''}>
                          {new Date(suspension.suspendedUntil).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">Indefinite</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {suspension.isSuspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnsuspendClick(suspension)}
                          className="flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" />
                          Unsuspend
                        </Button>
                      ) : (
                        <span className="text-gray-500">Active</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 text-sm text-gray-600">
          Total Suspended Users: {filteredSuspensions.length} / {suspensions.length}
        </div>
      </Card>

      {/* Suspend User Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Suspend User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  User
                </label>
                <p className="text-sm text-gray-700">
                  {selectedUser.name} ({selectedUser.email})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Suspension *
                </label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g., Violation of terms, Suspicious activity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Severity Level *
                </label>
                <select
                  value={suspendSeverity}
                  onChange={(e) => setSuspendSeverity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="warning">Warning (Temporary 7 days)</option>
                  <option value="temporary">Temporary (30 days)</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Suspension Until (for temporary)
                </label>
                <Input
                  type="datetime-local"
                  value={suspendUntil}
                  onChange={(e) => setSuspendUntil(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={suspendNotes}
                  onChange={(e) => setSuspendNotes(e.target.value)}
                  placeholder="Additional notes for admin..."
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend User Dialog */}
      <Dialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Unsuspend User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-md flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    This will re-enable the user's account
                  </p>
                  <p className="text-xs text-amber-800">
                    The user will be able to access their account and perform transactions again.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  User
                </label>
                <p className="text-sm text-gray-700">
                  {selectedUser.name} ({selectedUser.email})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unsuspension Notes
                </label>
                <textarea
                  value={suspendNotes}
                  onChange={(e) => setSuspendNotes(e.target.value)}
                  placeholder="Reason for unsuspension..."
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsuspendDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnsuspend}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Unsuspending...' : 'Unsuspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSuspensionsPanel;
