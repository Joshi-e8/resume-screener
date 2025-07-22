"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Shield,
  Key,
  Eye,
  Clock, 
  MapPin, 
  Monitor,
  AlertTriangle,
  Check,
  X,
  QrCode,
  Copy,
  Download
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'password_change' | '2fa_enabled' | 'suspicious_activity';
  description: string;
  timestamp: string;
  location: string;
  status: 'success' | 'failed' | 'warning';
}

const mockSessions: LoginSession[] = [
  {
    id: '1',
    device: 'Chrome on MacBook Pro',
    location: 'San Francisco, CA',
    ip: '192.168.1.100',
    lastActive: '2024-01-20T14:30:00Z',
    current: true
  },
  {
    id: '2',
    device: 'Safari on iPhone 15',
    location: 'San Francisco, CA',
    ip: '192.168.1.101',
    lastActive: '2024-01-20T12:15:00Z',
    current: false
  },
  {
    id: '3',
    device: 'Chrome on Windows PC',
    location: 'New York, NY',
    ip: '203.0.113.45',
    lastActive: '2024-01-19T16:20:00Z',
    current: false
  }
];

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login',
    description: 'Successful login from new device',
    timestamp: '2024-01-20T14:30:00Z',
    location: 'San Francisco, CA',
    status: 'success'
  },
  {
    id: '2',
    type: 'password_change',
    description: 'Password changed successfully',
    timestamp: '2024-01-19T10:15:00Z',
    location: 'San Francisco, CA',
    status: 'success'
  },
  {
    id: '3',
    type: 'suspicious_activity',
    description: 'Multiple failed login attempts',
    timestamp: '2024-01-18T22:30:00Z',
    location: 'Unknown Location',
    status: 'warning'
  }
];

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [suspiciousActivityAlerts, setSuspiciousActivityAlerts] = useState(true);

  const handleEnable2FA = () => {
    setShowQRCode(true);
    // Generate backup codes
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
  };

  const handleConfirm2FA = () => {
    setTwoFactorEnabled(true);
    setShowQRCode(false);
  };

  const handleDisable2FA = () => {
    setTwoFactorEnabled(false);
    setBackupCodes([]);
  };

  const handleTerminateSession = (sessionId: string) => {
    console.log('Terminating session:', sessionId);
    // TODO: Implement session termination
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <Eye className="w-4 h-4" />;
      case 'password_change': return <Key className="w-4 h-4" />;
      case '2fa_enabled': return <Shield className="w-4 h-4" />;
      case 'suspicious_activity': return <AlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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
            Security & Privacy
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account security and privacy settings
          </p>
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
              {twoFactorEnabled ? 
                <Check className="w-5 h-5 text-green-600" /> : 
                <X className="w-5 h-5 text-red-600" />
              }
            </div>
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className={`text-sm ${twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Strong Password</p>
              <p className="text-sm text-green-600">Active</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Login Notifications</p>
              <p className="text-sm text-green-600">Enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          
          {!twoFactorEnabled ? (
            <button
              onClick={handleEnable2FA}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              <Shield className="w-4 h-4 mr-2 inline" />
              Enable 2FA
            </button>
          ) : (
            <button
              onClick={handleDisable2FA}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              Disable 2FA
            </button>
          )}
        </div>

        {twoFactorEnabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Two-factor authentication is enabled</span>
            </div>
            <p className="text-xs text-green-700">
              Your account is protected with two-factor authentication. You&apos;ll need your authenticator app to sign in.
            </p>
          </div>
        )}

        {showQRCode && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Set up your authenticator app</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 text-center">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Backup Codes</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                </p>
                
                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="text-gray-700">{code}</div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={copyBackupCodes}
                    className="flex-1 px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Copy className="w-3 h-3 mr-1 inline" />
                    Copy
                  </button>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex-1 px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Download className="w-3 h-3 mr-1 inline" />
                    Download
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowQRCode(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm2FA}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                I&apos;ve saved my backup codes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Notifications</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Login Notifications</h3>
              <p className="text-sm text-gray-600">Get notified when someone signs into your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={loginNotifications}
                onChange={(e) => setLoginNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Suspicious Activity Alerts</h3>
              <p className="text-sm text-gray-600">Get alerted about unusual account activity</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={suspiciousActivityAlerts}
                onChange={(e) => setSuspiciousActivityAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h2>
        
        <div className="space-y-4">
          {mockSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{session.device}</h3>
                    {session.current && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Last active {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">IP: {session.ip}</p>
                </div>
              </div>
              
              {!session.current && (
                <button
                  onClick={() => handleTerminateSession(session.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                >
                  Terminate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h2>
        
        <div className="space-y-3">
          {mockSecurityEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${getEventColor(event.status)}`}>
                {getEventIcon(event.type)}
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{event.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                  <span>•</span>
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
