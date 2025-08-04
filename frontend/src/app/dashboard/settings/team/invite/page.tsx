"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Send, 
  Plus, 
  X, 
  Mail, 
  Users, 
  Shield, 
  UserCheck, 
  Crown,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";

interface InviteData {
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  department: string;
  message: string;
}

const roles = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can view data and reports only',
    icon: UserCheck,
    color: 'gray',
    permissions: ['View resumes', 'View jobs', 'View analytics']
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Can view and edit content',
    icon: Users,
    color: 'green',
    permissions: ['View resumes', 'View jobs', 'View analytics', 'Edit jobs', 'Add comments']
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage team and content',
    icon: Shield,
    color: 'blue',
    permissions: ['All Member permissions', 'Manage team members', 'Create reports', 'Manage integrations']
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to all features',
    icon: Crown,
    color: 'yellow',
    permissions: ['All Manager permissions', 'Billing management', 'Security settings', 'Company settings']
  }
];

const departments = [
  'Human Resources',
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance'
];

export default function TeamInvitePage() {
  const [invites, setInvites] = useState<InviteData[]>([
    { email: '', role: 'member', department: 'Human Resources', message: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const addInvite = () => {
    setInvites(prev => [...prev, { email: '', role: 'member', department: 'Human Resources', message: '' }]);
  };

  const removeInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateInvite = (index: number, field: keyof InviteData, value: string) => {
    setInvites(prev => prev.map((invite, i) => 
      i === index ? { ...invite, [field]: value } : invite
    ));
  };

  const handleSendInvites = async () => {
    const validInvites = invites.filter(invite => invite.email);
    if (validInvites.length === 0) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    console.log('Sending invites:', validInvites);
    // TODO: Implement actual invite sending
  };

  const generateInviteLink = () => {
    const link = `https://app.resumescreener.com/invite?token=${Math.random().toString(36).substring(2, 15)}`;
    setInviteLink(link);
    setShowInviteLink(true);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getRoleColor = (role: string) => {
    const roleData = roles.find(r => r.id === role);
    switch (roleData?.color) {
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isFormValid = invites.some(invite => invite.email);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings/team"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Invite Team Members
          </h1>
          <p className="text-gray-600 mt-1">
            Add new team members to your organization
          </p>
        </div>

        <button
          onClick={handleSendInvites}
          disabled={!isFormValid || isLoading}
          className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 mr-2 inline" />
          {isLoading ? 'Sending...' : `Send ${invites.filter(i => i.email).length} Invite${invites.filter(i => i.email).length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Role Information */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Roles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div key={role.id} className={`p-4 border-2 rounded-lg ${getRoleColor(role.id)}`}>
              <div className="flex items-center gap-2 mb-2">
                <role.icon className="w-4 h-4" />
                <h3 className="font-medium">{role.name}</h3>
              </div>
              <p className="text-xs mb-3">{role.description}</p>
              <div className="space-y-1">
                {role.permissions.slice(0, 2).map((permission, index) => (
                  <p key={index} className="text-xs opacity-75">• {permission}</p>
                ))}
                {role.permissions.length > 2 && (
                  <p className="text-xs opacity-75">• +{role.permissions.length - 2} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Forms */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Send Invitations</h2>
          <button
            onClick={addInvite}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-1 inline" />
            Add Another
          </button>
        </div>

        <div className="space-y-6">
          {invites.map((invite, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Invite #{index + 1}</h3>
                {invites.length > 1 && (
                  <button
                    onClick={() => removeInvite(index)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={invite.email}
                      onChange={(e) => updateInvite(index, 'email', e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={invite.role}
                    onChange={(e) => updateInvite(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={invite.department}
                    onChange={(e) => updateInvite(index, 'department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={invite.message}
                    onChange={(e) => updateInvite(index, 'message', e.target.value)}
                    placeholder="Welcome to the team!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Link */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Link</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate a shareable invite link that can be used multiple times
        </p>

        {!showInviteLink ? (
          <button
            onClick={generateInviteLink}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Generate Invite Link
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyInviteLink}
                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                  copiedLink 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Link Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Default Role:</span>
                  <span className="ml-2 font-medium">Member</span>
                </div>
                <div>
                  <span className="text-blue-700">Expires:</span>
                  <span className="ml-2 font-medium">7 days</span>
                </div>
                <div>
                  <span className="text-blue-700">Max Uses:</span>
                  <span className="ml-2 font-medium">10</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {invites.some(invite => invite.email) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invitation Preview</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
            <div className="max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                You&apos;re invited to join TechCorp Solutions
              </h3>
              <p className="text-gray-600 mb-4">
                Sarah Johnson has invited you to join the team as a {invites[0].role} in the {invites[0].department} department.
              </p>
              {invites[0].message && (
                <div className="bg-white p-3 rounded border-l-4 border-yellow-500 mb-4">
                  <p className="text-sm text-gray-700 italic">&quot;{invites[0].message}&quot;</p>
                </div>
              )}
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium">
                Accept Invitation
              </button>
              <p className="text-xs text-gray-500 mt-3">
                This invitation will expire in 7 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
