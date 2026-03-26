import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ConsultationListing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const breadcrumbItems = [
    { label: "Home", href: "/econsultation-landing" },
    { label: "Additional Services", href: "#" },
    { label: "E-Consultation" }
  ];

  const documents = [
    {
      id: 1,
      title: "Establishment of Indian Multi-Disciplinary Partnership (MDP) firms",
      type: "Report",
      postedOn: "25-Mar-2026",
      dueOn: "10-Apr-2026",
      docId: "J34I_D",
      onClick: () => navigate("/document-details")
    },
    {
      id: 2,
      title: "Digital Competition Bill, 2025",
      type: "Report",
      postedOn: "26-Mar-2026",
      dueOn: "15-Apr-2026",
      docId: "J34I_F",
      onClick: () => navigate("/document-details2")
    },
    {
      id: 3,
      title: "Companies Amendment Bill, 2025",
      type: "Amendment",
      postedOn: "27-Mar-2026",
      dueOn: "20-Apr-2026",
      docId: "J34I_G",
      onClick: () => navigate("/document-details3")
    }
  ];

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    let result = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort documents
    if (sortBy === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "deadline") {
      result.sort((a, b) => new Date(b.dueOn) - new Date(a.dueOn));
    } else {
      // Default sort by date (posted on)
      result.sort((a, b) => new Date(b.postedOn) - new Date(a.postedOn));
    }

    return result;
  }, [searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Home className="h-5 w-5 mr-2" />
            <h1 className="text-2xl font-bold">E-Consultation</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 w-64"
                placeholder="Search E-Consultation"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Beyond 7 Days</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="bg-gov-light-blue/30 mb-4">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {doc.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {doc.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Posted on: {doc.postedOn} | {doc.docId}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Comments Due on: {doc.dueOn}
                    </div>
                  </div>
                </div>

                <div className="ml-6">
                  <Button
                    onClick={doc.onClick}
                    className="bg-gov-blue hover:bg-gov-blue-dark"
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDocuments.length === 0 && (
          <Card className="bg-gray-100">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No documents found matching your search.</p>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
};



export default ConsultationListing;
