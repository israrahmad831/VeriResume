import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  Crown,
  ArrowLeft,
  Check,
  Zap,
  Star,
  Award,
  Sparkles,
  TrendingUp,
  Shield,
  Infinity,
  CreditCard,
  Loader,
  CheckCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Premium = () => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const plans = {
    monthly: {
      price: "$19.99",
      period: "month",
      savings: "",
    },
    yearly: {
      price: "$199.99",
      period: "year",
      savings: "Save $40",
    },
  };

  const features = [
    {
      icon: Sparkles,
      title: "Advanced AI Resume Enhancement",
      description: "Industry-specific optimization with unlimited regenerations",
      free: false,
    },
    {
      icon: TrendingUp,
      title: "Premium Job Matching",
      description: "Priority access to high-quality job matches",
      free: false,
    },
    {
      icon: Award,
      title: "ATS Optimization",
      description: "Advanced Applicant Tracking System compatibility",
      free: false,
    },
    {
      icon: Zap,
      title: "Priority Support",
      description: "24/7 premium customer support",
      free: false,
    },
    {
      icon: Infinity,
      title: "Unlimited Resume Scans",
      description: "Scan and analyze as many resumes as you need",
      free: false,
    },
    {
      icon: Star,
      title: "Cover Letter Generator",
      description: "AI-powered cover letters for each application",
      free: false,
    },
    {
      icon: Shield,
      title: "Anomaly Detection",
      description: "Advanced protection against fake job postings",
      free: false,
    },
    {
      icon: Crown,
      title: "Interview Preparation",
      description: "AI-powered interview questions and tips",
      free: false,
    },
  ];

  const freeFeatures = [
    "Basic resume analysis",
    "Job recommendations",
    "5 resume scans per month",
    "Standard support",
  ];

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/subscription/subscribe`,
        { plan: selectedPlan },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Redirect to payment gateway or show success
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/jobseeker/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Subscription failed:", err);
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Premium!
          </h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/jobseeker/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl mb-4">
              <Crown className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Upgrade to Premium
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock the full power of AI to accelerate your job search and land
              your dream job faster
            </p>
          </div>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                selectedPlan === "monthly"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all relative ${
                selectedPlan === "yearly"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Save $40
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="text-gray-600">Get started with basic features</p>
            </div>
            <ul className="space-y-4 mb-8">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 border-4 border-yellow-400 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm">
              RECOMMENDED
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                <Crown className="w-6 h-6 mr-2" />
                Premium
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">
                  {plans[selectedPlan].price}
                </span>
                <span className="text-blue-100 ml-2">
                  /{plans[selectedPlan].period}
                </span>
              </div>
              {plans[selectedPlan].savings && (
                <p className="text-green-300 font-semibold">
                  {plans[selectedPlan].savings}
                </p>
              )}
            </div>
            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">{feature.title}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50 text-lg"
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 inline mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 inline mr-2" />
                  Subscribe Now
                </>
              )}
            </button>
            <p className="text-center text-blue-100 text-sm mt-4">
              Cancel anytime • No long-term commitment
            </p>
          </div>
        </div>

        {/* Feature Details */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Premium Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200"
                >
                  <div className="p-3 bg-white rounded-xl inline-block mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue
                to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and PayPal.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! We offer a 7-day free trial for new users. No credit card
                required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade or downgrade your plan at any time from
                your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
