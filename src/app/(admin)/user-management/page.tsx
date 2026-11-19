"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users2,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Power,
  KeyRound,
  Building2,
  MapPin,
  Clock,
} from "lucide-react";

interface Officer {
  id: string;
  email: string;
  fullName: string;
  designation: string;
  role: "SUPER_ADMIN" | "PROVINCIAL_DIRECTOR" | "EXECUTIVE_ENGINEER" | "INSPECTION_OFFICER" | "AUDITOR";
  assignedProvince: string;
  rdaStaffId: string;
  phone: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string | null;
}

const PROVINCES = [
  "All Provinces (National HQ)",
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
];

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Administrator" },
  { value: "PROVINCIAL_DIRECTOR", label: "Provincial Director" },
  { value: "EXECUTIVE_ENGINEER", label: "Executive Engineer" },
  { value: "INSPECTION_OFFICER", label: "Site Inspection Officer" },
  { value: "AUDITOR", label: "Chief Internal Auditor" },
];

export default function UserManagementPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    designation: "Executive Engineer (Highway Works)",
    role: "EXECUTIVE_ENGINEER",
    assignedProvince: "Western Province",
    rdaStaffId: "",
    phone: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOfficers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedRole) params.set("role", selectedRole);
      if (selectedProvince) params.set("province", selectedProvince);

      const res = await fetch(`/api/officers?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.officers)) {
        setOfficers(data.officers);
      } else {
        setAlert({ type: "error", message: data.message || "Could not fetch officer list." });
      }
    } catch {
      setAlert({ type: "error", message: "Network error while connecting to officer registry." });
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedProvince]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const handleToggleStatus = async (officer: Officer) => {
    setActionLoadingId(officer.id);
    setAlert(null);
    try {
      const res = await fetch(`/api/officers/${officer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !officer.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOfficers((prev) =>
          prev.map((o) => (o.id === officer.id ? { ...o, isActive: !o.isActive } : o))
        );
        setAlert({
          type: "success",
          message: `Officer ${officer.fullName} status set to ${!officer.isActive ? "Active" : "Suspended"}.`,
        });
      } else {
        setAlert({ type: "error", message: data.message || "Failed to update officer status." });
      }
    } catch {
      setAlert({ type: "error", message: "Network failure while communicating with server." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      const res = await fetch("/api/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAlert({
          type: "success",
          message: `Officer ${data.officer.fullName} (${data.officer.role}) provisioned successfully!`,
        });
        setModalOpen(false);
        setFormData({
          fullName: "",
          email: "",
          password: "",
          designation: "Executive Engineer (Highway Works)",
          role: "EXECUTIVE_ENGINEER",
          assignedProvince: "Western Province",
          rdaStaffId: "",
          phone: "",
        });
        fetchOfficers();
      } else {
        setFormError(data.message || "Failed to provision officer account.");
      }
    } catch {
      setFormError("Network error while submitting officer credentials.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "PROVINCIAL_DIRECTOR":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "EXECUTIVE_ENGINEER":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "INSPECTION_OFFICER":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "AUDITOR":
        return "bg-purple-100 text-purple-900 border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Officer &amp; User Access Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Production console for provisioning administrative accounts, delegating provincial roles, and auditing permissions under the Road Development Authority.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchOfficers()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
            title="Refresh officer list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Official Officer</span>
          </button>
        </div>
      </div>

      {/* Global Notice Alert */}
      {alert && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Breakdown Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950">Super Administrator</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">National Planning &amp; Procurement Directorate</p>
          <p className="text-[11px] text-blue-900 font-semibold mt-2">Full system authorization</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950">Provincial Director</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Provincial Directorate Offices (9 Provinces)</p>
          <p className="text-[11px] text-blue-900 font-semibold mt-2">Provincial verification approval</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950">Executive Engineer</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">District Engineering Divisions</p>
          <p className="text-[11px] text-blue-900 font-semibold mt-2">Technical capacity assessment</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950">Site Inspection Officer</span>
            <Shield className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Field Quality &amp; Work Zone Verification</p>
          <p className="text-[11px] text-blue-900 font-semibold mt-2">QR site authentication</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, staff ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All Officer Roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All Jurisdictions</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Loading verified officer registry...</p>
          </div>
        ) : officers.length === 0 ? (
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <Inbox className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Officer Accounts Listed</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                No active administrative officers match the selected criteria. Official accounts provisioned in MongoDB will appear here with full RBAC scopes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Provision First Officer</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Officer Name &amp; Staff ID</th>
                  <th className="px-5 py-3">Official Email</th>
                  <th className="px-5 py-3">Role &amp; Clearance</th>
                  <th className="px-5 py-3">Directorate Jurisdiction</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{officer.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{officer.rdaStaffId}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">{officer.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(
                          officer.role
                        )}`}
                      >
                        {officer.role.replace("_", " ")}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{officer.designation}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <div className="font-medium">{officer.assignedProvince}</div>
                      {officer.phone && officer.phone !== "N/A" && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{officer.phone}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          officer.isActive
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${officer.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        {officer.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(officer)}
                        disabled={actionLoadingId === officer.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                          officer.isActive
                            ? "text-rose-700 border-rose-200 hover:bg-rose-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                        title={officer.isActive ? "Suspend officer access" : "Activate officer access"}
                      >
                        <Power className="w-3 h-3" />
                        <span>{officer.isActive ? "Suspend" : "Activate"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Officer Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-[#0b1f3a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-tight">Provision Official Officer</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Eng. S. Ekanayake"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">RDA Staff ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.rdaStaffId}
                    onChange={(e) => setFormData({ ...formData, rdaStaffId: e.target.value })}
                    placeholder="RDA/HQ/ENG/045"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email (@rda.gov.lk) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="officer.name@rda.gov.lk"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Password (Min 10 chars) *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Provincial Directorate *</label>
                  <select
                    value={formData.assignedProvince}
                    onChange={(e) => setFormData({ ...formData, assignedProvince: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Executive Engineer (Highway Works)"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+94 11 2862799"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Confirm &amp; Provision Officer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
