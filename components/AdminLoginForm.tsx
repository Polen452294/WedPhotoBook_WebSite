"use client";

import { useState, type FormEvent } from "react";

export function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        window.location.assign(returnTo);
        return;
      }
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      setPassword("");
      setError(payload?.error || "Не удалось выполнить вход. Попробуйте ещё раз.");
    } catch {
      setError("Сервер временно недоступен. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit} noValidate>
      <label htmlFor="admin-password">Пароль</label>
      <div className="admin-password-field">
        <input
          id="admin-password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          maxLength={1024}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-login-error" : "admin-login-hint"}
          disabled={submitting}
        />
        <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} disabled={submitting}>
          {showPassword ? "Скрыть" : "Показать"}
        </button>
      </div>
      <p id="admin-login-hint" className="admin-login-hint">Логин не нужен — у панели один пользователь.</p>
      <div className="admin-login-message" aria-live="polite">
        {error && <p id="admin-login-error" role="alert">{error}</p>}
      </div>
      <button className="admin-login-submit" type="submit" disabled={!password || submitting}>
        {submitting ? "Проверяем…" : "Войти в панель"}
      </button>
    </form>
  );
}
