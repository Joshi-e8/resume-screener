"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  UserCheck, 
  UserX,
  Crown,
  Edit,
  Trash2,
  Send
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  department: string;
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  joinedDate: string;
  avatar?: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'admin',
    department: 'Human Resources',
    status: 'active',
    lastActive: '2024-01-20T14:30:00Z',
    joinedDate: '2023-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    role: 'manager',
    department: 'Engineering',
    status: 'active',
    lastActive: '2024-01-20T12:15:00Z',
    joinedDate: '2023-03-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'member',
    department: 'Product',
    status: 'active',
    lastActive: '2024-01-20T10:45:00Z',
    joinedDate: '2023-06-10T00:00:00Z'
  },
  {
    id: '4',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'member',
    department: 'Design',
    status: 'pending',
    lastActive: '2024-01-19T16:20:00Z',
    joinedDate: '2024-01-19T00:00:00Z'
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    role: 'viewer',
    department: 'Marketing',
    status: 'inactive',
    lastActive: '2024-01-15T09:00:00Z',
    joinedDate: '2023-09-05T00:00:00Z'
  }
];

export default function TeamManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('member');

  const filteredMembers = mockTeamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'manager': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'viewer': return <UserX className="w-4 h-4 text-gray-500" />;
      default: return <UserCheck className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMemberAction = (memberId: string, action: string) => {
    setActiveMenu(null);
    console.log(`Member ${memberId}: ${action}`);
    // TODO: Implement member actions
  };

  const handleInviteMember = () => {
    if (!inviteEmail) return;
    
    console.log('Inviting member:', { email: inviteEmail, role: inviteRole });
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('member');
    // TODO: Implement invite functionality
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
            Team Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage team members, roles, and permissions
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{mockTeamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockTeamMembers.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Mail className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockTeamMembers.filter(m => m.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockTeamMembers.filter(m => m.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{member.department}</span>
                      <span>•</span>
                      <span>Joined {formatDistanceToNow(new Date(member.joinedDate), { addSuffix: true })}</span>
                      <span>•</span>
                      <span>Last active {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeMenu === member.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <div className="py-1">
                            <button
                              onClick={() => handleMemberAction(member.id, 'edit')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Member
                            </button>
                            <button
                              onClick={() => handleMemberAction(member.id, 'resend')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Send className="w-4 h-4" />
                              Resend Invite
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => handleMemberAction(member.id, 'remove')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove Member
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-500">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Start by inviting your first team member.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowInviteModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer - Can view data only</option>
                    <option value="member">Member - Can view and edit</option>
                    <option value="manager">Manager - Can manage team</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2 inline" />
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
