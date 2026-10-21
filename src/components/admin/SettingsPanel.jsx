'use client';
import { useEffect, useState } from 'react';

const EMPTY = {
  whatsapp_number: '',
  contact_phone: '',
  contact_email: '',
  store_address: '',
  store_hours: '',
  instagram_url: '',
};

// Numbers are stored as 91 + 10 digits; edit them as the 10 digits
const tenDigits = (v) => String(v || '').replace(/\D/g, '').slice(-10);

function toForm(settings) {
  return {
    ...EMPTY,
    ...settings,
    whatsapp_number: tenDigits(settings.whatsapp_number),
    contact_phone: tenDigits(settings.contact_phone),
  };
}

export default function SettingsPanel({ call }) {
  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  useEffect(() => {
    let active = true;
    call('/api/settings')
      .then((s) => { if (active) setForm(toForm(s)); })
      .catch((err) => { if (active) setMessage({ type: 'error', text: err.message }); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [call]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const data = await call('/api/settings', { method: 'PATCH', body: form });
      setForm(toForm(data.settings));
      setMessage({ type: 'ok', text: 'Store details saved. The site footer and WhatsApp buttons now use them.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="set-titulo">
      <div className="adm-panel-cab">
        <div>
          <h1 id="set-titulo" className="adm-h1">Store details</h1>
          <p className="qs-sub">Contact details shown in the site footer and used by the WhatsApp order buttons.</p>
        </div>
      </div>

      <form className="adm-ajustes" onSubmit={save} aria-busy={!loaded || undefined}>
        <div className="qs-grid">
          <div className="qs-field">
            <label className="qs-label" htmlFor="set-wa">WhatsApp number <i>· 10 digits</i></label>
            <input id="set-wa" className="qs-input" type="tel" inputMode="numeric" value={form.whatsapp_number} onChange={set('whatsapp_number')} disabled={!loaded} />
            <p className="qs-hint">Orders placed with “Order on WhatsApp” go here. Leave empty to hide the WhatsApp buttons.</p>
          </div>
          <div className="qs-field">
            <label className="qs-label" htmlFor="set-phone">Phone number <i>· 10 digits</i></label>
            <input id="set-phone" className="qs-input" type="tel" inputMode="numeric" value={form.contact_phone} onChange={set('contact_phone')} disabled={!loaded} />
          </div>
          <div className="qs-field qs-field--full">
            <label className="qs-label" htmlFor="set-email">Email</label>
            <input id="set-email" className="qs-input" type="email" value={form.contact_email} onChange={set('contact_email')} disabled={!loaded} />
          </div>
          <div className="qs-field qs-field--full">
            <label className="qs-label" htmlFor="set-addr">Store address</label>
            <textarea id="set-addr" className="qs-input adm-textarea" rows={2} value={form.store_address} onChange={set('store_address')} disabled={!loaded} />
          </div>
          <div className="qs-field qs-field--full">
            <label className="qs-label" htmlFor="set-hours">Opening hours</label>
            <input id="set-hours" className="qs-input" value={form.store_hours} onChange={set('store_hours')} disabled={!loaded} />
          </div>
          <div className="qs-field qs-field--full">
            <label className="qs-label" htmlFor="set-ig">Instagram link <i>· optional</i></label>
            <input id="set-ig" className="qs-input" type="url" value={form.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/wrfitzz" disabled={!loaded} />
          </div>
        </div>

        <div className="adm-ajustes__pie">
          <div aria-live="polite">
            {message && (
              <p className={message.type === 'ok' ? 'qs-ok-text' : 'qs-error-text'} role={message.type === 'ok' ? 'status' : 'alert'}>
                {message.text}
              </p>
            )}
          </div>
          <button type="submit" className="boton boton--lleno" disabled={busy || !loaded} aria-busy={busy || undefined}>
            Save store details
          </button>
        </div>
      </form>
    </section>
  );
}
