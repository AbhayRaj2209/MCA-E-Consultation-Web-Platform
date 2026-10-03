import { useEffect, useState } from "react";
import { fetchDocuments } from "@/services/api";

// The first three bills have hand-built pages; every newer bill uses the generic page.
const LEGACY_PAGES = { 1: "/document-details", 2: "/document-details2", 3: "/document-details3" };

export const documentPath = (id) => LEGACY_PAGES[id] || `/documents/${id}`;

const DAY = 24 * 60 * 60 * 1000;
const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
// "2025-11-25" -> local midnight (avoids the UTC off-by-one of new Date("YYYY-MM-DD"))
export const parseDate = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";
};

// Buckets used by the landing page counts and the filtered list
export const FILTERS = {
  today: { title: "Due Today", test: (doc) => daysFromToday(doc.dueOn) === 0 },
  next7days: { title: "Due in the Next 7 Days", test: (doc) => inRange(daysFromToday(doc.dueOn), 0, 7) },
  "posted-today": { title: "Posted Today", test: (doc) => daysFromToday(doc.postedOn) === 0 },
  "posted-last7days": { title: "Posted in the Last 7 Days", test: (doc) => inRange(daysFromToday(doc.postedOn), -7, 0) },
  "posted-earlier": { title: "Posted Earlier", test: (doc) => daysFromToday(doc.postedOn) < -7 }
};

function daysFromToday(value) {
  const date = parseDate(value);
  return date ? Math.round((date - todayStart()) / DAY) : null;
}

function inRange(days, min, max) {
  return days !== null && days >= min && days <= max;
}

export function useConsultations() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchDocuments()
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) setDocuments(data.data || []);
        else setError(data.message || "Could not load consultations.");
      })
      .catch(() => !cancelled && setError("Could not reach the server. Please try again later."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { documents, loading, error };
}
