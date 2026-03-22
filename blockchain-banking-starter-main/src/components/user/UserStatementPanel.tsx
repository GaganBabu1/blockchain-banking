import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { Download, RefreshCw } from 'lucide-react';

export function UserStatementPanel() {
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchStatement();
  }, [dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [page, limit]);

  const fetchStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await api.get(`/user/statement?${params}`);
      if (response.data.success) {
        setStatement(response.data.statement);
      }
    } catch (err) {
      setError('Failed to fetch statement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get(`/user/transactions?page=${page}&limit=${limit}`);
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await api.get(`/user/transactions/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export statement: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const getTransactionType = (type) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="default">Deposit</Badge>;
      case 'withdrawal':
        return <Badge variant="secondary">Withdrawal</Badge>;
      case 'transfer':
        return <Badge variant="outline">Transfer</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getTransactionStatus = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Statement Summary */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Account Statement</h2>
            <Button
              onClick={fetchStatement}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading statement...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : statement ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(statement.totalDeposits || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {statement.depositCount || 0} transactions
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Withdrawals</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(statement.totalWithdrawals || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {statement.withdrawalCount || 0} transactions
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Net Change</p>
                <p className={`text-2xl font-bold ${
                  (statement.totalDeposits || 0) - (statement.totalWithdrawals || 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  ${(
                    (statement.totalDeposits || 0) - (statement.totalWithdrawals || 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export as CSV'}
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getTransactionType(transaction.type)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getTransactionStatus(transaction.status)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {transaction.referenceNumber || transaction._id.slice(0, 8)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Page {page} | Showing {transactions.length} of records
          </div>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={transactions.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default UserStatementPanel;
