"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  CreditCard, 
  Download, 
  Users,
  Database,
  Zap,
  Check,
  Star,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users: number;
    storage: string;
    apiCalls: string;
  };
  popular?: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      'Up to 5 team members',
      '1GB storage',
      '1,000 API calls/month',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      users: 5,
      storage: '1GB',
      apiCalls: '1K'
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    interval: 'month',
    features: [
      'Up to 25 team members',
      '10GB storage',
      '10,000 API calls/month',
      'Advanced analytics',
      'Priority support',
      'Custom integrations'
    ],
    limits: {
      users: 25,
      storage: '10GB',
      apiCalls: '10K'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    features: [
      'Unlimited team members',
      '100GB storage',
      'Unlimited API calls',
      'Custom analytics',
      '24/7 phone support',
      'Custom integrations',
      'SSO & advanced security',
      'Dedicated account manager'
    ],
    limits: {
      users: 999,
      storage: '100GB',
      apiCalls: 'Unlimited'
    }
  }
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true
  },
  {
    id: '2',
    type: 'card',
    last4: '5555',
    brand: 'Mastercard',
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    date: '2024-01-01',
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - January 2024'
  },
  {
    id: 'inv_002',
    date: '2023-12-01',
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - December 2023'
  },
  {
    id: 'inv_003',
    date: '2023-11-01',
    amount: 99,
    status: 'paid',
    description: 'Professional Plan - November 2023'
  }
];

export default function BillingPage() {
  const [currentPlan] = useState('pro');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');


  const currentPlanData = plans.find(p => p.id === currentPlan);

  const handlePlanChange = (planId: string) => {
    console.log('Changing to plan:', planId);
    // TODO: Implement plan change
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Downloading invoice:', invoiceId);
    // TODO: Implement invoice download
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription, usage, and payment methods
          </p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-600">You&apos;re currently on the {currentPlanData?.name} plan</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${currentPlanData?.price}</p>
            <p className="text-sm text-gray-600">per {currentPlanData?.interval}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="font-semibold text-gray-900">5 of {currentPlanData?.limits.users}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="font-semibold text-gray-900">2.1GB of {currentPlanData?.limits.storage}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">API Calls</p>
              <p className="font-semibold text-gray-900">3.2K of {currentPlanData?.limits.apiCalls}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Next billing date</p>
              <p className="font-medium text-gray-900">February 1, 2024</p>
            </div>
            <button className="px-4 py-2 text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors duration-200">
              Manage Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
          
          <div className="flex items-center gap-3">
            <span className={`text-sm ${billingInterval === 'month' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={billingInterval === 'year'}
                onChange={(e) => setBillingInterval(e.target.checked ? 'year' : 'month')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
            <span className={`text-sm ${billingInterval === 'year' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingInterval === 'year' && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                plan.id === currentPlan
                  ? 'border-yellow-500 bg-yellow-50'
                  : plan.popular
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {plan.id === currentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-medium bg-yellow-500 text-white rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${billingInterval === 'year' ? Math.round(plan.price * 12 * 0.8) : plan.price}
                  </span>
                  <span className="text-gray-600">
                    /{billingInterval === 'year' ? 'year' : 'month'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanChange(plan.id)}
                disabled={plan.id === currentPlan}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  plan.id === currentPlan
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.id === currentPlan ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
          <button
            onClick={() => console.log('Add payment method')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Payment Method
          </button>
        </div>

        <div className="space-y-3">
          {mockPaymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {method.brand} •••• {method.last4}
                    </span>
                    {method.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Description</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="py-4 text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-sm text-gray-900">{invoice.description}</td>
                  <td className="py-4 text-sm font-medium text-gray-900">${invoice.amount}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
                    >
                      <Download className="w-4 h-4 mr-1 inline" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 mb-1">Usage Alert</h3>
            <p className="text-sm text-yellow-700">
              You&apos;re approaching your monthly API call limit. Consider upgrading to avoid service interruption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
