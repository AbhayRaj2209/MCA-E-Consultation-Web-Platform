import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, FileDown, FileText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommentModal } from "@/components/modals/CommentModal";
import { useToast } from "@/hooks/use-toast";
import { fetchDocument, attachmentUrl } from "@/services/api";
import { formatDate } from "@/hooks/useConsultations";

const MAX_COMMENT_LENGTH = 3000;
const SECTIONS = ["General", "Section 1", "Section 2", "Section 3"];

// Generic page for any consultation published from the admin panel (/documents/:id)
const DocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [section, setSection] = useState("General");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchDocument(id)
      .then(({ ok, status, data }) => {
        if (ok) setDoc(data.data);
        else setError(status === 404 ? "This consultation does not exist or has been closed." : data.message || "Could not load the consultation.");
      })
      .catch(() => setError("Could not reach the server. Please try again later."))
      .finally(() => setLoading(false));
  }, [id]);

  const breadcrumbItems = [
    { label: "Home", href: "/econsultation-landing" },
    { label: "E-Consultation", href: "/consultation-listing" },
    { label: doc ? doc.title : "Consultation" }
  ];

  const handleSubmitClick = () => {
    if (!comment.trim()) {
      toast({ title: "Comment required", description: "Please write your comment before submitting.", variant: "destructive" });
      return;
    }
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setComment("");
    setSection("General");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/consultation-listing")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          All consultations
        </Button>

        {loading && <p className="text-muted-foreground py-12 text-center">Loading consultation...</p>}

        {!loading && error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center text-red-700">{error}</CardContent>
          </Card>
        )}

        {!loading && doc && (
          <>
            <Card>
              <CardContent className="p-6 space-y-4">
                {doc.type && (
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{doc.type}</span>
                )}
                <h1 className="text-2xl font-bold text-foreground">{doc.title}</h1>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-2" />Posted on {formatDate(doc.postedOn)}</span>
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-2" />Comments due {formatDate(doc.dueOn)}</span>
                  {doc.typeOfAct && <span>Act: {doc.typeOfAct}</span>}
                </div>
                {doc.hasAttachment && (
                  <Button asChild variant="outline">
                    <a href={attachmentUrl(doc.id)} target="_blank" rel="noopener noreferrer">
                      <FileDown className="h-4 w-4 mr-2" />
                      View official document
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {doc.summary && (
              <Card className="bg-gov-light-blue/30">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2">Summary</h2>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{doc.summary}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document
                </h2>
                <div className="max-h-[32rem] overflow-y-auto rounded-md border bg-gray-50 p-4 text-sm leading-relaxed whitespace-pre-line">
                  {doc.text}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Your comments</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-muted-foreground">Comment on</span>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder="Share your opinion, suggestion or concern about this document"
                  rows={6}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{comment.length}/{MAX_COMMENT_LENGTH}</span>
                  <Button onClick={handleSubmitClick} className="bg-gov-blue hover:bg-gov-blue-dark">
                    Submit Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CommentModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={handleSuccess}
              comment={comment}
              uploadedFile={null}
              documentId={doc.id}
              section={section === "General" ? null : section}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default DocumentPage;
