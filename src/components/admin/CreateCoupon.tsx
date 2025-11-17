import { useState } from 'react';
import { DiscountType, UserSegment, CreateCouponDto } from '../../types';
import { apiService } from '../../services/api';
import { CATEGORIES } from '../../utils/categories';
import { PAYMENT_METHODS } from '../../utils/paymentMethods';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { PlusCircle, CheckCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export function CreateCoupon() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: '',
    minOrderValue: '',
    maxDiscountCap: '',
    startDate: '',
    endDate: '',
    totalUsageLimit: '',
    perUserLimit: '',
    userSegment: 'all' as UserSegment,
    applicableCategories: [] as string[],
    applicableProducts: '',
    excludedCategories: [] as string[],
    excludedProducts: '',
    minPurchaseCount: '',
    paymentMethods: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      
      // Check if start date is in the past
      if (startDate < today) {
        setError('Start date must be today or a future date');
        setLoading(false);
        return;
      }
      
      // Check if end date is in the past
      if (endDate < today) {
        setError('End date must be today or a future date');
        setLoading(false);
        return;
      }
      
      if (startDate >= endDate) {
        setError('Start date must be before end date');
        setLoading(false);
        return;
      }
    }

    // Validate category overlap: categories cannot be in both applicable and excluded
    if (
      formData.applicableCategories.length > 0 &&
      formData.excludedCategories.length > 0
    ) {
      const overlap = formData.applicableCategories.filter((cat) =>
        formData.excludedCategories.includes(cat),
      );
      if (overlap.length > 0) {
        setError(
          `Categories cannot be in both applicable and excluded lists: ${overlap.join(', ')}`,
        );
        setLoading(false);
        return;
      }
    }

    // Validate product overlap: products cannot be in both applicable and excluded
    const applicableProductsList = formData.applicableProducts
      ? formData.applicableProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
      : [];
    const excludedProductsList = formData.excludedProducts
      ? formData.excludedProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
      : [];

    if (applicableProductsList.length > 0 && excludedProductsList.length > 0) {
      const overlap = applicableProductsList.filter((prod) =>
        excludedProductsList.includes(prod),
      );
      if (overlap.length > 0) {
        setError(
          `Products cannot be in both applicable and excluded lists: ${overlap.join(', ')}`,
        );
        setLoading(false);
        return;
      }
    }

    try {
      const couponData: CreateCouponDto = {
        code: formData.code,
        title: formData.title,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderValue: parseFloat(formData.minOrderValue),
        maxDiscountCap: formData.maxDiscountCap ? parseFloat(formData.maxDiscountCap) : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: true,
        totalUsageLimit: formData.totalUsageLimit ? parseInt(formData.totalUsageLimit) : undefined,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : undefined,
        userSegment: formData.userSegment,
        applicableCategories: formData.applicableCategories.length > 0 ? formData.applicableCategories : undefined,
        applicableProducts: formData.applicableProducts
          ? formData.applicableProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
          : undefined,
        excludedCategories: formData.excludedCategories.length > 0 ? formData.excludedCategories : undefined,
        excludedProducts: formData.excludedProducts
          ? formData.excludedProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
          : undefined,
        minPurchaseCount: formData.minPurchaseCount ? parseInt(formData.minPurchaseCount) : undefined,
        paymentMethods: formData.paymentMethods.length > 0 ? formData.paymentMethods : undefined,
      };

      await apiService.createCoupon(couponData);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          code: '',
          title: '',
          description: '',
          discountType: 'percentage',
          discountValue: '',
          minOrderValue: '',
          maxDiscountCap: '',
          startDate: '',
          endDate: '',
          totalUsageLimit: '',
          perUserLimit: '',
          userSegment: 'all',
          applicableCategories: [],
          applicableProducts: '',
          excludedCategories: [],
          excludedProducts: '',
          minPurchaseCount: '',
          paymentMethods: [],
        });
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <PlusCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Coupon</h2>
              <p className="text-blue-100">Add a new promotional coupon code</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Coupon Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE50"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="50% off on first order"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Get 50% discount on your first order..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discount Type <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discount Value <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === 'percentage' ? '50' : '200'}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscountCap}
                  onChange={(e) => setFormData({ ...formData, maxDiscountCap: e.target.value })}
                  placeholder="500"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Min Order Value (₹) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                placeholder="500"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User Segment <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.userSegment}
                onChange={(e) => setFormData({ ...formData, userSegment: e.target.value as UserSegment })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="new_users">New Users Only</option>
                <option value="premium_users">Premium Users Only</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                max={formData.endDate || undefined}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Must be today or a future date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Must be today or a future date, and after start date</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Total Usage Limit</label>
              <input
                type="number"
                min="0"
                value={formData.totalUsageLimit}
                onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                placeholder="1000"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Per User Limit</label>
              <input
                type="number"
                min="0"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                placeholder="5"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Min Purchase Count</label>
              <input
                type="number"
                min="0"
                value={formData.minPurchaseCount}
                onChange={(e) => setFormData({ ...formData, minPurchaseCount: e.target.value })}
                placeholder="User must have X previous orders"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <MultiSelectDropdown
                label="Payment Methods"
                options={PAYMENT_METHODS}
                selected={formData.paymentMethods}
                onChange={(selected) => setFormData({ ...formData, paymentMethods: selected })}
                placeholder="Select payment methods"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <MultiSelectDropdown
                label="Applicable Categories"
                options={CATEGORIES.filter(
                  (cat) => !formData.excludedCategories.includes(cat),
                )}
                selected={formData.applicableCategories}
                onChange={(selected) => {
                  // Remove any categories that are in excluded list
                  const filtered = selected.filter(
                    (cat) => !formData.excludedCategories.includes(cat),
                  );
                  setFormData({ ...formData, applicableCategories: filtered });
                }}
                placeholder="Select applicable categories"
              />
              {formData.applicableCategories.some((cat) =>
                formData.excludedCategories.includes(cat),
              ) && (
                <p className="text-xs text-red-400 mt-1">
                  Cannot select categories that are in excluded list
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Applicable Products</label>
              <input
                type="text"
                value={formData.applicableProducts}
                onChange={(e) => setFormData({ ...formData, applicableProducts: e.target.value })}
                placeholder="product-id-1, product-id-2 (comma-separated)"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Enter product IDs separated by commas</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <MultiSelectDropdown
                label="Excluded Categories"
                options={CATEGORIES.filter(
                  (cat) => !formData.applicableCategories.includes(cat),
                )}
                selected={formData.excludedCategories}
                onChange={(selected) => {
                  // Remove any categories that are in applicable list
                  const filtered = selected.filter(
                    (cat) => !formData.applicableCategories.includes(cat),
                  );
                  setFormData({ ...formData, excludedCategories: filtered });
                }}
                placeholder="Select excluded categories"
              />
              {formData.excludedCategories.some((cat) =>
                formData.applicableCategories.includes(cat),
              ) && (
                <p className="text-xs text-red-400 mt-1">
                  Cannot select categories that are in applicable list
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Excluded Products</label>
              <input
                type="text"
                value={formData.excludedProducts}
                onChange={(e) => setFormData({ ...formData, excludedProducts: e.target.value })}
                placeholder="product-id-1, product-id-2 (comma-separated)"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Enter product IDs to exclude, separated by commas</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="pt-6 border-t border-slate-700">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Coupon
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center transform animate-scaleIn shadow-2xl border border-slate-700">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Coupon Created!</h3>
            <p className="text-slate-400 mb-4">Your coupon has been created successfully</p>
            <div className="px-4 py-2 bg-slate-900 rounded-lg inline-block">
              <span className="font-mono text-xl font-bold text-blue-400">{formData.code}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
