import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/layout/Footer";

import EConsultationLanding from "./pages/EConsultationLanding";
import ConsultationListing from "./pages/ConsultationListing";
import FilteredConsultation from "./pages/FilteredConsultation";
import MdpFirmsConsultation from "./pages/documents/MdpFirmsConsultation";
import DigitalCompetitionBill from "./pages/documents/DigitalCompetitionBill";
import CompaniesAmendmentBill from "./pages/documents/CompaniesAmendmentBill";
import NotFound from "./pages/NotFound";

const App = () => (
  <>
    <Toaster />
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Routes>
          <Route path="/" element={<EConsultationLanding />} />
          <Route path="/econsultation-landing" element={<EConsultationLanding />} />
          <Route path="/consultation-listing" element={<ConsultationListing />} />
          <Route path="/filtered-consultation" element={<FilteredConsultation />} />
          <Route path="/document-details" element={<MdpFirmsConsultation />} />
          <Route path="/document-details2" element={<DigitalCompetitionBill />} />
          <Route path="/document-details3" element={<CompaniesAmendmentBill />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  </>
);

export default App;
