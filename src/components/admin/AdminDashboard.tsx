import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CouponList } from './CouponList';
import { CreateCoupon } from './CreateCoupon';
import { Analytics } from './Analytics';
import { LayoutDashboard, Ticket, PlusCircle, LogOut, Shield } from 'lucide-react';

type Tab = 'dashboard' | 'coupons' | 'create';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'coupons' as Tab, label: 'All Coupons', icon: Ticket },
    { id: 'create' as Tab, label: 'Create Coupon', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-800 shadow-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CouponHub Admin</h1>
                <p className="text-xs text-slate-400">Management Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
                <Shield className="w-4 h-4 text-blue-400" />
                <div className="text-sm">
                  <p className="font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 bg-slate-800 p-2 rounded-xl shadow-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 transform scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && <Analytics isDashboard />}
          {activeTab === 'coupons' && <CouponList />}
          {activeTab === 'create' && <CreateCoupon />}
        </div>
      </div>
    </div>
  );
}
