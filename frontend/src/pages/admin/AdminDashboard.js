import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';
import { 
  Users, 
  FileText, 
  MessageSquare,
  Search,
  ChevronDown
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalCustomers: 0,
    totalEquipment: 0,
    totalPackages: 0,
    totalRevenue: 0,
    totalMessages: 0,
    newMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentData, setRecentData] = useState({
    quotes: [],
    customers: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data (quotes, equipment, customers, messages)
      const [quotesRes, customersRes, messagesAllRes, messagesNewRes] = await Promise.all([
        adminAPI.getQuotes({ limit: 5 }).catch((e) => {
          console.warn('Quotes fetch failed:', e);
          return { data: [] };
        }),
        adminAPI.getCustomers({ page: 1, limit: 5, search: '' }).catch((e) => {
          console.warn('Customers fetch failed:', e);
          return { data: [] };
        }),
        adminAPI.getMessages({ page: 1, limit: 1 }).catch((e) => {
          console.warn('Messages(all) fetch failed:', e);
          return { total: 0, items: [] };
        }),
        adminAPI.getMessages({ page: 1, limit: 1, status: 'new' }).catch((e) => {
          console.warn('Messages(new) fetch failed:', e);
          return { total: 0, items: [] };
        })
      ]);

      const quotes = quotesRes?.data || [];
      const customers = customersRes?.data || [];
      const totalMessages = typeof messagesAllRes?.total === 'number' ? messagesAllRes.total : (Array.isArray(messagesAllRes?.items) ? messagesAllRes.items.length : Array.isArray(messagesAllRes) ? messagesAllRes.length : 0);
      const newMessages = typeof messagesNewRes?.total === 'number' ? messagesNewRes.total : (Array.isArray(messagesNewRes?.items) ? messagesNewRes.items.length : Array.isArray(messagesNewRes) ? messagesNewRes.length : 0);

      setRecentData({
        quotes,
        customers
      });

      // Compute minimal stats from available data
      setStats((prev) => ({
        ...prev,
        totalQuotes: Array.isArray(quotes) ? quotes.length : 0,
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        totalMessages,
        newMessages
      }));

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error loading dashboard</div>
        <div>{error}</div>
        <button onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  const statsData = [
    { 
      title: 'Total Quotes', 
      value: stats.totalQuotes,
      icon: <FileText className="w-5 h-5" />,
      change: '+12%',
      changeType: 'increase'
    },

    { 
      title: 'Total Customers', 
      value: stats.totalCustomers,
      icon: <Users className="w-5 h-5" />,
      change: '+8%',
      changeType: 'increase'
    },
    { 
      title: 'Total Messages', 
      value: stats.totalMessages,
      icon: <MessageSquare className="w-5 h-5" />,
      change: stats.newMessages > 0 ? `+${stats.newMessages} new` : 'No new',
      changeType: stats.newMessages > 0 ? 'increase' : 'decrease'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                placeholder="Search..."
              />
            </div>
            <div className="flex items-center">
              <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, {adminUser?.name || 'Admin'}!</h2>
                <p className="mt-1 text-gray-600">Here's what's happening with your business today.</p>
              </div>
              <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                View Reports
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-black text-amber-400 rounded-md p-3 ring-1 ring-amber-400">
                    {stat.icon}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-600 truncate">{stat.title}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotes */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Quotes</h3>
              <button 
                onClick={() => navigate('/admin/quotes')}
                className="text-sm text-amber-600 hover:text-amber-500"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {recentData.quotes.length > 0 ? (
                recentData.quotes.map((quote) => (
                  <div key={quote._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-700 truncate">{quote.customerName || 'Unnamed Customer'}</p>
                        <p className="text-sm text-gray-500">{quote.eventType}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {quote.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {new Date(quote.eventDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12 text-center">
                  <p className="text-gray-500">No recent quotes found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Customers */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Customers</h3>
              <button 
                onClick={() => navigate('/admin/customers')}
                className="text-sm text-amber-600 hover:text-amber-500"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {recentData.customers.length > 0 ? (
                recentData.customers.map((customer) => (
                  <div key={customer._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                        {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0) || 'CU'}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Joined {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12 text-center">
                  <p className="text-gray-500">No recent customers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
