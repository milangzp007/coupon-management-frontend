import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { Coupon } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Ticket,
  Users,
  DollarSign,
  Activity,
  Award,
  Calendar,
  Loader2,
} from 'lucide-react';

interface AnalyticsProps {
  isDashboard?: boolean;
}

export function Analytics({ isDashboard = false }: AnalyticsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [topCouponsData, setTopCouponsData] = useState<any[]>([]);
  const [revenueImpact, setRevenueImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [couponsData, topCoupons, revenue] = await Promise.all([
          apiService.getAllCoupons(),
          apiService.getTopCoupons(5),
          apiService.getRevenueImpact(),
        ]);
        setCoupons(couponsData);
        setTopCouponsData(topCoupons);
        setRevenueImpact(revenue);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.currentUsageCount, 0);
  const totalDiscountGiven = revenueImpact?.totalDiscountGiven || 0;

  const stats = [
    {
      label: 'Total Coupons',
      value: totalCoupons,
      icon: Ticket,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      label: 'Active Coupons',
      value: activeCoupons,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
    },
    {
      label: 'Total Usage',
      value: totalUsage.toLocaleString(),
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
    },
    {
      label: 'Total Discount Given',
      value: `₹${totalDiscountGiven.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-slate-400 mt-1">Monitor coupon performance and usage metrics</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Award className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Top Performing Coupons</h3>
            <p className="text-sm text-slate-400">Most used coupon codes</p>
          </div>
        </div>

        <div className="space-y-3">
          {topCouponsData.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No coupon usage data available</p>
          ) : (
            topCouponsData.map((item, index) => (
              <div
                key={item.coupon?.id || index}
                className="p-4 bg-slate-900 rounded-lg hover:bg-slate-700/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-400">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {item.coupon?.code || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400">{item.coupon?.title || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{item.usageCount || 0}</p>
                    <p className="text-xs text-slate-400">uses</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total Discount</span>
                    <span>₹{Number(item.totalDiscount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total Revenue</span>
                    <span className="text-green-400 font-medium">₹{Number(item.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Revenue Impact Section */}
      {revenueImpact && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Revenue Impact Analysis</h3>
              <p className="text-sm text-slate-400">Comprehensive revenue and discount metrics</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 border border-emerald-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Total Orders</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {revenueImpact.totalOrders?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Orders with coupons applied</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Total Order Value</span>
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                ₹{Number(revenueImpact.totalOrderValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Gross order value</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-900/30 to-amber-800/30 border border-amber-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Total Discount Given</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                ₹{Number(revenueImpact.totalDiscountGiven || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total discounts provided</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Total Revenue</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                ₹{Number(revenueImpact.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Net revenue after discounts</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <div className="text-sm text-slate-300 mb-2">Discount Percentage</div>
              <div className="text-2xl font-bold text-white">
                {Number(revenueImpact.discountPercentage || 0).toFixed(2)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Average discount rate</p>
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <div className="text-sm text-slate-300 mb-2">Average Discount per Order</div>
              <div className="text-2xl font-bold text-white">
                ₹{Number(revenueImpact.averageDiscountPerOrder || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Per order discount</p>
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <div className="text-sm text-slate-300 mb-2">Average Order Value</div>
              <div className="text-2xl font-bold text-white">
                ₹{Number(revenueImpact.averageOrderValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Average order size</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Coupon Status Distribution</h3>
            <p className="text-sm text-slate-400">Current status of all coupons</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
            <div className="text-3xl font-bold text-green-400 mb-1">{activeCoupons}</div>
            <div className="text-sm text-slate-300">Active Coupons</div>
            <div className="text-xs text-slate-400 mt-1">
              {totalCoupons > 0 ? Math.round((activeCoupons / totalCoupons) * 100) : 0}% of total
            </div>
          </div>

          <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
            <div className="text-3xl font-bold text-red-400 mb-1">
              {coupons.filter((c) => {
                const now = new Date();
                const end = new Date(c.endDate);
                return now > end;
              }).length}
            </div>
            <div className="text-sm text-slate-300">Expired Coupons</div>
            <div className="text-xs text-slate-400 mt-1">Past end date</div>
          </div>

          <div className="p-4 bg-gray-900/20 border border-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-gray-400 mb-1">
              {coupons.filter((c) => !c.isActive).length}
            </div>
            <div className="text-sm text-slate-300">Inactive Coupons</div>
            <div className="text-xs text-slate-400 mt-1">Manually disabled</div>
          </div>
        </div>
      </div>
    </div>
  );
}
