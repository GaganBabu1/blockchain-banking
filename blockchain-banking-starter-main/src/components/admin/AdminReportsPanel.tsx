import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { Download, RefreshCw } from 'lucide-react';

export function AdminReportsPanel() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [userId, setUserId] = useState('');
  const [reportType, setReportType] = useState('dashboard');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardReport();
  }, []);

  const fetchDashboardReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/dashboard/report');
      if (response.data.success) {
        setDashboardData(response.data.report);
      }
    } catch (err) {
      setError('Failed to fetch dashboard report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(userId && { userId })
      });

      const response = await api.get(`/user/transactions/export?${params}`, {
        responseType: 'blob'
      });

      // Create a blob from the response and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportTransactionsReport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(userId && { userId })
      });

      const response = await api.get(`/admin/transactions/report?${params}`);
      if (response.data.success) {
        // Convert to CSV and download
        const csv = convertToCSV(response.data.transactions);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin-transactions-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to export report: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Report */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Dashboard Report</h2>
            <Button
              onClick={fetchDashboardReport}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading dashboard data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : dashboardData ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.totalUsers || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(dashboardData.totalDeposits || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Withdrawals</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(dashboardData.totalWithdrawals || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pending Transactions</p>
                <p className="text-2xl font-bold text-amber-600">
                  {dashboardData.pendingTransactions || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Deposits Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <Badge variant="secondary">
                      {dashboardData.depositsPending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Approved</span>
                    <Badge variant="default">
                      {dashboardData.depositsApproved || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rejected</span>
                    <Badge variant="destructive">
                      {dashboardData.depositsRejected || 0}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Withdrawals Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <Badge variant="secondary">
                      {dashboardData.withdrawalsPending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Approved</span>
                    <Badge variant="default">
                      {dashboardData.withdrawalsApproved || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rejected</span>
                    <Badge variant="destructive">
                      {dashboardData.withdrawalsRejected || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Export Reports */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Export Reports</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Filter by User ID (Optional)
            </label>
            <Input
              placeholder="Leave empty to include all users"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-2">
            <Button
              onClick={handleExportCSV}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Transactions (CSV)'}
            </Button>
            <Button
              onClick={handleExportTransactionsReport}
              disabled={exporting}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Admin Report (CSV)'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdminReportsPanel;
