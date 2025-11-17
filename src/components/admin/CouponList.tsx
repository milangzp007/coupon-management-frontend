import { useState, useEffect } from 'react';
import { Coupon, DiscountType, UserSegment, CreateCouponDto } from '../../types';
import { apiService } from '../../services/api';
import { CATEGORIES } from '../../utils/categories';
import { PAYMENT_METHODS } from '../../utils/paymentMethods';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import {
  Ticket,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Tag,
  AlertCircle,
  Loader2,
  Save,
  X,
} from 'lucide-react';

export function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editDiscountType, setEditDiscountType] = useState<DiscountType | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editApplicableCategories, setEditApplicableCategories] = useState<string[]>([]);
  const [editApplicableProducts, setEditApplicableProducts] = useState<string>('');
  const [editExcludedCategories, setEditExcludedCategories] = useState<string[]>([]);
  const [editExcludedProducts, setEditExcludedProducts] = useState<string>('');
  const [editMinPurchaseCount, setEditMinPurchaseCount] = useState<string>('');
  const [editPaymentMethods, setEditPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    fetchCoupons();
  }, [filterStatus, searchTerm]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus !== 'all') {
        filters.isActive = filterStatus === 'active';
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }
      const data = await apiService.getAllCoupons(filters);
      setCoupons(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiService.toggleCouponStatus(id);
      fetchCoupons();
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      alert('Failed to toggle coupon status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiService.deleteCoupon(id);
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Failed to delete coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditDiscountType(coupon.discountType);
    setEditStartDate(new Date(coupon.startDate).toISOString().split('T')[0]);
    setEditEndDate(new Date(coupon.endDate).toISOString().split('T')[0]);
    setEditApplicableCategories(coupon.applicableCategories || []);
    setEditApplicableProducts(coupon.applicableProducts?.join(', ') || '');
    setEditExcludedCategories(coupon.excludedCategories || []);
    setEditExcludedProducts(coupon.excludedProducts?.join(', ') || '');
    setEditMinPurchaseCount(coupon.minPurchaseCount?.toString() || '');
    setEditPaymentMethods(coupon.paymentMethods || []);
    setEditError(null);
  };

  const handleUpdateCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCoupon) return;

    setEditError(null);
    setEditLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const startDateStr = editStartDate || (formData.get('startDate') as string);
      const endDateStr = editEndDate || (formData.get('endDate') as string);
      
      // Validate dates
      if (startDateStr && endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only
        
        // Check if start date is in the past
        if (startDate < today) {
          setEditError('Start date must be today or a future date');
          setEditLoading(false);
          return;
        }
        
        // Check if end date is in the past
        if (endDate < today) {
          setEditError('End date must be today or a future date');
          setEditLoading(false);
          return;
        }
        
        if (startDate >= endDate) {
          setEditError('Start date must be before end date');
          setEditLoading(false);
          return;
        }
      }

      // Validate category overlap: categories cannot be in both applicable and excluded
      if (
        editApplicableCategories.length > 0 &&
        editExcludedCategories.length > 0
      ) {
        const overlap = editApplicableCategories.filter((cat) =>
          editExcludedCategories.includes(cat),
        );
        if (overlap.length > 0) {
          setEditError(
            `Categories cannot be in both applicable and excluded lists: ${overlap.join(', ')}`,
          );
          setEditLoading(false);
          return;
        }
      }

      // Validate product overlap: products cannot be in both applicable and excluded
      const applicableProductsList = editApplicableProducts
        ? editApplicableProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
        : [];
      const excludedProductsList = editExcludedProducts
        ? editExcludedProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
        : [];

      if (applicableProductsList.length > 0 && excludedProductsList.length > 0) {
        const overlap = applicableProductsList.filter((prod) =>
          excludedProductsList.includes(prod),
        );
        if (overlap.length > 0) {
          setEditError(
            `Products cannot be in both applicable and excluded lists: ${overlap.join(', ')}`,
          );
          setEditLoading(false);
          return;
        }
      }
      
      const isActiveCheckbox = e.currentTarget.querySelector<HTMLInputElement>('input[name="isActive"]');
      
      const updateData: Partial<CreateCouponDto> = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        discountType: formData.get('discountType') as DiscountType,
        discountValue: parseFloat(formData.get('discountValue') as string),
        minOrderValue: parseFloat(formData.get('minOrderValue') as string),
        maxDiscountCap: formData.get('maxDiscountCap')
          ? parseFloat(formData.get('maxDiscountCap') as string)
          : undefined,
        startDate: new Date(startDateStr).toISOString(),
        endDate: new Date(endDateStr).toISOString(),
        isActive: isActiveCheckbox?.checked ?? false,
        totalUsageLimit: formData.get('totalUsageLimit')
          ? parseInt(formData.get('totalUsageLimit') as string)
          : undefined,
        perUserLimit: formData.get('perUserLimit')
          ? parseInt(formData.get('perUserLimit') as string)
          : undefined,
        userSegment: (formData.get('userSegment') as UserSegment) || 'all',
        applicableCategories: editApplicableCategories.length > 0 ? editApplicableCategories : undefined,
        applicableProducts: editApplicableProducts
          ? editApplicableProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
          : undefined,
        excludedCategories: editExcludedCategories.length > 0 ? editExcludedCategories : undefined,
        excludedProducts: editExcludedProducts
          ? editExcludedProducts.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
          : undefined,
        minPurchaseCount: editMinPurchaseCount ? parseInt(editMinPurchaseCount) : undefined,
        paymentMethods: editPaymentMethods.length > 0 ? editPaymentMethods : undefined,
      };

      await apiService.updateCoupon(editingCoupon.id, updateData);
      setEditingCoupon(null);
      setEditStartDate('');
      setEditEndDate('');
      setEditApplicableCategories([]);
      setEditApplicableProducts('');
      setEditExcludedCategories([]);
      setEditExcludedProducts('');
      setEditMinPurchaseCount('');
      setEditPaymentMethods([]);
      fetchCoupons();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update coupon');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredCoupons = coupons;

  const getStatusColor = (coupon: Coupon) => {
    if (!coupon.isActive) return 'bg-gray-100 text-gray-800 border-gray-300';

    const now = new Date();
    const end = new Date(coupon.endDate);

    if (now > end) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusText = (coupon: Coupon) => {
    if (!coupon.isActive) return 'Inactive';

    const now = new Date();
    const end = new Date(coupon.endDate);

    if (now > end) return 'Expired';
    return 'Active';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">All Coupons</h2>
          <p className="text-slate-400 mt-1">Manage and monitor all coupon codes</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
          <Ticket className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-white">
            {filteredCoupons.length} coupon{filteredCoupons.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or title..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-all overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {coupon.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(coupon)}`}
                    >
                      {getStatusText(coupon)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-400" />
                      <span className="font-mono text-lg font-bold text-blue-400">{coupon.code}</span>
                    </div>
                    <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-bold">
                      {getDiscountBadge(coupon)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{coupon.description}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCoupon(coupon)}
                    className="p-2 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="p-2 bg-slate-700 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg transition-all"
                    title="Edit Coupon"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(coupon.id)}
                    className="p-2 bg-slate-700 hover:bg-green-600 text-slate-300 hover:text-white rounded-lg transition-all"
                    title="Toggle Status"
                  >
                    {coupon.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-all"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Min Order Value</p>
                  <p className="text-sm font-medium text-white">₹{coupon.minOrderValue}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Usage</p>
                  <p className="text-sm font-medium text-white">
                    {coupon.currentUsageCount}
                    {coupon.totalUsageLimit && ` / ${coupon.totalUsageLimit}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Valid Till</p>
                  <p className="text-sm font-medium text-white">{new Date(coupon.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">User Segment</p>
                  <p className="text-sm font-medium text-white capitalize">
                    {coupon.userSegment?.replace('_', ' ') || 'All'}
                  </p>
                </div>
              </div>

              {coupon.totalUsageLimit && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Usage Progress</span>
                    <span>{Math.round((coupon.currentUsageCount / coupon.totalUsageLimit) * 100)}%</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${(coupon.currentUsageCount / coupon.totalUsageLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCoupon && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedCoupon(null)}
        >
          <div
            className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedCoupon.title}</h3>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-400" />
                    <span className="font-mono text-xl font-bold text-blue-400">{selectedCoupon.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCoupon(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-base font-semibold text-slate-300 mb-2">Description</h4>
                <p className="text-white">{selectedCoupon.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-base font-semibold text-slate-300 mb-3">Discount Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white capitalize">{selectedCoupon.discountType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Value</span>
                      <span className="text-white">
                        {selectedCoupon.discountType === 'percentage'
                          ? `${selectedCoupon.discountValue}%`
                          : `₹${selectedCoupon.discountValue}`}
                      </span>
                    </div>
                    {selectedCoupon.maxDiscountCap && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Cap</span>
                        <span className="text-white">₹{selectedCoupon.maxDiscountCap}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Order</span>
                      <span className="text-white">₹{selectedCoupon.minOrderValue}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-slate-300 mb-3">Usage Limits</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Usage</span>
                      <span className="text-white">{selectedCoupon.currentUsageCount}</span>
                    </div>
                    {selectedCoupon.totalUsageLimit && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Limit</span>
                        <span className="text-white">{selectedCoupon.totalUsageLimit}</span>
                      </div>
                    )}
                    {selectedCoupon.perUserLimit && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Per User Limit</span>
                        <span className="text-white">{selectedCoupon.perUserLimit}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-300 mb-3">Validity Period</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400">Start:</span>
                    <span className="text-white">{new Date(selectedCoupon.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-400" />
                    <span className="text-slate-400">End:</span>
                    <span className="text-white">{new Date(selectedCoupon.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-300 mb-4">Targeting & Restrictions</h4>
                <div className="space-y-6 pl-4 border-l-2 border-slate-700">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">User Targeting</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">User Segment</span>
                          <span className="text-white capitalize">
                            {selectedCoupon.userSegment?.replace('_', ' ') || 'All Users'}
                          </span>
                        </div>
                        {selectedCoupon.minPurchaseCount && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Min Purchase Count</span>
                            <span className="text-white">{selectedCoupon.minPurchaseCount} orders</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedCoupon.isActive
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-gray-900/30 text-gray-400'
                          }`}>
                            {selectedCoupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">Payment Methods</h5>
                      {selectedCoupon.paymentMethods && selectedCoupon.paymentMethods.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCoupon.paymentMethods.map((method) => (
                            <span
                              key={method}
                              className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-medium capitalize"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-200 text-sm font-medium">All payment methods</span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">Applicable Categories</h5>
                      {selectedCoupon.applicableCategories && selectedCoupon.applicableCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCoupon.applicableCategories.map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-medium capitalize"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-200 text-sm font-medium">All categories</span>
                      )}
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">Excluded Categories</h5>
                      {selectedCoupon.excludedCategories && selectedCoupon.excludedCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCoupon.excludedCategories.map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-medium capitalize"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-200 text-sm font-medium">None</span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">Applicable Products</h5>
                      {selectedCoupon.applicableProducts && selectedCoupon.applicableProducts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCoupon.applicableProducts.map((productId) => (
                            <span
                              key={productId}
                              className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-mono"
                            >
                              {productId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-200 text-sm font-medium">All products</span>
                      )}
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">Excluded Products</h5>
                      {selectedCoupon.excludedProducts && selectedCoupon.excludedProducts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCoupon.excludedProducts.map((productId) => (
                            <span
                              key={productId}
                              className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-mono"
                            >
                              {productId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-200 text-sm font-medium">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-base font-semibold text-slate-300 mb-3">Metadata</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created At</span>
                    <span className="text-white">
                      {new Date(selectedCoupon.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Updated</span>
                    <span className="text-white">
                      {new Date(selectedCoupon.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCoupon && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto"
          onClick={() => {
            setEditingCoupon(null);
            setEditStartDate('');
            setEditEndDate('');
          }}
        >
          <div
            className="bg-slate-800 rounded-2xl max-w-3xl w-full my-8 shadow-2xl animate-scaleIn border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Edit Coupon</h3>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-400" />
                    <span className="font-mono text-lg font-bold text-blue-400">{editingCoupon.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingCoupon(null);
                    setEditStartDate('');
                    setEditEndDate('');
                    setEditApplicableCategories([]);
                    setEditApplicableProducts('');
                    setEditExcludedCategories([]);
                    setEditExcludedProducts('');
                    setEditMinPurchaseCount('');
                    setEditPaymentMethods([]);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateCoupon} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingCoupon.title}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discount Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="discountType"
                    required
                    defaultValue={editingCoupon.discountType}
                    onChange={(e) => setEditDiscountType(e.target.value as DiscountType)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  defaultValue={editingCoupon.description}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discount Value <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={editingCoupon.discountValue}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {(editDiscountType || editingCoupon.discountType) === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      name="maxDiscountCap"
                      min="0"
                      step="0.01"
                      defaultValue={editingCoupon.maxDiscountCap || ''}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Min Order Value (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="minOrderValue"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={editingCoupon.minOrderValue}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={editEndDate || undefined}
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
                    name="endDate"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    min={editStartDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">Must be today or a future date, and after start date</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">User Segment</label>
                  <select
                    name="userSegment"
                    defaultValue={editingCoupon.userSegment || 'all'}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="new_users">New Users Only</option>
                    <option value="premium_users">Premium Users Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Total Usage Limit</label>
                  <input
                    type="number"
                    name="totalUsageLimit"
                    min="0"
                    defaultValue={editingCoupon.totalUsageLimit || ''}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Per User Limit</label>
                  <input
                    type="number"
                    name="perUserLimit"
                    min="0"
                    defaultValue={editingCoupon.perUserLimit || ''}
                    placeholder="Unlimited"
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
                    value={editMinPurchaseCount}
                    onChange={(e) => setEditMinPurchaseCount(e.target.value)}
                    placeholder="User must have X previous orders"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <MultiSelectDropdown
                    label="Payment Methods"
                    options={PAYMENT_METHODS}
                    selected={editPaymentMethods}
                    onChange={(selected) => setEditPaymentMethods(selected)}
                    placeholder="Select payment methods"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <MultiSelectDropdown
                    label="Applicable Categories"
                    options={CATEGORIES.filter(
                      (cat) => !editExcludedCategories.includes(cat),
                    )}
                    selected={editApplicableCategories}
                    onChange={(selected) => {
                      // Remove any categories that are in excluded list
                      const filtered = selected.filter(
                        (cat) => !editExcludedCategories.includes(cat),
                      );
                      setEditApplicableCategories(filtered);
                    }}
                    placeholder="Select applicable categories"
                  />
                  {editApplicableCategories.some((cat) =>
                    editExcludedCategories.includes(cat),
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
                    value={editApplicableProducts}
                    onChange={(e) => setEditApplicableProducts(e.target.value)}
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
                      (cat) => !editApplicableCategories.includes(cat),
                    )}
                    selected={editExcludedCategories}
                    onChange={(selected) => {
                      // Remove any categories that are in applicable list
                      const filtered = selected.filter(
                        (cat) => !editApplicableCategories.includes(cat),
                      );
                      setEditExcludedCategories(filtered);
                    }}
                    placeholder="Select excluded categories"
                  />
                  {editExcludedCategories.some((cat) =>
                    editApplicableCategories.includes(cat),
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
                    value={editExcludedProducts}
                    onChange={(e) => setEditExcludedProducts(e.target.value)}
                    placeholder="product-id-1, product-id-2 (comma-separated)"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">Enter product IDs to exclude, separated by commas</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    value="true"
                    defaultChecked={editingCoupon.isActive}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-300">Active</span>
                </label>
              </div>

              {editError && (
                <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{editError}</p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-700 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCoupon(null);
                    setEditStartDate('');
                    setEditEndDate('');
                    setEditApplicableCategories([]);
                    setEditApplicableProducts('');
                    setEditExcludedCategories([]);
                    setEditExcludedProducts('');
                    setEditMinPurchaseCount('');
                    setEditPaymentMethods([]);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Update Coupon
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
