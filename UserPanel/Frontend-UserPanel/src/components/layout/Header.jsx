import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (searchQuery.trim()) {
        navigate(`/consultation-listing?search=${searchQuery}`);
      }
    }
  };

  return (
    <header className="bg-background border-b">
      {/* Top header with logo and search */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
<<<<<<< HEAD
              src="/src/assets/goi-logo.png"
              alt="Project Saaransh Logo"
              className="h-10 w-10 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gov-blue">Project Saaransh</h1>
              <p className="text-xs text-slate-600">AI-powered E-Consultation sentiment analysis Platform</p>
            </div>
          </div>
          
=======
              src="/image.png"
              alt="E-Consultation Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gov-blue">E-Consultation Platform</h1>
            </div>
          </div>

>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
          <div className="text-right">
            <h2 className="text-lg font-semibold text-foreground">EMPOWERING BUSINESS, PROTECTING INVESTORS</h2>
            <div className="flex space-x-2 text-xs mt-1">
              <span className="text-gov-orange">REGULATOR</span>
              <span>•</span>
              <span className="text-gov-green">INTEGRATOR</span>
              <span>•</span>
              <span className="text-gov-red">FACILITATOR</span>
              <span>•</span>
              <span className="text-gov-blue">EDUCATOR</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 w-64"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
              />
            </div>
<<<<<<< HEAD

=======
>>>>>>> 1450b5da7249fafe8c4969259a9e799d9158605f
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="bg-gov-blue-dark">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-0">
            <li>
              <a href="/econsultation-landing" className="block px-4 py-3 text-white hover:bg-gov-blue text-sm">
                Home
              </a>
            </li>
            <li>
              <a href="/consultation-listing" className="block px-4 py-3 text-white hover:bg-gov-blue text-sm">
                Consultation Listing
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};