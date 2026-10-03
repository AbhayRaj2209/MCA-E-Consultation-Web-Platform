import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Eye, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, apiJson } from '@/lib/api';

interface Consultation {
  id: number;
  bill_key?: string;
  title: string;
  status: string;
  archived?: boolean;
  typeOfDocument?: string | null;
  endDate?: string | null;
  publishDate?: string | null;
  description?: string | null;
  submissions?: number;
}

const MAX_ATTACHMENT_MB = 10;
const DOCUMENT_TYPES = ['Draft Bill', 'Amendment', 'Report', 'Draft Rules', 'Notification'];
const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  document_name: '',
  type_of_document: 'Draft Bill',
  type_of_act: '',
  posted_on: today(),
  comments_due_date: '',
  summary: '',
  document_data: '',
  attachment: null as File | null
});

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in progress': return 'secondary';
    case 'completed': return 'default';
    case 'archived': return 'destructive';
    default: return 'outline';
  }
};

const Consultations = () => {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Consultation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fileInputKey, setFileInputKey] = useState(0);

  const set = (key: keyof ReturnType<typeof emptyForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const loadConsultations = async () => {
    setLoading(true);
    setError(null);
    try {
      setConsultations(await apiJson<Consultation[]>('/api/consultations'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.document_name.trim() || !form.document_data.trim()) {
      return setError('Please add a title and the document text.');
    }
    if (!form.comments_due_date) return setError('Please select a comments due date.');
    if (form.posted_on && form.comments_due_date < form.posted_on) {
      return setError('The comments due date cannot be before the posted date.');
    }
    if (form.attachment && form.attachment.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      return setError(`The attachment must be smaller than ${MAX_ATTACHMENT_MB} MB.`);
    }

    setSaving(true);
    try {
      await apiJson('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          document_name: form.document_name.trim(),
          type_of_document: form.type_of_document || null,
          type_of_act: form.type_of_act.trim() || null,
          posted_on: form.posted_on || null,
          comments_due_date: form.comments_due_date,
          summary: form.summary.trim() || null,
          document_data: form.document_data.trim(),
          supported_document: form.attachment ? await readAsDataUrl(form.attachment) : null
        })
      });

      setForm(emptyForm());
      setFileInputKey((k) => k + 1);
      toast({ title: 'Bill published', description: 'It is now visible to citizens in the user panel.' });
      await loadConsultations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish the bill');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (c: Consultation) => {
    setBusyId(c.id);
    try {
      await apiJson(`/api/documents/${c.id}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: !c.archived })
      });
      toast({
        title: c.archived ? 'Bill restored' : 'Bill archived',
        description: c.archived
          ? 'It is visible to citizens again.'
          : 'Hidden from citizens. Comments and analysis are kept.'
      });
      await loadConsultations();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setBusyId(target.id);
    try {
      const res = await apiFetch(`/api/documents/${target.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'Delete failed');
      toast({
        title: 'Bill deleted',
        description: `"${target.title}" and ${json.data.comments_deleted} comment(s) were permanently removed.`
      });
      setToDelete(null);
      await loadConsultations();
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Consultations</h1>
          <p className="text-sm text-slate-500">Publish new bills to the user panel, archive old ones, or delete them permanently.</p>
        </div>
        <Button variant="outline" onClick={loadConsultations} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            Active bills are shown to citizens. <strong>Archive</strong> hides a bill but keeps its comments;
            <strong> Delete</strong> removes the bill and all its comments permanently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading consultations...</p>
          ) : consultations.length === 0 ? (
            <p className="text-sm text-slate-500">No consultations yet. Publish one below.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Title</th>
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">Posted</th>
                    <th className="p-2 border">Due</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Comments</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((c) => (
                    <tr key={c.id} className={c.archived ? 'bg-slate-50 text-slate-500' : 'hover:bg-slate-50'}>
                      <td className="p-2 border">{c.id}</td>
                      <td className="p-2 border font-semibold">{c.title}</td>
                      <td className="p-2 border">{c.typeOfDocument || '—'}</td>
                      <td className="p-2 border whitespace-nowrap">{c.publishDate || '—'}</td>
                      <td className="p-2 border whitespace-nowrap">{c.endDate || '—'}</td>
                      <td className="p-2 border"><Badge variant={statusVariant(c.status)}>{c.status}</Badge></td>
                      <td className="p-2 border">{c.submissions ?? 0}</td>
                      <td className="p-2 border">
                        <div className="flex flex-wrap gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/consultation/${c.id}`}><Eye className="h-4 w-4 mr-1" />View</Link>
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => toggleArchive(c)}>
                            {c.archived
                              ? <><ArchiveRestore className="h-4 w-4 mr-1" />Restore</>
                              : <><Archive className="h-4 w-4 mr-1" />Archive</>}
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === c.id}
                            className="text-red-600 hover:text-red-700" onClick={() => setToDelete(c)}>
                            <Trash2 className="h-4 w-4 mr-1" />Delete
                          </Button>
                        </div>
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
          <CardTitle>Publish New Bill</CardTitle>
          <CardDescription>The bill appears in the user panel immediately and citizens can start commenting.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2 space-y-1">
              <Label htmlFor="document_name">Title *</Label>
              <Input id="document_name" value={form.document_name} onChange={set('document_name')} maxLength={255}
                placeholder="e.g. Limited Liability Partnership (Amendment) Bill, 2026" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type_of_document">Type of document</Label>
              <select id="type_of_document" value={form.type_of_document} onChange={set('type_of_document')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type_of_act">Related Act</Label>
              <Input id="type_of_act" value={form.type_of_act} onChange={set('type_of_act')}
                placeholder="e.g. Companies Act, 2013" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="posted_on">Posted on</Label>
              <Input id="posted_on" type="date" value={form.posted_on} onChange={set('posted_on')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="comments_due_date">Comments due by *</Label>
              <Input id="comments_due_date" type="date" value={form.comments_due_date} min={form.posted_on || undefined}
                onChange={set('comments_due_date')} required />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <Label htmlFor="summary">Short summary for citizens</Label>
              <Textarea id="summary" value={form.summary} onChange={set('summary')} rows={3} maxLength={2000}
                placeholder="2-3 sentences explaining what this bill proposes (optional)" />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <Label htmlFor="document_data">Document text *</Label>
              <Textarea id="document_data" value={form.document_data} onChange={set('document_data')} rows={8}
                placeholder="Paste the full text of the bill or consultation paper" required />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <Label htmlFor="attachment">Official PDF (optional)</Label>
              <input id="attachment" key={fileInputKey} type="file" accept=".pdf,application/pdf"
                onChange={(e) => setForm((prev) => ({ ...prev, attachment: e.target.files?.[0] || null }))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
              <p className="text-xs text-slate-500">PDF up to {MAX_ATTACHMENT_MB} MB. Citizens can open it from the bill page.</p>
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                <Upload className="h-4 w-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish Bill'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this bill permanently?</DialogTitle>
            <DialogDescription>
              "{toDelete?.title}" and its {toDelete?.submissions ?? 0} comment(s) will be removed from the database.
              This cannot be undone. To only hide it from citizens, use <strong>Archive</strong> instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busyId === toDelete?.id}>
              {busyId === toDelete?.id ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Consultations;
