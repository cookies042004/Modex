import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SlotCard({ slot }) {
  const [copied, setCopied] = useState(false);

  if (!slot) return null;

  const starts = new Date(slot.start_time).toLocaleString();
  const ends = slot.end_time ? new Date(slot.end_time).toLocaleTimeString() : '';
  const available = Number(slot.available || 0);
  const confirmed = Number(slot.confirmed_count || 0);
  const pending = Number(slot.pending_count || 0);
  const isFull = available <= 0;

  const bookingUrl = `${window.location.origin}/booking/${slot.id}`;

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error('Copy failed', err);
      window.prompt('Copy this link', text);
    }
  }

  return (
    <div className="card slot-card" aria-live="polite">
      <div className="meta">
        <div>
          <h3>{slot.doctor_name}</h3>
          <p>{slot.speciality || 'General'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#0f1724', fontWeight: 600 }}>{starts}</div>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{ends}</p>
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {isFull ? (
            <button
              className="btn"
              aria-disabled="true"
              disabled
              title="This slot is fully booked"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              Book
            </button>
          ) : (
            <Link to={`/booking/${slot.id}`} className="btn primary" style={{ textDecoration: 'none' }}>
              Book
            </Link>
          )}

          <button
            className="btn"
            onClick={() => copyToClipboard(bookingUrl)}
            title="Copy booking link"
            aria-label="Copy booking link"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        <div style={{ alignSelf: 'center', color: isFull ? '#ef4444' : '#047857', fontSize: 13 }}>
          {isFull ? 'Full' : `${available} available`}
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {confirmed} confirmed{pending ? ` • ${pending} pending` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
