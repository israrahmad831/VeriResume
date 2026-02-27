import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "./DashboardLayout";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  Camera,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Loader,
  CheckCircle,
  AlertCircle,
  Trash2,
  Shield,
  Globe,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const ProfileSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form - populated from AuthContext and localStorage
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    website: "",
    linkedin: "",
  });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobMatches: true,
    applicationUpdates: true,
    resumeAnalysis: true,
    marketingEmails: false,
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowMessaging: true,
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = () => {
    // Load from AuthContext + localStorage
    const savedProfile = localStorage.getItem("veriresume_profile");
    const savedNotifs = localStorage.getItem("veriresume_notifications");
    const savedPrivacy = localStorage.getItem("veriresume_privacy");
    const savedAvatar = localStorage.getItem("veriresume_avatar");

    if (savedAvatar) setAvatarUrl(savedAvatar);
    if (savedProfile) {
      try { setProfileData(JSON.parse(savedProfile)); } catch (e) {}
    }
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch (e) {}
    }
    if (savedPrivacy) {
      try { setPrivacy(JSON.parse(savedPrivacy)); } catch (e) {}
    }

    // Override with auth context data
    if (user) {
      const nameParts = (user.name || "").split(" ");
      setProfileData((prev) => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || "",
        lastName: prev.lastName || nameParts.slice(1).join(" ") || "",
        email: user.email || prev.email,
      }));
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      localStorage.setItem("veriresume_profile", JSON.stringify(profileData));
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password";
      setError(msg);
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(""); setError(""); }, 4000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post(`${API_URL}/api/upload-profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const url = res.data.avatar.startsWith("http") ? res.data.avatar : `${API_URL}${res.data.avatar}`;
      setAvatarUrl(url);
      localStorage.setItem("veriresume_avatar", url);
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNotificationUpdate = () => {
    setLoading(true);
    try {
      localStorage.setItem("veriresume_notifications", JSON.stringify(notifications));
      setSuccess("Notification preferences saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = () => {
    setLoading(true);
    try {
      localStorage.setItem("veriresume_privacy", JSON.stringify(privacy));
      setSuccess("Privacy settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <DashboardLayout title="Profile Settings" subtitle="Manage your account and preferences">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center text-green-700">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 border border-slate-200">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(""); setSuccess(""); }}
                className={`flex items-center px-6 py-4 font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================== PROFILE TAB ====================== */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <form onSubmit={handleProfileUpdate}>
            {/* Avatar */}
            <div className="mb-8 text-center">
              <div className="relative inline-block">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white" />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {profileData.firstName?.[0]?.toUpperCase()}{profileData.lastName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">Click the camera icon to upload a profile picture</p>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your last name"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" /> Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" /> Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            {/* Location & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" /> Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" /> Professional Title
                </label>
                <input
                  type="text"
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" /> Website
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={profileData.linkedin}
                  onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
            >
              {loading ? <><Loader className="w-5 h-5 inline mr-2 animate-spin" />Saving...</> : <><Save className="w-5 h-5 inline mr-2" />Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {/* ====================== SECURITY TAB ====================== */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-6">
              {[
                { key: "current" as const, label: "Current Password", field: "currentPassword" as const },
                { key: "new" as const, label: "New Password", field: "newPassword" as const },
                { key: "confirm" as const, label: "Confirm New Password", field: "confirmPassword" as const },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{item.label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[item.key] ? "text" : "password"}
                      value={passwordData[item.field]}
                      onChange={(e) => setPasswordData({ ...passwordData, [item.field]: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, [item.key]: !showPasswords[item.key] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPasswords[item.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
            >
              Update Password
            </button>
          </form>

          {/* Danger Zone */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Danger Zone</h3>
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Delete Account</h4>
                  <p className="text-slate-600 text-sm">Once deleted, there is no going back.</p>
                </div>
                <button
                  onClick={() => alert("Account deletion requires backend integration.")}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold flex items-center whitespace-nowrap"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== NOTIFICATIONS TAB ====================== */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: "emailNotifications", label: "Email Notifications", desc: "Receive all notifications via email" },
              { key: "jobMatches", label: "Job Matches", desc: "When new jobs match your resume" },
              { key: "applicationUpdates", label: "Application Updates", desc: "Status updates on your applications" },
              { key: "resumeAnalysis", label: "Resume Analysis", desc: "When analysis results are ready" },
              { key: "marketingEmails", label: "Marketing Emails", desc: "Tips, news, and product updates" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                <div>
                  <h4 className="font-semibold text-slate-900">{item.label}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !(notifications as any)[item.key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (notifications as any)[item.key] ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                    (notifications as any)[item.key] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleNotificationUpdate}
            disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
          >
            {loading ? <><Loader className="w-5 h-5 inline mr-2 animate-spin" />Saving...</> : <><Save className="w-5 h-5 inline mr-2" />Save Preferences</>}
          </button>
        </div>
      )}

      {/* ====================== PRIVACY TAB ====================== */}
      {activeTab === "privacy" && (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Privacy Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Profile Visibility</label>
              <select
                value={privacy.profileVisibility}
                onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="public">Public - Visible to everyone</option>
                <option value="private">Private - Only visible to you</option>
                <option value="recruiters">Recruiters Only</option>
              </select>
            </div>

            {[
              { key: "showEmail", label: "Show Email", desc: "Display your email on your profile" },
              { key: "showPhone", label: "Show Phone", desc: "Display your phone number on your profile" },
              { key: "allowMessaging", label: "Allow Messaging", desc: "Let recruiters send you messages" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                <div>
                  <h4 className="font-semibold text-slate-900">{item.label}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setPrivacy({ ...privacy, [item.key]: !(privacy as any)[item.key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (privacy as any)[item.key] ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                    (privacy as any)[item.key] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handlePrivacyUpdate}
            disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
          >
            {loading ? <><Loader className="w-5 h-5 inline mr-2 animate-spin" />Saving...</> : <><Save className="w-5 h-5 inline mr-2" />Save Settings</>}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfileSettings;
