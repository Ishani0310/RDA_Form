import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-blue-950 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        The requested page could not be found. Please check the URL or return to the registration portal.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-[#0b1f3a] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#132f55] transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registration</span>
        </Link>
      </div>
    </div>
  );
}
