import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CartItem, Coupon, ValidateCouponResponse, RecommendCouponResponse } from '../../types';
import { apiService } from '../../services/api';
import { ShoppingBag, Plus, Minus, Trash2, Tag, CheckCircle, XCircle, AlertCircle, Sparkles, Loader2, ChevronDown, ChevronUp, Star, Zap } from 'lucide-react';

// Sample products for demo purposes - In a production app, these would come from a Products API
// These are kept here for UI demonstration only and are not part of the coupon management system
const sampleProducts = [
  { id: 'p1', name: 'Wireless Headphones', price: 1500, category: 'electronics' },
  { id: 'p2', name: 'Smart Watch', price: 2500, category: 'electronics' },
  { id: 'p3', name: 'Running Shoes', price: 3000, category: 'sports' },
  { id: 'p4', name: 'Coffee Beans (1kg)', price: 800, category: 'groceries' },
  { id: 'p5', name: 'Yoga Mat', price: 1200, category: 'sports' },
  { id: 'p6', name: 'Novel Book Set', price: 600, category: 'books' },
  { id: 'p7', name: 'Skincare Set', price: 1800, category: 'beauty' },
  { id: 'p8', name: 'T-Shirt', price: 500, category: 'fashion' },
];

export function ShoppingCart() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateCouponResponse | null>(null);
  const [showDiscountBreakdown, setShowDiscountBreakdown] = useState(false);
  const [recommendedCoupons, setRecommendedCoupons] = useState<RecommendCouponResponse | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const isInitialMount = useRef(true);
  const revalidatingRef = useRef(false);
  const lastCartItemsRef = useRef<CartItem[]>([]);

  const addToCart = (productId: string) => {
    const product = sampleProducts.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find((item) => item.productId === productId);
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          category: product.category,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(
      cartItems
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  const cartValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const revalidateCoupon = async (coupon: Coupon) => {
    if (cartItems.length === 0 || revalidatingRef.current) return;

    revalidatingRef.current = true;
    setValidating(true);
    setCouponError('');

    try {
      const items = cartItems.map(item => ({
        productId: item.productId,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));

      const result = await apiService.validateCoupon(coupon.code, {
        cartValue,
        items,
        paymentMethod: 'card',
      });

      setValidationResult(result);

      if (result.valid && result.discount !== undefined) {
        setCouponError('');
      } else {
        // If coupon becomes invalid, remove it
        setAppliedCoupon(null);
        setCouponError(result.message || 'Coupon is no longer valid for current cart');
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Failed to re-validate coupon');
      // On error, keep the coupon but show error
    } finally {
      setValidating(false);
      revalidatingRef.current = false;
    }
  };

  const fetchRecommendations = async () => {
    if (cartItems.length === 0) {
      setRecommendedCoupons(null);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const items = cartItems.map(item => ({
        productId: item.productId,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));

      const recommendations = await apiService.recommendCoupons({
        cartValue,
        items,
      });

      setRecommendedCoupons(recommendations);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      // Don't show error to user, just silently fail
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Re-validate coupon when cart items change
  useEffect(() => {
    // Check if cart items actually changed (by comparing with previous value)
    const cartItemsChanged = JSON.stringify(cartItems) !== JSON.stringify(lastCartItemsRef.current);
    
    if (cartItemsChanged || isInitialMount.current) {
      lastCartItemsRef.current = cartItems;
      
      // Fetch recommendations when cart changes (including initial mount)
      if (cartItems.length > 0) {
        fetchRecommendations();
      } else {
        setRecommendedCoupons(null);
      }
      
      // Skip re-validation on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      
      // Only re-validate if a coupon is applied and cart has items
      if (appliedCoupon && cartItems.length > 0) {
        revalidateCoupon(appliedCoupon);
      } else if (cartItems.length === 0 && appliedCoupon) {
        // If cart is empty, remove coupon
        setAppliedCoupon(null);
        setValidationResult(null);
        setCouponError('');
      }
    }
  }, [cartItems, appliedCoupon]); // Re-run when cart items or applied coupon changes

  const applyCouponByCode = async (code: string) => {
    if (!code || cartItems.length === 0) return;

    setCouponError('');
    setValidating(true);
    setValidationResult(null);

    try {
      const items = cartItems.map(item => ({
        productId: item.productId,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }));

      const result = await apiService.validateCoupon(code, {
        cartValue,
        items,
        paymentMethod: 'card',
      });

      setValidationResult(result);

      if (result.valid && result.discount !== undefined) {
        // Fetch coupon details to show in UI
        const coupons = await apiService.getAvailableCoupons();
        const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());
        if (coupon) {
          setAppliedCoupon(coupon);
        }
        setCouponCode('');
        setShowDiscountBreakdown(false);
      } else {
        setCouponError(result.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Failed to validate coupon');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    await applyCouponByCode(couponCode);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setValidationResult(null);
    setShowDiscountBreakdown(false);
  };

  const calculateDiscount = (): number => {
    if (!appliedCoupon) return 0;
    
    // Use validation result discount if available, otherwise calculate
    if (validationResult?.discount !== undefined) {
      return validationResult.discount;
    }

    if (appliedCoupon.discountType === 'percentage') {
      const discount = (cartValue * appliedCoupon.discountValue) / 100;
      return Math.min(discount, appliedCoupon.maxDiscountCap || discount);
    } else if (appliedCoupon.discountType === 'fixed_amount') {
      return Math.min(appliedCoupon.discountValue, cartValue);
    } else if (appliedCoupon.discountType === 'free_delivery') {
      return appliedCoupon.discountValue;
    }
    return 0;
  };

  const discount = calculateDiscount();
  
  const getProductName = (productId: string): string => {
    const item = cartItems.find(i => i.productId === productId);
    return item?.name || productId;
  };
  const finalAmount = Math.max(0, cartValue - discount);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setProcessing(true);
    try {
      const orderData = {
        orderValue: cartValue,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          category: item.category,
        })),
        paymentMethod: 'card',
        couponCode: appliedCoupon?.code,
        deliveryCharge: 50,
      };

      await apiService.createOrder(orderData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCartItems([]);
        setAppliedCoupon(null);
      }, 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            Add Products to Cart
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {sampleProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                </div>
                <button
                  onClick={() => addToCart(product.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Items ({cartItems.length})</h3>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="w-24 text-right font-bold text-gray-900">
                    ₹{item.price * item.quantity}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Recommended Coupons Section */}
        {cartItems.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Recommended for You</h3>
            </div>
            
            {loadingRecommendations ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span className="ml-2 text-sm text-gray-600">Finding best deals...</span>
              </div>
            ) : recommendedCoupons?.bestCoupon ? (
              <div className="space-y-4">
                {/* Best Coupon */}
                <div className="bg-white rounded-lg p-4 border-2 border-yellow-400 shadow-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900">Best Deal</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      Save ₹{recommendedCoupons.bestCoupon.potentialSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-lg text-purple-600">
                        {recommendedCoupons.bestCoupon.code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{recommendedCoupons.bestCoupon.coupon.title}</p>
                  </div>
                  <button
                    onClick={() => applyCouponByCode(recommendedCoupons.bestCoupon!.code)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply This Coupon
                  </button>
                </div>

                {/* Alternative Coupons */}
                {recommendedCoupons.alternativeCoupons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Other Options:</p>
                    <div className="space-y-2">
                      {recommendedCoupons.alternativeCoupons.map((alt) => (
                        <div
                          key={alt.code}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-semibold text-purple-600">{alt.code}</span>
                                <span className="text-sm font-medium text-green-600">
                                  Save ₹{alt.potentialSavings.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">{alt.coupon.title}</p>
                            </div>
                            <button
                              onClick={() => applyCouponByCode(alt.code)}
                              className="ml-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : recommendedCoupons && !recommendedCoupons.bestCoupon ? (
              <div className="text-center py-4 text-sm text-gray-600">
                No coupons available for your cart
              </div>
            ) : null}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Apply Coupon</h3>

          {!appliedCoupon ? (
            <div className="space-y-3">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>
              <button
                onClick={applyCoupon}
                disabled={!couponCode || cartItems.length === 0 || validating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Apply Coupon'
                )}
              </button>
              {couponError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {couponError}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-900">{appliedCoupon.code}</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-green-700 hover:text-green-900 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
              <p className="text-sm text-green-800">{appliedCoupon.title}</p>
              <p className="text-xs text-green-700 mt-1">You saved ₹{discount.toFixed(2)}!</p>
              {validationResult?.nonApplicableItems && validationResult.nonApplicableItems.length > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <p className="font-semibold mb-1">Note: Not applicable on:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {validationResult.nonApplicableItems.map((item, idx) => (
                      <li key={idx}>
                        {getProductName(item.productId)} - {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Cart Value</span>
              <span className="font-medium">₹{cartValue.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">- ₹{discount.toFixed(2)}</span>
                </div>
                {validationResult?.itemDiscounts && validationResult.itemDiscounts.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowDiscountBreakdown(!showDiscountBreakdown)}
                      className="w-full flex items-center justify-between text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span>View discount breakdown</span>
                      {showDiscountBreakdown ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {showDiscountBreakdown && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Discount per product:</p>
                        {validationResult.itemDiscounts.map((itemDiscount, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-600">
                            <span className="truncate flex-1 mr-2">{getProductName(itemDiscount.productId)}</span>
                            <span className="text-green-600 font-medium">- ₹{itemDiscount.discount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || processing}
            className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-4 rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Proceed to Checkout
              </>
            )}
          </button>

          {cartItems.length === 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">Add items to cart to proceed</p>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center transform animate-scaleIn shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
            <p className="text-gray-600 mb-4">Your order has been confirmed</p>
            <div className="text-3xl font-bold text-green-600">₹{finalAmount}</div>
            {appliedCoupon && (
              <p className="text-sm text-green-600 mt-2">You saved ₹{discount} with {appliedCoupon.code}!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
