"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Globe,
  Building,
  Check,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  ExternalLink,
  Key,
  Trash2,
} from "lucide-react";

interface GmailStatusData {
  success: boolean;
  activeProvider: "gmail" | "resend" | "smtp" | "simulated";
  configuredProvider: string;
  gmail: {
    isConfigured: boolean;
    senderEmail: string | null;
    credentialSource: "env" | "database" | null;
    hasClientId: boolean;
    hasClientSecret: boolean;
    redirectUri: string;
  };
  resend: {
    isConfigured: boolean;
    sender: string;
  };
  smtp: {
    isConfigured: boolean;
    sender: string | null;
  };
}

export default function SettingsPage() {
  const [emailStatus, setEmailStatus] = useState<GmailStatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [testRecipient, setTestRecipient] = useState<string>("");
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch email integration status
  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/admin/gmail/status");
      const data = await res.json();
      if (data.success) {
        setEmailStatus(data);
        return data;
      }
    } catch (err: any) {
      console.error("Failed to load email status:", err);
    } finally {
      setLoadingStatus(false);
    }
    return null;
  };

  useEffect(() => {
    fetchStatus().then((data) => {
      // Check URL parameters for OAuth outcomes
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const statusParam = params.get("status");
        const errorParam = params.get("error");
        const senderParam = params.get("sender");

        if (statusParam === "connected") {
          // Strictly verify that the database/status endpoint confirms isConfigured
          if (data && data.gmail?.isConfigured) {
            setActionAlert({
              type: "success",
              message: `Gmail API authorization granted and verified! Active Sender: ${data.gmail.senderEmail || senderParam || "Authorized Account"}`,
            });
          } else {
            setActionAlert({
              type: "error",
              message: "Google OAuth completed, but persistent token storage could not be verified in MongoDB. Please check database connectivity and retry.",
            });
          }
          window.history.replaceState({}, "", "/settings?tab=email");
        } else if (errorParam) {
          setActionAlert({
            type: "error",
            message: `Google OAuth authorization could not be completed: ${errorParam.replace(/_/g, " ")}.`,
          });
          window.history.replaceState({}, "", "/settings?tab=email");
        }
      }
    });
  }, []);

  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail API from the RDA ICDP portal?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/gmail/status", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActionAlert({ type: "success", message: "Gmail authorization removed." });
        fetchStatus();
      } else {
        setActionAlert({ type: "error", message: data.message || "Failed to disconnect." });
      }
    } catch (err: any) {
      setActionAlert({ type: "error", message: err?.message || "Failed to disconnect." });
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes("@")) {
      setTestResult({ success: false, message: "Please enter a valid recipient email address." });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/gmail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testRecipient.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Test email successfully sent via ${data.provider.toUpperCase()}!`,
          messageId: data.messageId,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || "Failed to send test email.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Network error sending test email.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              System Settings &amp; Configuration
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Global operational parameters, email gateways, and security profiles for the RDA contractor portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStatus();
            setActionAlert({ type: "success", message: "Configuration refreshed." });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {actionAlert && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionAlert.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{actionAlert.message}</span>
          <button
            onClick={() => setActionAlert(null)}
            className="text-[11px] font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Email Integration Section (Gmail API & Resend) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900">
            <Mail className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Email Gateway &amp; Dispatcher</h2>
              <p className="text-xs text-slate-500">
                Official transmission of workshop acknowledgment receipts and reference numbers.
              </p>
            </div>
          </div>

          {emailStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Active Dispatcher:</span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                  emailStatus.activeProvider === "gmail"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : emailStatus.activeProvider === "resend"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : emailStatus.activeProvider === "smtp"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {emailStatus.activeProvider.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {loadingStatus ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
            <span>Loading email gateway configuration...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Gmail API (OAuth 2.0) */}
            <div
              className={`p-5 rounded-xl border ${
                emailStatus?.gmail.isConfigured
                  ? "bg-emerald-50/40 border-emerald-200"
                  : "bg-slate-50/60 border-slate-200"
              } space-y-4`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Gmail API (Google OAuth 2.0)</h3>
                    {emailStatus?.gmail.isConfigured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Delivers directly to the applicant&apos;s real email address with official government headers.
                  </p>
                </div>
              </div>

              {emailStatus?.gmail.isConfigured ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Authorized Sender:</span>
                      <strong className="text-slate-900">{emailStatus.gmail.senderEmail}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Credential Source:</span>
                      <span className="text-slate-700">
                        {emailStatus.gmail.credentialSource === "env" ? "Railway Environment (GOOGLE_REFRESH_TOKEN)" : "Persistent MongoDB Storage"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href="/api/admin/gmail/auth"
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      <span>Re-authorize Account</span>
                    </a>
                    {emailStatus.gmail.credentialSource === "database" && (
                      <button
                        onClick={handleDisconnectGmail}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Disconnect</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>GOOGLE_CLIENT_ID:</span>
                      <span className={emailStatus?.gmail.hasClientId ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                        {emailStatus?.gmail.hasClientId ? "Configured" : "Missing in Environment"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GOOGLE_CLIENT_SECRET:</span>
                      <span className={emailStatus?.gmail.hasClientSecret ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                        {emailStatus?.gmail.hasClientSecret ? "Configured" : "Missing in Environment"}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Authorized Redirect URI:</span>
                      <code className="text-[10.5px] bg-slate-100 p-1 rounded block mt-0.5 text-blue-900 break-all select-all">
                        {emailStatus?.gmail.redirectUri}
                      </code>
                    </div>
                  </div>

                  {emailStatus?.gmail.hasClientId && emailStatus?.gmail.hasClientSecret ? (
                    <a
                      href="/api/admin/gmail/auth"
                      className="w-full justify-center px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm inline-flex items-center gap-2"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Connect Gmail Account (Google OAuth 2.0)</span>
                    </a>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                      Please configure <code className="font-bold">GOOGLE_CLIENT_ID</code> and <code className="font-bold">GOOGLE_CLIENT_SECRET</code> in Railway environment variables to enable the Google OAuth authorization flow.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Card: Live Test & Alternative Gateways */}
            <div className="space-y-4">
              {/* Live Test Email Tool */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <Send className="w-4 h-4 text-blue-900" />
                  <h3 className="text-sm font-bold">Live Dispatch Verification</h3>
                </div>
                <p className="text-xs text-slate-600">
                  Transmit an official registration confirmation test email to any mailbox to verify deliverability.
                </p>

                <form onSubmit={handleSendTestEmail} className="space-y-2.5 pt-1">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Enter test recipient (e.g. your-email@gmail.com)"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="w-full px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm flex items-center justify-center gap-2"
                  >
                    {sendingTest ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Transmitting Test Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Live Verification Email</span>
                      </>
                    )}
                  </button>
                </form>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs ${
                      testResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.messageId && (
                      <p className="font-mono text-[10px] mt-1 text-emerald-900">
                        Message ID: {testResult.messageId}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Alternative Providers Status */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide block">
                  Secondary / Fallback Gateways
                </span>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-600 font-medium">Resend API (SDK):</span>
                  <span className={emailStatus?.resend.isConfigured ? "text-purple-700 font-bold" : "text-slate-400"}>
                    {emailStatus?.resend.isConfigured ? "Available (onboarding@resend.dev)" : "Not Configured"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 font-medium">Standard SMTP / Gmail App Password:</span>
                  <span className={emailStatus?.smtp.isConfigured ? "text-blue-700 font-bold" : "text-slate-400"}>
                    {emailStatus?.smtp.isConfigured ? `Available (${emailStatus.smtp.sender})` : "Not Configured"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authority & Identification Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-800">Authority Identification</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Parent Ministry</label>
              <input
                type="text"
                disabled
                defaultValue="Ministry of Transport, Highways and Urban Development"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Statutory Body</label>
              <input
                type="text"
                disabled
                defaultValue="Road Development Authority (RDA)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Headquarters</label>
              <input
                type="text"
                disabled
                defaultValue="Maganeguma Mahamedura, Koswatta, Battaramulla"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Regional & Localization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 pb-2 border-b border-slate-100">
            <Globe className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-800">Regional &amp; Localization</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Standard Time Zone</label>
              <input
                type="text"
                disabled
                defaultValue="Asia/Colombo (Sri Lanka Standard Time UTC+05:30)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Official Languages</label>
              <input
                type="text"
                disabled
                defaultValue="English, Sinhala (සිංහල), Tamil (தமிழ்)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Currency Base</label>
              <input
                type="text"
                disabled
                defaultValue="Sri Lankan Rupee (LKR / රු.)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Security & Audit Policies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-800">Security &amp; Audit Trail</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Authentication Framework</label>
              <input
                type="text"
                disabled
                defaultValue="HS256 JWT with Secure HTTP-Only Session Cookies"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Session Inactivity Timeout</label>
              <input
                type="text"
                disabled
                defaultValue="8 Hours (RDA Standard Operational Shift)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Audit Record Retention</label>
              <input
                type="text"
                disabled
                defaultValue="7 Years (Public Procurement Compliance)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
