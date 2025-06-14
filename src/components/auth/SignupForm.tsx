
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

type SignupFormProps = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string;
  language: string;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
};

const SignupForm = ({
  name,
  email,
  password,
  confirmPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isSubmitting,
  error,
  language,
  showPassword,
  setShowPassword,
}: SignupFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">{language === "id" ? "Nama" : "Name"}</Label>
      <Input
        id="name"
        type="text"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder={language === "id" ? "Nama lengkap" : "Full name"}
        required
        className="athfal-input"
      />
    </div>
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
    <div className="space-y-2">
      <Label htmlFor="password">{language === "id" ? "Password" : "Password"}</Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          placeholder={language === "id" ? "Masukkan password" : "Enter password"}
          required
          className="athfal-input pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="confirmPassword">
        {language === "id" ? "Konfirmasi Password" : "Confirm Password"}
      </Label>
      <div className="relative">
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={e => onConfirmPasswordChange(e.target.value)}
          placeholder={language === "id" ? "Konfirmasi password" : "Confirm password"}
          required
          className="athfal-input pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
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
        <span>{language === "id" ? "Daftar" : "Sign Up"}</span>
      )}
    </Button>
  </form>
);

export default SignupForm;
