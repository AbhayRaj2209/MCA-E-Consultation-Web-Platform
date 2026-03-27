import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Consultation {
  id: number;
  bill_key?: string;
  title: string;
  status: string;
  endDate?: string | null;
  publishDate?: string | null;
  description?: string | null;
  submissions?: number;
}

const Consultations = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type_of_document: '',
    type_of_act: '',
    posted_on: '',
    comments_due_date: '',
    document_name: '',
    document_data: '',
    supported_document: null as File | null
  });

  const loadConsultations = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/consultations`);
      const json = await res.json();
      if (json.ok) {
        setConsultations(json.data || []);
      } else {
        setError(json.error || 'Failed to load consultations');
        setConsultations([]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load consultations');
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.document_name.trim() || !form.document_data.trim()) {
      setError('Please add a document name and document data to create a consultation.');
      return;
    }

    if (!form.posted_on) {
      setError('Please select a listing date.');
      return;
    }

    if (!form.comments_due_date) {
      setError('Please select a comments due date.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert file to base64 if provided
      let supportedDocData = null;
      if (form.supported_document) {
        supportedDocData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(form.supported_document);
        });
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_of_document: form.type_of_document || null,
          type_of_act: form.type_of_act || null,
          posted_on: form.posted_on || null,
          comments_due_date: form.comments_due_date || null,
          document_name: form.document_name,
          document_data: form.document_data,
          supported_document: supportedDocData || null
        })
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.message || 'Unable to create consultation');
      }

      setForm({
        type_of_document: '',
        type_of_act: '',
        posted_on: '',
        comments_due_date: '',
        document_name: '',
        document_data: '',
        supported_document: null
      });

      await loadConsultations();
    } catch (err: any) {
      setError(err.message || 'Failed to submit consultation');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consultations</h1>
          <p className="text-sm text-slate-500">Administrate consultations and add new bills using the documents table.</p>
        </div>
        <Button onClick={loadConsultations} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Consultations</CardTitle>
          <CardDescription>All consultation records from the documents table</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading consultations...</p>
          ) : consultations.length === 0 ? (
            <p className="text-sm text-slate-500">No consultations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">Act</th>
                    <th className="p-2 border">Due</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Submissions</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-slate-50">
                      <td className="p-2 border">{consultation.id}</td>
                      <td className="p-2 border font-semibold">{consultation.title}</td>
                      <td className="p-2 border">{consultation.description || '—'}</td>
                      <td className="p-2 border">{consultation.description || '—'}</td>
                      <td className="p-2 border">{consultation.endDate || '—'}</td>
                      <td className="p-2 border"><Badge variant={getStatusBadgeVariant(consultation.status)}>{consultation.status}</Badge></td>
                      <td className="p-2 border">{consultation.submissions ?? 0}</td>
                      <td className="p-2 border">
                        <Link to={`/consultation/${consultation.id}`} className="text-blue-600 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Consultation/Bill</CardTitle>
          <CardDescription>Create a consultation entry linked to the documents table. Summary will be auto-generated by the ML model.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              value={form.document_name}
              placeholder="Document Name (required)"
              onChange={(e) => setForm((prev) => ({ ...prev, document_name: e.target.value }))}
              required
            />
            <Input
              value={form.type_of_document}
              placeholder="Type of Document"
              onChange={(e) => setForm((prev) => ({ ...prev, type_of_document: e.target.value }))}
            />
            <Input
              value={form.type_of_act}
              placeholder="Type of Act"
              onChange={(e) => setForm((prev) => ({ ...prev, type_of_act: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Listing Date (Posted On)</label>
              <Input
                type="date"
                value={form.posted_on}
                onChange={(e) => setForm((prev) => ({ ...prev, posted_on: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Comments Due Date (required)</label>
              <Input
                type="date"
                value={form.comments_due_date}
                onChange={(e) => setForm((prev) => ({ ...prev, comments_due_date: e.target.value }))}
                required
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Supporting Document (Optional)</label>
              <input
                type="file"
                onChange={(e) => setForm((prev) => ({ ...prev, supported_document: e.target.files?.[0] || null }))}
                className="w-full border border-slate-300 rounded-lg p-2"
                accept=".pdf,.doc,.docx,.txt"
              />
              <p className="text-xs text-slate-500 mt-1">Accepted formats: PDF, DOC, DOCX, TXT</p>
            </div>
            <Textarea
              value={form.document_data}
              placeholder="Document data (required)"
              onChange={(e) => setForm((prev) => ({ ...prev, document_data: e.target.value }))}
              className="lg:col-span-2"
              rows={4}
              required
            />

            <div className="lg:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Create Consultation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Consultations;

