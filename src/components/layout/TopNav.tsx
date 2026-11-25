"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  LogOut,
  Shield,
  User,
  FileCheck2,
  FileEdit,
  ShieldCheck,
  CheckCheck,
  ExternalLink,
  Info,
  X,
  Copy,
  Check,
  Clock,
  Eye,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface TopNavProps {
  onToggleSidebar: () => void;
}

interface CurrentOfficer {
  fullName: string;
  email: string;
  designation: string;
  role: string;
  assignedProvince: string;
  rdaStaffId: string;
  isDemoSession?: boolean;
}

interface NotificationItem {
  _id: string;
  type: "SUBMISSION" | "DRAFT" | "LOGIN" | "SYSTEM" | "ALERT";
  title: string;
  message: string;
  reference?: string;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

function formatRelativeTime(dateString: string | Date | undefined): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [officer, setOfficer] = useState<CurrentOfficer>({
    fullName: "RDA Officer",
    email: "",
    designation: "Administrative Console",
    role: "OFFICER",
    assignedProvince: "Sri Lanka",
    rdaStaffId: "",
    isDemoSession: false,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore network errors on polling
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.officer) {
          setOfficer(data.officer);
        }
      })
      .catch(() => {});

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif._id }),
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setShowNotifications(false);
    setSelectedNotification(notif);
  };

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUBMISSION":
        return <FileCheck2 className="w-4 h-4 text-emerald-600" />;
      case "DRAFT":
        return <FileEdit className="w-4 h-4 text-amber-600" />;
      case "LOGIN":
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "SUBMISSION":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "DRAFT":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "LOGIN":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-blue-900 tracking-wide uppercase">
                Road Development Authority
              </span>
              <span className="text-sm font-bold text-slate-800">
                Contractor Data Collection System
              </span>
            </div>
            <span className="inline-flex sm:hidden text-xs font-bold text-blue-950">
              RDA Portal
            </span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Official Session
          </span>
        </div>

        {/* Center: Search (Desktop) */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contractor, CIDA grade, or submission ref..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right: Actions, Alerts, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calendar / Date */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-lg border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Sri Lanka (GMT+5:30)</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 ring-2 ring-white"></span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">System Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      <p className="text-xs font-medium">No recent notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 transition-all cursor-pointer flex gap-3 items-start group relative ${
                          notif.isRead
                            ? "hover:bg-slate-50 bg-white"
                            : "bg-blue-50/40 hover:bg-blue-50/70"
                        }`}
                        title="Click to open notification details"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getNotificationBadgeColor(
                            notif.type
                          )}`}
                        >
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`text-xs truncate ${
                                notif.isRead
                                  ? "font-semibold text-slate-700 group-hover:text-blue-900"
                                  : "font-bold text-slate-900 group-hover:text-blue-950"
                              }`}
                            >
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.reference && (
                            <span className="inline-block mt-1 font-mono text-[10px] text-blue-800 bg-blue-50/80 px-1.5 py-0.2 rounded border border-blue-100">
                              {notif.reference}
                            </span>
                          )}
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                          )}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-blue-900 hover:bg-slate-100">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center bg-slate-50/60 rounded-b-xl">
                  <Link
                    href="/submissions"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-slate-600 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
                  >
                    View All Submissions & Activity Log
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1 pl-2 sm:pl-2.5 pr-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                RDA
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {officer.fullName}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {officer.role.replace("_", " ")}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{officer.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{officer.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[10px]">
                      {officer.role}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-[10px]">
                      {officer.rdaStaffId}
                    </span>
                  </div>
                </div>
                <div className="py-1">
                  <div className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                    <span>Assigned Directorate:</span>
                    <span className="font-medium text-slate-800 text-[11px]">
                      {officer.assignedProvince.split(" ")[0]}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out (Terminate Session)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal (Rendered via Portal to escape header containing block) */}
      {mounted &&
        selectedNotification &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${getNotificationBadgeColor(
                      selectedNotification.type
                    )}`}
                  >
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedNotification.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatRelativeTime(selectedNotification.createdAt)}
                      </span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {selectedNotification.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 overflow-y-auto text-xs">
                {/* Message Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Notification Alert Details
                  </span>
                  <p className="text-slate-800 text-sm font-medium leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Reference Number if present */}
                {selectedNotification.reference && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-blue-900/70 block">
                        Filing Reference Number
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-950">
                        {selectedNotification.reference}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyRef(selectedNotification.reference!)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-100/60 rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Ref</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Timestamp Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Received Date
                    </span>
                    <span className="text-[11px] font-medium text-slate-800 mt-0.5 block">
                      {new Date(selectedNotification.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Exact Time
                    </span>
                    <span className="text-[11px] font-medium text-slate-800 mt-0.5 block">
                      {new Date(selectedNotification.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Metadata details if available */}
                {selectedNotification.metadata &&
                  Object.keys(selectedNotification.metadata).length > 0 && (
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                        Event Context & Metadata
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {Object.entries(selectedNotification.metadata).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-400 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}:{" "}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {selectedNotification.reference && (
                    <button
                      onClick={() => {
                        const refUrl = `/submissions?ref=${encodeURIComponent(
                          selectedNotification.reference!
                        )}`;
                        window.location.href = refUrl;
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Submission Record</span>
                    </button>
                  )}
                  {selectedNotification.type === "DRAFT" && selectedNotification.reference && (
                    <button
                      onClick={() => {
                        window.open(
                          `/register?ref=${encodeURIComponent(
                            selectedNotification.reference!
                          )}`,
                          "_blank"
                        );
                      }}
                      className="px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Draft Form</span>
                    </button>
                  )}
                  {selectedNotification.type === "LOGIN" && (
                    <Link
                      href="/submissions"
                      onClick={() => setSelectedNotification(null)}
                      className="px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>View Activity Logs</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
