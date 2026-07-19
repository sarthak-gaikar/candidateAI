/**
 * Candidates listing page — with add, upload, and filter functionality.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Upload, Search, Filter, X, FileUp, Video } from "lucide-react";
import api from "@/lib/api";
import { RECOMMENDATION_LABELS, getScoreClass, STATUS_LABELS } from "@/lib/constants";

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // New candidate modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<"resume" | "video">("resume");
  const [uploadCandidateId, setUploadCandidateId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCandidates();
  }, [page, search]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (search) params.set("search", search);
      const res = await api.get(`/candidates?${params}`);
      setCandidates(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/candidates", { name: newName, email: newEmail || undefined, phone: newPhone || undefined });
      setShowAddModal(false);
      setNewName(""); setNewEmail(""); setNewPhone("");
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add candidate");
    } finally {
      setAdding(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadCandidateId) return;
    setUploading(true);
    setUploadProgress("Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const endpoint = uploadType === "resume"
        ? `/resumes/upload/${uploadCandidateId}`
        : `/interviews/upload/${uploadCandidateId}`;

      setUploadProgress(uploadType === "resume" ? "Analyzing resume..." : "Processing video...");
      await api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCandidateId("");
      setUploadProgress("");
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload failed");
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {total} total candidates
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowUploadModal(true); setUploadType("resume"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            id="upload-resume-btn"
          >
            <FileUp className="w-4 h-4" /> Upload Resume
          </button>
          <button
            onClick={() => { setShowUploadModal(true); setUploadType("video"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            id="upload-video-btn"
          >
            <Video className="w-4 h-4" /> Upload Interview
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
            id="add-candidate-btn"
          >
            <Plus className="w-4 h-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none"
          style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          id="candidate-search"
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Name", "Email", "Status", "Score", "Recommendation", "Rank", "Created"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-3"><div className="skeleton h-4 w-20 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : candidates.length > 0 ? (
                candidates.map((c) => {
                  const rec = c.recommendation ? RECOMMENDATION_LABELS[c.recommendation] : null;
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => navigate(`/candidates/${c.id}`)}
                      className="border-b cursor-pointer transition-colors hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-5 py-3 font-medium">{c.name}</td>
                      <td className="px-5 py-3" style={{ color: "var(--muted-foreground)" }}>{c.email || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {c.final_score !== null ? (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getScoreClass(c.final_score)}`}>
                            {c.final_score}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {rec ? <span className="text-xs font-medium" style={{ color: rec.color }}>{rec.label}</span> : "—"}
                      </td>
                      <td className="px-5 py-3" style={{ color: "var(--muted-foreground)" }}>#{c.rank || "—"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No candidates found</p>
                    <p className="text-xs mt-1">Add your first candidate to begin evaluation</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{ borderColor: "var(--border)" }}>
            Previous
          </button>
          <span className="px-4 py-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{ borderColor: "var(--border)" }}>
            Next
          </button>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add New Candidate</h2>
              <button onClick={() => setShowAddModal(false)} style={{ color: "var(--muted-foreground)" }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required
                  className="w-full px-4 py-2 rounded-lg border text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="Candidate name" id="new-candidate-name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="email@example.com" id="new-candidate-email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="+1 234 567 8900" id="new-candidate-phone" />
              </div>
              <button type="submit" disabled={adding}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
                id="submit-candidate">
                {adding ? "Adding..." : "Add Candidate"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Upload {uploadType === "resume" ? "Resume" : "Interview Video"}</h2>
              <button onClick={() => setShowUploadModal(false)} style={{ color: "var(--muted-foreground)" }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Candidate *</label>
                <select value={uploadCandidateId} onChange={(e) => setUploadCandidateId(e.target.value)} required
                  className="w-full px-4 py-2 rounded-lg border text-sm outline-none"
                  style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  id="upload-candidate-select">
                  <option value="">Choose a candidate...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {uploadType === "resume" ? "Resume File (PDF, DOCX)" : "Video File (MP4, MOV)"}
                </label>
                <div
                  className="upload-zone p-8 text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {uploadFile ? uploadFile.name : "Click or drag to upload"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={uploadType === "resume" ? ".pdf,.docx" : ".mp4,.mov,.avi,.webm"}
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    id="upload-file-input"
                  />
                </div>
              </div>
              {uploadProgress && (
                <div className="text-sm text-center animate-pulse" style={{ color: "var(--primary)" }}>
                  {uploadProgress}
                </div>
              )}
              <button type="submit" disabled={uploading || !uploadFile || !uploadCandidateId}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
                id="submit-upload">
                {uploading ? "Processing..." : `Upload & Analyze`}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
