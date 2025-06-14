
import { Link } from "react-router-dom";

type AuthTitleSectionProps = {
  authMode: "login" | "signup" | "forgot-password";
  language: string;
};

const getTitle = (authMode: AuthTitleSectionProps["authMode"], language: string): string => {
  switch (authMode) {
    case "login":
      return language === "id" ? "Masuk" : "Login";
    case "signup":
      return language === "id" ? "Daftar" : "Sign Up";
    case "forgot-password":
      return language === "id" ? "Lupa Password" : "Forgot Password";
    default:
      return "";
  }
};

const getDescription = (authMode: AuthTitleSectionProps["authMode"], language: string): string => {
  switch (authMode) {
    case "login":
      return language === "id"
        ? "Masukkan email dan password Anda untuk masuk ke akun Anda."
        : "Enter your email and password to access your account.";
    case "signup":
      return language === "id"
        ? "Isi form berikut untuk mendaftar akun baru."
        : "Fill out the form below to create a new account.";
    case "forgot-password":
      return language === "id"
        ? "Masukkan email Anda untuk reset password."
        : "Enter your email to reset your password.";
    default:
      return "";
  }
};

export const AuthTitleSection = ({ authMode, language }: AuthTitleSectionProps) => (
  <div className="text-center">
    <Link to="/">
      <img
        src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png"
        alt="Athfal Playhouse Logo"
        className="h-12 mx-auto"
      />
    </Link>
    <h2 className="mt-6 text-3xl font-bold text-athfal-pink">{getTitle(authMode, language)}</h2>
    <p className="mt-2 text-gray-500">{getDescription(authMode, language)}</p>
  </div>
);
