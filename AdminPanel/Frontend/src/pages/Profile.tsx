import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, Building, Briefcase, Calendar, MapPin, Edit3, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiJson } from "@/lib/api";
import { getInitials } from "@/lib/user";

interface Consultation {
  status: string;
  submissions: number;
}

const toForm = (user: ReturnType<typeof useAuth>["user"]) => ({
  fullName: user?.full_name ?? "",
  phone: user?.phone ?? "",
  designation: user?.designation ?? "",
  department: user?.department ?? "",
  location: user?.location ?? "",
  bio: user?.bio ?? ""
});

const NotSet = () => <span className="text-slate-400 italic">Not set</span>;

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(() => toForm(user));
  const [stats, setStats] = useState<{ active: number; total: number; consultations: number } | null>(null);

  useEffect(() => {
    if (!isEditing) setForm(toForm(user));
  }, [user, isEditing]);

  useEffect(() => {
    apiJson<Consultation[]>("/api/consultations")
      .then((list) => setStats({
        consultations: list.length,
        active: list.filter((c) => c.status === "In Progress").length,
        total: list.reduce((sum, c) => sum + (c.submissions || 0), 0)
      }))
      .catch(() => setStats(null));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (form.fullName.trim().length < 2) {
      toast({ title: "Invalid name", description: "Full name must be at least 2 characters.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ ...form, fullName: form.fullName.trim() });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({
        title: "Could not save profile",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const fields: { key: keyof typeof form; label: string; icon: React.ElementType; placeholder: string }[] = [
    { key: "fullName", label: "Full Name", icon: User, placeholder: "Your full name" },
    { key: "phone", label: "Phone Number", icon: Phone, placeholder: "+91 98765 43210" },
    { key: "designation", label: "Designation", icon: Briefcase, placeholder: "e.g. Policy Analyst" },
    { key: "department", label: "Department", icon: Building, placeholder: "e.g. Ministry of Corporate Affairs" },
    { key: "location", label: "Location", icon: MapPin, placeholder: "e.g. New Delhi" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-600">Manage your account information</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-3xl font-semibold text-blue-700">
              {getInitials(user.full_name)}
            </div>
            <CardTitle>{user.full_name}</CardTitle>
            {user.designation && <CardDescription>{user.designation}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-3">
            {user.department && (
              <div className="flex items-center text-sm text-slate-600">
                <Building className="w-4 h-4 mr-2" />
                {user.department}
              </div>
            )}
            {user.location && (
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-2" />
                {user.location}
              </div>
            )}
            <div className="flex items-center text-sm text-slate-600">
              <Calendar className="w-4 h-4 mr-2" />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your details as entered at sign up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-slate-500" />
                  <span className="text-slate-700">{user.email}</span>
                </div>
              </div>

              {fields.map(({ key, label, icon: Icon, placeholder }) => (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={key}>{label}</Label>
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2 text-slate-500" />
                    {isEditing ? (
                      <Input id={key} value={form[key]} onChange={set(key)} placeholder={placeholder} />
                    ) : (
                      <span className="text-slate-700">{form[key] || <NotSet />}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea id="bio" value={form.bio} onChange={set("bio")} rows={3} maxLength={1000}
                  placeholder="A short description of your role" />
              ) : (
                <p className="text-slate-700 p-3 bg-slate-50 rounded-md">{form.bio || <NotSet />}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Summary</CardTitle>
          <CardDescription>Live figures from the consultation database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats ? stats.active : "–"}</div>
              <div className="text-sm text-slate-600">Active Consultations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats ? stats.total : "–"}</div>
              <div className="text-sm text-slate-600">Total Comments Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats ? stats.consultations : "–"}</div>
              <div className="text-sm text-slate-600">Total Consultations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
