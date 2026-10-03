import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConsultations, documentPath, formatDate, FILTERS } from "@/hooks/useConsultations";

const FilteredConsultation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filter = FILTERS[searchParams.get("filter")];
  const title = filter ? filter.title : "All Consultations";
  const { documents, loading, error } = useConsultations();
  const filtered = filter ? documents.filter(filter.test) : documents;

  const breadcrumbItems = [
    { label: "Home", href: "/econsultation-landing" },
    { label: "Additional Services", href: "#" },
    { label: "E-Consultation", href: "/" },
    { label: title }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Home className="h-5 w-5 mr-2" />
          <h1 className="text-2xl font-bold">E-Consultation - {title}</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6">Documents: {title}</h2>

            {loading && <p className="text-muted-foreground py-8 text-center">Loading consultations...</p>}
            {error && <p className="text-red-600 py-8 text-center">{error}</p>}

            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents open for consultation</h3>
                <p className="text-gray-500">There are currently no documents available for consultation in this time period.</p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-4">
                {filtered.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div className="flex-1">
                          {doc.type && (
                            <div className="mb-1">
                              <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{doc.type}</span>
                            </div>
                          )}
                          <h3 className="font-semibold text-lg mb-2">{doc.title}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Posted On: {formatDate(doc.postedOn)}</p>
                            <p>Comments due date: {formatDate(doc.dueOn)}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate(documentPath(doc.id))}
                          className="bg-gov-blue hover:bg-gov-blue-dark text-white"
                        >
                          Comment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FilteredConsultation;
