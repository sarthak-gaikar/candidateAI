/**
 * Reports page — list and download generated reports.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Clock, FileDown } from "lucide-react";
import api from "@/lib/api";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await api.get("/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }

  const downloadReport = async (reportId: string, format: string) => {
    try {
      const res = await api.get(`/reports/${reportId}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report.${format}`;
      a.click();
    } catch {
      alert("Download failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" style={{ color: "var(--accent)" }} /> Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Generated candidate evaluation reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)
        ) : reports.length > 0 ? (
          reports.map((report, i) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} className="glass-card p-5 hover:border-opacity-50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.17 261.09 / 0.15)" }}>
                  <FileDown className="w-5 h-5" style={{ color: "var(--accent)" }} />
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                  style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}>
                  {report.format}
                </span>
              </div>
              <h3 className="font-medium text-sm mb-1">
                {report.content?.candidate?.name || "Candidate Report"}
              </h3>
              <div className="flex items-center gap-1 text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
                <Clock className="w-3 h-3" />
                {new Date(report.created_at).toLocaleString()}
              </div>
              {report.content?.scores?.recommendation && (
                <p className="text-xs font-medium mb-3" style={{ color: "var(--primary)" }}>
                  {report.content.scores.recommendation.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  {report.content.scores.final_score && ` • Score: ${report.content.scores.final_score}/100`}
                </p>
              )}
              <button onClick={() => downloadReport(report.id, report.format)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
                style={{ borderColor: "var(--border)" }}
                id={`download-report-${report.id}`}>
                <Download className="w-4 h-4" /> Download
              </button>
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 glass-card p-16 text-center" style={{ color: "var(--muted-foreground)" }}>
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No reports yet</p>
            <p className="text-sm mt-1">Generate reports from candidate detail pages</p>
          </div>
        )}
      </div>
    </div>
  );
}
