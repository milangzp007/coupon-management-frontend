import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Coupon, CouponUsage } from '../../types';
import { apiService } from '../../services/api';
import { Ticket, Calendar, Tag, Users, TrendingUp, Copy, Check, Sparkles, Loader2, XCircle } from 'lucide-react';

export function AvailableCoupons() {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userUsage, setUserUsage] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [couponsData, usageData] = await Promise.all([
          apiService.getAvailableCoupons(),
          apiService.getMyUsage(),
        ]);
        setCoupons(couponsData);
        setUserUsage(usageData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load coupons');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate user-specific usage count for each coupon
  const couponUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    userUsage.forEach((usage) => {
      if (usage.status === 'applied') {
        const current = map.get(usage.couponId) || 0;
        map.set(usage.couponId, current + 1);
      }
    });
    return map;
  }, [userUsage]);

  const eligibleCoupons = coupons;

  const getUserUsageCount = (couponId: string): number => {
    return couponUsageMap.get(couponId) || 0;
  };

  const isUserLimitReached = (coupon: Coupon): boolean => {
    if (!coupon.perUserLimit) return false;
    const userUsageCount = getUserUsageCount(coupon.id);
    return userUsageCount >= coupon.perUserLimit;
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountBadge = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else if (coupon.discountType === 'fixed_amount') {
      return `₹${coupon.discountValue} OFF`;
    } else {
      return 'FREE DELIVERY';
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-amber-500 to-amber-600',
      'from-red-500 to-red-600',
      'from-purple-500 to-purple-600',
      'from-teal-500 to-teal-600',
    ];
    return gradients[index % gradients.length];
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
          <h2 className="text-2xl font-bold text-gray-900">Available Coupons</h2>
          <p className="text-gray-600 mt-1">
            {eligibleCoupons.length} coupon{eligibleCoupons.length !== 1 ? 's' : ''} available for you
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Special offers just for you!</span>
        </div>
      </div>

      {eligibleCoupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons available</h3>
          <p className="text-gray-600">Check back later for new offers!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eligibleCoupons.map((coupon, index) => {
            const userUsageCount = getUserUsageCount(coupon.id);
            const usageLeft = coupon.perUserLimit ? coupon.perUserLimit - userUsageCount : null;
            const limitReached = isUserLimitReached(coupon);

            return (
            <div
              key={coupon.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform group relative ${
                limitReached
                  ? 'opacity-60 blur-sm cursor-not-allowed'
                  : 'hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {limitReached && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/50 rounded-xl">
                  <div className="bg-white rounded-lg p-4 shadow-xl text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">Usage Limit Reached</p>
                    <p className="text-xs text-gray-600 mt-1">You've used this coupon {userUsageCount} time{userUsageCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              <div className={`bg-gradient-to-r ${getGradient(index)} p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-sm font-bold">
                      {getDiscountBadge(coupon)}
                    </span>
                    <Ticket className="w-6 h-6 opacity-80" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{coupon.title}</h3>
                  <div className="flex items-center gap-2 text-white/90">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono text-lg font-bold tracking-wider">{coupon.code}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">{coupon.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>Min order: ₹{coupon.minOrderValue}</span>
                  </div>
                  {coupon.maxDiscountCap && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span>Max discount: ₹{coupon.maxDiscountCap}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Valid till {new Date(coupon.endDate).toLocaleDateString()}</span>
                  </div>
                  {coupon.userSegment && coupon.userSegment !== 'all' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {coupon.userSegment === 'new_users' ? 'New Users Only' : 'Premium Members Only'}
                      </span>
                    </div>
                  )}
                  {coupon.applicableCategories && coupon.applicableCategories.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Tag className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-gray-500">Applicable on: </span>
                        <span className="text-gray-700 font-medium">
                          {coupon.applicableCategories.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                  {coupon.excludedCategories && coupon.excludedCategories.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-gray-500">Not applicable on: </span>
                        <span className="text-gray-700 font-medium">
                          {coupon.excludedCategories.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !limitReached && handleCopy(coupon.code)}
                    disabled={limitReached}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      limitReached
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : copiedCode === coupon.code
                        ? 'bg-green-50 text-green-700 border-2 border-green-500'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className={limitReached ? 'text-gray-400' : 'text-gray-500'}>
                      Used {userUsageCount} time{userUsageCount !== 1 ? 's' : ''}
                    </span>
                    {usageLeft !== null && (
                      <span className={limitReached ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                        {usageLeft > 0 ? `${usageLeft} left` : 'Limit reached'}
                      </span>
                    )}
                  </div>
                  {coupon.perUserLimit && (
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          limitReached
                            ? 'bg-red-500'
                            : `bg-gradient-to-r ${getGradient(index)}`
                        }`}
                        style={{
                          width: `${Math.min((userUsageCount / coupon.perUserLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
