import type { Metadata } from "next";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password | Modulith",
  description: "Request a link to reset your Modulith account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
