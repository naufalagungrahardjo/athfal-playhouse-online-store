
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordFormProps = {
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string;
  language: string;
};

const ForgotPasswordForm = ({
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  error,
  language,
}: ForgotPasswordFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
        placeholder="email@example.com"
        required
        className="athfal-input"
      />
    </div>
    {error && <div className="text-red-500 text-sm">{error}</div>}
    <Button
      type="submit"
      className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <span>{language === "id" ? "Memproses..." : "Processing..."}</span>
      ) : (
        <span>{language === "id" ? "Reset Password" : "Reset Password"}</span>
      )}
    </Button>
  </form>
);

export default ForgotPasswordForm;
