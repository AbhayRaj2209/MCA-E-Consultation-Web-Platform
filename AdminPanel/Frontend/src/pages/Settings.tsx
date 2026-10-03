import React, { useState } from 'react';
import { Settings2, User, Shield, Database, Bell, BarChart3, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const { user, changePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const strong = passwords.next.length >= 8 && /[A-Za-z]/.test(passwords.next) && /\d/.test(passwords.next);
    if (!strong) {
      toast({ title: 'Weak password', description: 'Use at least 8 characters, with a letter and a number.', variant: 'destructive' });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast({ title: 'Passwords do not match', description: 'Please re-enter the new password.', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      toast({ title: 'Password changed', description: 'Use your new password next time you sign in.' });
    } catch (err) {
      toast({
        title: 'Could not change password',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const settingsSections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'analytics', label: 'Analytics Settings', icon: BarChart3 },
    { id: 'system', label: 'System Features', icon: Info }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-secondary rounded-xl p-8 border">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Configure your AI-assisted MCA e-consultation feedback analysis platform settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center">
              <Settings2 className="h-5 w-5 mr-2" />
              Settings Categories
            </h3>
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button 
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {section.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Manage your personal information and account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={user?.full_name ?? ''} readOnly />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input value={user?.email ?? ''} readOnly />
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <Input value={user?.designation ?? ''} placeholder="Not set" readOnly />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={user?.department ?? ''} placeholder="Not set" readOnly />
                  </div>
                </div>
                <Button onClick={() => navigate('/profile')}>Edit on My Profile</Button>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how you receive notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Submissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new feedback is submitted
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analysis Complete</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications when sentiment analysis is finished
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summary reports via email
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system maintenance and updates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security & Access
                </CardTitle>
                <CardDescription>
                  Change the password you use to sign in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" autoComplete="current-password" required
                      value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" autoComplete="new-password" required
                      placeholder="At least 8 characters, with a letter and a number"
                      value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <Input id="confirmNewPassword" type="password" autoComplete="new-password" required
                      value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Updating...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Data & Privacy Settings */}
          {activeSection === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>
                  Manage data retention and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Retention</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete old consultation data after 2 years
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymize Submissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove personally identifiable information from exports
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Track all system access and modifications
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}


          {/* Analytics Settings */}
          {activeSection === 'analytics' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics Settings
                </CardTitle>
                <CardDescription>
                  Configure analytics and reporting preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Under Construction</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Analytics settings will be available in future updates
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-orange-800 italic">
                      "This feature is currently being developed and will be released in a future version of the platform."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Features */}
          {activeSection === 'system' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Current System Features
                  </CardTitle>
                  <CardDescription>
                    Active features and capabilities of the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Active Features</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 3-sentiment analysis (Positive, Negative, Neutral)</li>
                        <li>• Image-based word clouds</li>
                        <li>• Real-time analytics dashboard</li>
                        <li>• Stakeholder engagement tracking</li>
                        <li>• Trend analysis from July 2025</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📊 Current Data</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 3 active consultations</li>
                        <li>• 8 total comments analyzed</li>
                        <li>• 4.4 average confidence score</li>
                        <li>• 3 stakeholder types engaged</li>
                        <li>• July-October 2025 timeline</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>
                    Current system status and version information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Version</p>
                      <p className="text-muted-foreground">Saaransh v2.1.0</p>
                    </div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-muted-foreground">October 1, 2025</p>
                    </div>
                    <div>
                      <p className="font-medium">Database</p>
                      <p className="text-muted-foreground">Connected (8 comments, 3 consultations)</p>
                    </div>
                    <div>
                      <p className="font-medium">AI Engine</p>
                      <p className="text-muted-foreground">Ensemble Model v3.2 Active</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <Button variant="outline" className="w-full">
                      Check for System Updates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;