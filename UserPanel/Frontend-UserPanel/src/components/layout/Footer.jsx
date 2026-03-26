import React from "react";
import { Mail, MapPin } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gov-blue-dark text-white mt-8">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          {/* About Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white mb-2">About SAARANSH</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Government of Delhi multi-ministry e-consultation platform. MCA is only one example ministry using the system.
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Every government policy receives thousands of citizen responses — but most of them are never fully analyzed.
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              We built SAARANSH to convert citizen feedback into actionable policy intelligence using AI.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white mb-2">Quick Links</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <a href="/econsultation-landing" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/consultation-listing" className="text-gray-300 hover:text-white transition-colors">
                  Consultation Listing
                </a>
              </li>
              <li>
                <a href="/supported-ministeries" className="text-gray-300 hover:text-white transition-colors">
                  Supported Ministries
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How SAARANSH Works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Security & Data Protection
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white mb-2">Contact</h3>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-gov-orange" />
                <span className="text-gray-300">Government of Delhi Secretariat, New Delhi</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-gov-orange" />
                <span className="text-gray-300">Municipal Corporation of Delhi (MCD)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-gov-orange" />
                <span className="text-gray-300">Department of Information Technology, Delhi</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 flex-shrink-0 text-gov-orange" />
                <a href="mailto:so-pimca@gov.in" className="text-gray-300 hover:text-white transition-colors">
                  so-pimca@gov.in
                </a>
              </li>
              <li className="text-xs text-gray-400">Phone: +91 11 1234 5678</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600 my-3" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-300 space-y-1 md:space-y-0">
          <div>
            © {currentYear} SAARANSH - AI-powered E-Consultation sentiment analysis platform for Government of Delhi. All rights reserved.
          </div>
          <div className="text-center md:text-right">
            <p>Empowering Business • Protecting Investors</p>
          </div>
        </div>
      </div>

      {/* Government Disclaimer Bar */}
      <div className="bg-black bg-opacity-20 border-t border-gray-600 py-1 text-[10px] text-gray-400 text-center">
        <p>
          Official portal for public consultation on proposed amendments and draft legislations.
        </p>
      </div>
    </footer>
  );
};

