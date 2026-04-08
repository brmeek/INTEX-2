import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  resetRecoveryCodes,
} from "@/lib/authApi";
import { TwoFactorStatus } from "@/types/TwoFactorStatus";

const issuerName = "HopeHarbor";

const ManageMfaPage = () => {
  const { authSession } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [code, setCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const email = authSession?.email ?? authSession?.username ?? "user";

  const otpAuthUri = useMemo(() => {
    if (!status?.sharedKey) return "";
    return `otpauth://totp/${issuerName}:${encodeURIComponent(email)}?secret=${encodeURIComponent(status.sharedKey)}&issuer=${encodeURIComponent(issuerName)}`;
  }, [email, status?.sharedKey]);

  const loadStatus = async () => {
    setError("");
    setLoading(true);
    try {
      const twoFactorStatus = await getTwoFactorStatus();
      setStatus(twoFactorStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load 2FA settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (!otpAuthUri) {
      setQrCodeDataUrl("");
      return;
    }

    QRCode.toDataURL(otpAuthUri, { margin: 2, width: 240 })
      .then(setQrCodeDataUrl)
      .catch(() => setError("Unable to generate QR code."));
  }, [otpAuthUri]);

  const handleEnable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter the authenticator code to enable 2FA.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const updatedStatus = await enableTwoFactor(code.trim());
      setStatus(updatedStatus);
      setCode("");
      setSuccessMessage("Two-factor authentication has been enabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enable 2FA.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const updatedStatus = await disableTwoFactor();
      setStatus(updatedStatus);
      setSuccessMessage("Two-factor authentication has been disabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to disable 2FA.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetRecoveryCodes = async () => {
    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const updatedStatus = await resetRecoveryCodes();
      setStatus(updatedStatus);
      setSuccessMessage("Recovery codes were reset.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset recovery codes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-muted/30 pt-24 pb-16">
        <section className="container max-w-3xl">
          <div className="bg-white rounded-2xl border border-border shadow-card p-8">
            <p className="font-body text-sm text-muted-foreground">Loading 2FA settings...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 pt-24 pb-16">
      <section className="container max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold text-foreground">Multi-Factor Authentication</h1>
          <Link to="/portal" className="text-sm font-body text-accent hover:underline">
            Back to portal
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-card p-8 space-y-6">
          <div className="space-y-1">
            <p className="font-body text-sm text-muted-foreground">Account</p>
            <p className="font-body text-sm font-medium text-foreground">{email}</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-body text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 font-body text-sm">
              {successMessage}
            </div>
          )}

          <div className="rounded-xl border border-border p-4 bg-secondary/40">
            <p className="font-body text-sm text-foreground">
              2FA status:{" "}
              <span className="font-semibold">
                {status?.isTwoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Recovery codes left: {status?.recoveryCodesLeft ?? 0}
            </p>
          </div>

          {!status?.isTwoFactorEnabled && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground">Enable 2FA</h2>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Scan the QR code with your authenticator app, then enter the verification code to confirm setup.
                </p>
              </div>

              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Authenticator QR code" className="rounded-lg border border-border" />
              ) : (
                <p className="font-body text-sm text-muted-foreground">QR code unavailable.</p>
              )}

              {status?.sharedKey && (
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1">Manual setup key</p>
                  <code className="block rounded-md bg-secondary px-3 py-2 text-xs text-foreground break-all">
                    {status.sharedKey}
                  </code>
                </div>
              )}

              <form onSubmit={handleEnable} className="space-y-3">
                <label className="block font-body text-sm font-medium text-foreground">Authenticator code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                <Button type="submit" disabled={submitting} className="rounded-xl">
                  {submitting ? "Enabling..." : "Enable 2FA"}
                </Button>
              </form>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDisable}
              disabled={submitting || !status?.isTwoFactorEnabled}
              className="rounded-xl"
            >
              Disable 2FA
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetRecoveryCodes}
              disabled={submitting}
              className="rounded-xl"
            >
              Reset Recovery Codes
            </Button>
            <Button type="button" variant="ghost" onClick={loadStatus} disabled={submitting} className="rounded-xl">
              Refresh Status
            </Button>
          </div>

          {status?.recoveryCodes?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-body text-sm font-semibold text-foreground">Recovery Codes</h3>
              <div className="rounded-xl border border-border bg-secondary/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {status.recoveryCodes.map((recoveryCode) => (
                  <code key={recoveryCode} className="font-mono text-xs text-foreground">
                    {recoveryCode}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ManageMfaPage;
