import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { CouponUsage, Coupon } from '../../types';
import { History, Package, Tag, TrendingDown, Calendar, Loader2, XCircle, AlertCircle } from 'lucide-react';

interface UsageWithDetails {
  usage: CouponUsage;
  coupon?: Coupon;
}

export function UsageHistory() {
  const [usageWithDetails, setUsageWithDetails] = useState<UsageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        const usages = await apiService.getMyUsage();
        
        // Fetch coupon details for each usage (if not included in response)
        const details = await Promise.all(
          usages.map(async (usage) => {
            // If usage already has coupon data (from backend relation), use it
            if ((usage as any).coupon) {
              return { usage, coupon: (usage as any).coupon };
            }
            // Otherwise, fetch coupon details
            try {
              const coupons = await apiService.getAvailableCoupons();
              const coupon = coupons.find((c) => c.id === usage.couponId);
              return { usage, coupon };
            } catch {
              return { usage };
            }
          })
        );
        
        setUsageWithDetails(details);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage history');
        console.error('Error fetching usage history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? The coupon usage will be reverted.')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      setCancelError(null);
      
      await apiService.cancelOrder(orderId);
      
      // Refresh usage history after cancellation
      const usages = await apiService.getMyUsage();
      
      const details = await Promise.all(
        usages.map(async (usage) => {
          if ((usage as any).coupon) {
            return { usage, coupon: (usage as any).coupon };
          }
          try {
            const coupons = await apiService.getAvailableCoupons();
            const coupon = coupons.find((c) => c.id === usage.couponId);
            return { usage, coupon };
          } catch {
            return { usage };
          }
        })
      );
      
      setUsageWithDetails(details);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel order');
      console.error('Error cancelling order:', err);
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage History</h2>
          <p className="text-gray-600 mt-1">Track all your coupon redemptions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <History className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {usageWithDetails.length} coupon{usageWithDetails.length !== 1 ? 's' : ''} used
          </span>
        </div>
      </div>

      {usageWithDetails.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No usage history</h3>
          <p className="text-gray-600">Start shopping and apply coupons to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {usageWithDetails.map(({ usage, coupon }) => (
            <div
              key={usage.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                        {coupon?.title || 'Unknown Coupon'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono font-bold">
                          {coupon?.code}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            usage.status === 'applied'
                              ? 'bg-green-100 text-green-800'
                              : usage.status === 'refunded'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {usage.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{Number(usage.discountApplied).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">saved</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Order ID</p>
                      <p className="text-sm font-medium text-gray-900">{usage.orderId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Used On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(usage.usedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Original Amount</span>
                    <span className="font-medium text-gray-900">
                      ₹{Number(usage.orderValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Discount Applied</span>
                    <span className="font-medium text-green-600">
                      - ₹{Number(usage.discountApplied).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-gray-100">
                    <span className="text-gray-900">Final Amount Paid</span>
                    <span className="text-blue-600">
                      ₹{Number(usage.finalOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Cancel Order Button - Only show for applied orders */}
                {usage.status === 'applied' && usage.orderId && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {cancelError && cancellingOrderId === usage.orderId && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">Cancellation Failed</p>
                          <p className="text-xs text-red-700 mt-1">{cancelError}</p>
                        </div>
                        <button
                          onClick={() => setCancelError(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCancelError(null);
                        handleCancelOrder(usage.orderId);
                      }}
                      disabled={cancellingOrderId === usage.orderId}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {cancellingOrderId === usage.orderId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cancelling Order...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Cancel Order</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Cancelling will revert the coupon usage and refund the discount
                    </p>
                  </div>
                )}

              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-3 flex items-center justify-center gap-2 text-green-800">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">
                  You saved {Number(usage.orderValue) > 0 
                    ? Math.round((Number(usage.discountApplied) / Number(usage.orderValue)) * 100) 
                    : 0}% on this order!
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {usageWithDetails.length > 0 && (() => {
        // Only count applied usages for summary
        const appliedUsages = usageWithDetails.filter(({ usage }) => usage.status === 'applied');
        
        const totalSavings = appliedUsages.reduce((sum, { usage }) => sum + Number(usage.discountApplied), 0);
        const totalOrderValue = appliedUsages.reduce((sum, { usage }) => sum + Number(usage.orderValue), 0);
        const averageDiscount = totalOrderValue > 0 
          ? Math.round((totalSavings / totalOrderValue) * 100) 
          : 0;
        
        return (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Total Savings Summary</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <div className="text-4xl font-bold">
                  ₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-blue-100 mt-1">Total Savings</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{appliedUsages.length}</div>
                <div className="text-blue-100 mt-1">Coupons Used</div>
              </div>
              <div>
                <div className="text-4xl font-bold">
                  {averageDiscount}%
                </div>
                <div className="text-blue-100 mt-1">Average Discount</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
