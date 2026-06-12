import { useState, useEffect, useCallback } from 'react';
import { fetchQRCode } from '../services/api';
import type { QRCodeResponse } from '../types/api';

interface Props {
  scanned: boolean;
}

const POLL_INTERVAL_MS = 60_000; // Refresh QR before expiry.

export function QRCodeDisplay({ scanned }: Props) {
  const [qr, setQr] = useState<QRCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchQRCode();
      setQr(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取二维码失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (loading && !qr) {
    return <div className="qr-card" aria-busy="true">加载中...</div>;
  }

  if (error) {
    return (
      <div className="qr-card qr-card--error" role="alert">
        <p>{error}</p>
        <button onClick={load} aria-label="重新加载二维码">重试</button>
      </div>
    );
  }

  if (!qr) return null;

  return (
    <div className="qr-card">
      <h2>微信扫码登录</h2>
      {scanned ? (
        <div className="qr-scanned" role="status">
          扫码成功！
        </div>
      ) : (
        <>
          <img
            src={qr.qr_code_url}
            alt="微信登录二维码"
            className="qr-image"
          />
          <p className="qr-hint">
            请使用微信扫描二维码（{qr.expire_seconds}秒内有效）
          </p>
        </>
      )}
    </div>
  );
}
