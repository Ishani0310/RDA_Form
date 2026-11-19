"use client";

import { use } from "react";
import RegisterPage from "../page";

interface DynamicRegistrationPageProps {
  params: Promise<{ slug: string }>;
}

export default function DynamicRegistrationPage({ params }: DynamicRegistrationPageProps) {
  use(params);
  return <RegisterPage />;
}
