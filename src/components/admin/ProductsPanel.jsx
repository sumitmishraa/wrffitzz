'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import useDialog from '@/hooks/useDialog';
import { formatINR } from '@/lib/pricing';

const SIZE_PRESETS = [
  ['Letter sizes', ['XS', 'S', 'M', 'L', 'XL', 'XXL']],
  ['Waist 28–38', ['28', '30', '32', '34', '36', '38']],
  ['One size', ['One Size']],
];
const MAX_IMAGES = 12;

const slugify = (text) =>
  String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 120);

function Switch({ checked, onChange, label, busy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="adm-switch"
      onClick={() => onChange(!checked)}
      disabled={busy}
    >
      <span aria-hidden="true" />
    </button>
  );
}

function PriceCell({ product, onSave }) {
  const [value, setValue] = useState(String(product.price ?? ''));
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');

  const commit = async () => {
    const next = Math.round(Number(value));
    if (!Number.isFinite(next) || next < 0 || value === '') {
      setState('error');
      setError('Enter a price in rupees.');
      return;
    }
    if (next === Number(product.price)) return;
    setState('saving');
    setError('');
    try {
      await onSave({ price: next });
      setState('saved');
    } catch (err) {
      setState('error');
      setError(err.message);
    }
  };

  return (
    <div className="adm-precio">
      <label className="qs-sr" htmlFor={`price-${product.id}`}>Price of {product.name} in rupees</label>
      <span aria-hidden="true">₹</span>
      <input
        id={`price-${product.id}`}
        className="qs-input adm-precio__input"
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        value={value}
        onChange={(e) => { setValue(e.target.value); setState('idle'); }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        aria-invalid={state === 'error' ? 'true' : undefined}
        aria-describedby={`price-${product.id}-msg`}
      />
      <span id={`price-${product.id}-msg`} className={state === 'error' ? 'qs-error-text' : 'qs-hint'} aria-live="polite">
        {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? error : ''}
      </span>
    </div>
  );
}

function emptyProduct(categories) {
  return {
    name: '',
    slug: '',
    category_id: categories[0]?.id || '',
    gender: 'unisex',
    price: '',
    compare_price: '',
    description: '',
    material: '',
    care_instructions: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [],
    images: [],
    in_stock: true,
    is_visible: true,
    is_new: true,
    is_bestseller: false,
    is_featured: false,
  };
}

function ProductEditor({ product, categories, call, onClose, onSaved, onDeleted }) {
  const close = useCallback(() => onClose(), [onClose]);
  const panelRef = useDialog(true, close);
  const fileRef = useRef(null);
  const [id, setId] = useState(product?.id || null);
  const [form, setForm] = useState(() => {
    const base = emptyProduct(categories);
    if (!product) return base;
    return {
      ...base,
      ...product,
      price: product.price ?? '',
      compare_price: product.compare_price ?? '',
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
    };
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [newSize, setNewSize] = useState('');
  const [uploading, setUploading] = useState(null); // { done, total }
  const [uploadErrors, setUploadErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const field = (key) => (e) => set(key, e.target.value);
  const flag = (key) => (e) => set(key, e.target.checked);

  const onName = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  // ---------- images ----------
  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = MAX_IMAGES - form.images.length;
    const queue = files.slice(0, Math.max(0, room));
    const problems = files.length > queue.length ? [`Only ${MAX_IMAGES} images per product; ${files.length - queue.length} skipped.`] : [];
    setUploadErrors([]);
    setUploading({ done: 0, total: queue.length });
    for (let i = 0; i < queue.length; i += 1) {
      const file = queue[i];
      try {
        const fd = new FormData();
        fd.append('file', file);
        const data = await call('/api/upload', { method: 'POST', form: fd });
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      } catch (err) {
        problems.push(`${file.name}: ${err.message}`);
      }
      setUploading({ done: i + 1, total: queue.length });
    }
    setUploading(null);
    setUploadErrors(problems);
    if (fileRef.current) fileRef.current.value = '';
  };

  const moveImage = (from, to) =>
    setForm((f) => {
      if (to < 0 || to >= f.images.length) return f;
      const images = [...f.images];
      const [img] = images.splice(from, 1);
      images.splice(to, 0, img);
      return { ...f, images };
    });
  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }));

  // ---------- sizes & colours ----------
  const addSizes = (list) =>
    setForm((f) => ({ ...f, sizes: [...f.sizes, ...list.filter((s) => s && !f.sizes.includes(s))] }));
  const removeSize = (s) => setForm((f) => ({ ...f, sizes: f.sizes.filter((x) => x !== s) }));
  const setColor = (i, key, value) =>
    setForm((f) => ({ ...f, colors: f.colors.map((c, k) => (k === i ? { ...c, [key]: value } : c)) }));
  const addColor = () => setForm((f) => ({ ...f, colors: [...f.colors, { name: '', hex: '#1B1D20' }] }));
  const removeColor = (i) => setForm((f) => ({ ...f, colors: f.colors.filter((_, k) => k !== i) }));

  // ---------- save / delete ----------
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Give the product a name.';
    if (form.price === '' || Number(form.price) < 0 || !Number.isFinite(Number(form.price))) e.price = 'Enter a price in rupees.';
    if (form.compare_price !== '' && form.compare_price != null && Number(form.compare_price) <= Number(form.price)) {
      e.compare_price = 'The compare-at price should be higher than the price, or left empty.';
    }
    if (form.is_visible && form.images.length === 0) e.images = 'Add at least one photo before showing this product in the store.';
    return e;
  };

  const save = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ type: 'error', text: 'Check the highlighted fields.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const body = {
      ...form,
      price: Number(form.price),
      compare_price: form.compare_price === '' ? null : Number(form.compare_price),
      colors: form.colors.filter((c) => c.name.trim()),
    };
    delete body.category;
    delete body.id;
    try {
      const data = id
        ? await call(`/api/products?id=${encodeURIComponent(id)}`, { method: 'PATCH', body })
        : await call('/api/products', { method: 'POST', body });
      setId(data.product.id);
      setForm((f) => ({ ...f, slug: data.product.slug }));
      setSlugTouched(true);
      onSaved(data.product);
      setMessage({ type: 'ok', text: id ? 'Changes saved.' : 'Product added.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await call(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      onDeleted(id);
      onClose();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setBusy(false);
    }
  };

  const errProps = (key) => ({
    'aria-invalid': errors[key] ? 'true' : undefined,
    'aria-describedby': errors[key] ? `pe-${key}-err` : undefined,
  });
  const errText = (key) => errors[key] && <p className="qs-error-text" id={`pe-${key}-err`}>{errors[key]}</p>;

  return (
    <>
      <div className="qs-velo" onClick={close} aria-hidden="true" />
      <div ref={panelRef} className="qs-drawer adm-drawer adm-drawer--ancho" role="dialog" aria-modal="true" aria-labelledby="pe-t" tabIndex={-1}>
        <div className="qs-drawer__cab">
          <h2 id="pe-t">{id ? `Edit ${form.name || 'product'}` : 'Add a product'}</h2>
          <button className="qs-cerrar" type="button" aria-label="Close editor" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <form className="qs-drawer__cuerpo" onSubmit={save} noValidate>
          <section className="adm-bloque" aria-labelledby="pe-fotos">
            <h3 id="pe-fotos" className="qs-caja__titulo">
              Photos
              <small>The first photo is the cover. The second shows on hover.</small>
            </h3>
            {form.images.length > 0 && (
              <ol className="adm-fotos">
                {form.images.map((src, i) => (
                  <li key={`${src}-${i}`} className="adm-foto">
                    <span className="adm-foto__img">
                      <Image src={src} alt={`Photo ${i + 1}`} fill sizes="140px" />
                      {i === 0 && <b className="qs-tag qs-tag--tinta">Cover</b>}
                    </span>
                    <span className="adm-foto__acciones">
                      <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>←</button>
                      <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === form.images.length - 1} aria-label={`Move photo ${i + 1} later`}>→</button>
                      {i > 0 && <button type="button" onClick={() => moveImage(i, 0)} aria-label={`Make photo ${i + 1} the cover`}>Cover</button>}
                      <button type="button" onClick={() => removeImage(i)} aria-label={`Remove photo ${i + 1}`}>Remove</button>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <div className="qs-field">
              <label className="qs-label" htmlFor="pe-upload">Add photos <i>· JPG, PNG, WebP or AVIF, up to 5 MB each</i></label>
              <input
                ref={fileRef}
                id="pe-upload"
                className="qs-input adm-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={Boolean(uploading) || form.images.length >= MAX_IMAGES}
                onChange={(e) => upload(e.target.files)}
                {...errProps('images')}
              />
              <div aria-live="polite">
                {uploading && <p className="qs-hint">Uploading {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}…</p>}
              </div>
              {uploadErrors.map((t) => <p key={t} className="qs-error-text" role="alert">{t}</p>)}
              {errText('images')}
            </div>
          </section>

          <section className="adm-bloque" aria-labelledby="pe-datos">
            <h3 id="pe-datos" className="qs-caja__titulo">Details</h3>
            <div className="qs-grid">
              <div className="qs-field qs-field--full">
                <label className="qs-label" htmlFor="pe-name">Name</label>
                <input id="pe-name" className="qs-input" value={form.name} onChange={onName} {...errProps('name')} />
                {errText('name')}
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="pe-price">Price <i>· ₹</i></label>
                <input id="pe-price" className="qs-input" type="number" inputMode="numeric" min="0" step="1" value={form.price} onChange={field('price')} {...errProps('price')} />
                {errText('price')}
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="pe-compare">Compare-at price <i>· optional, shown struck through</i></label>
                <input id="pe-compare" className="qs-input" type="number" inputMode="numeric" min="0" step="1" value={form.compare_price ?? ''} onChange={field('compare_price')} {...errProps('compare_price')} />
                {errText('compare_price')}
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="pe-cat">Category</label>
                <select id="pe-cat" className="qs-select adm-select" value={form.category_id || ''} onChange={field('category_id')}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="pe-gender">For</label>
                <select id="pe-gender" className="qs-select adm-select" value={form.gender} onChange={field('gender')}>
                  <option value="unisex">Everyone</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>
              <div className="qs-field qs-field--full">
                <label className="qs-label" htmlFor="pe-slug">Web address <i>· /product/{form.slug || '…'}</i></label>
                <input id="pe-slug" className="qs-input" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
              </div>
              <div className="qs-field qs-field--full">
                <label className="qs-label" htmlFor="pe-desc">Description</label>
                <textarea id="pe-desc" className="qs-input adm-textarea" rows={4} value={form.description} onChange={field('description')} />
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="pe-mat">Material</label>
                <input id="pe-mat" className="qs-input" value={form.material} onChange={field('material')} />
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="pe-care">Care</label>
                <input id="pe-care" className="qs-input" value={form.care_instructions} onChange={field('care_instructions')} />
              </div>
            </div>
          </section>

          <section className="adm-bloque" aria-labelledby="pe-tallas">
            <h3 id="pe-tallas" className="qs-caja__titulo">Sizes</h3>
            <ul className="adm-chips">
              {form.sizes.map((s) => (
                <li key={s}>
                  <span>{s}</span>
                  <button type="button" onClick={() => removeSize(s)} aria-label={`Remove size ${s}`}>✕</button>
                </li>
              ))}
              {form.sizes.length === 0 && <li className="qs-hint">No sizes yet.</li>}
            </ul>
            <div className="adm-fila-acciones">
              {SIZE_PRESETS.map(([label, list]) => (
                <button key={label} type="button" className="boton boton--texto" onClick={() => addSizes(list)}>Add {label.toLowerCase()}</button>
              ))}
            </div>
            <div className="qs-field">
              <label className="qs-label" htmlFor="pe-size">Add a size</label>
              <div className="qs-fila">
                <input
                  id="pe-size"
                  className="qs-input"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSizes([newSize.trim()]); setNewSize(''); } }}
                  placeholder="e.g. 40 or Free"
                />
                <button type="button" className="boton" onClick={() => { addSizes([newSize.trim()]); setNewSize(''); }}>Add</button>
              </div>
            </div>
          </section>

          <section className="adm-bloque" aria-labelledby="pe-colores">
            <h3 id="pe-colores" className="qs-caja__titulo">Colours</h3>
            {form.colors.map((c, i) => (
              <div key={i} className="adm-color">
                <label className="qs-sr" htmlFor={`pe-cn-${i}`}>Colour {i + 1} name</label>
                <input id={`pe-cn-${i}`} className="qs-input" value={c.name} onChange={(e) => setColor(i, 'name', e.target.value)} placeholder="Colour name" />
                <label className="qs-sr" htmlFor={`pe-ch-${i}`}>Colour {i + 1} swatch</label>
                <input id={`pe-ch-${i}`} className="adm-color__swatch" type="color" value={c.hex || '#1B1D20'} onChange={(e) => setColor(i, 'hex', e.target.value)} />
                <button type="button" className="qs-quitar" onClick={() => removeColor(i)}>Remove<span className="qs-sr"> colour {i + 1}</span></button>
              </div>
            ))}
            <button type="button" className="boton" onClick={addColor}>Add a colour</button>
          </section>

          <section className="adm-bloque" aria-labelledby="pe-estado">
            <h3 id="pe-estado" className="qs-caja__titulo">In the store</h3>
            <div className="adm-checks">
              {[
                ['is_visible', 'Show in the store', 'Switch off to hide it everywhere without deleting it.'],
                ['in_stock', 'In stock', 'When off, it shows as sold out and cannot be bought.'],
                ['is_new', 'Mark as new', 'Adds the “New” tag.'],
                ['is_bestseller', 'Bestseller', 'Adds the “Bestseller” tag and sorts it first.'],
                ['is_featured', 'Featured', 'Used for highlights.'],
              ].map(([key, label, hint]) => (
                <label key={key} className="qs-opcion">
                  <input type="checkbox" checked={Boolean(form[key])} onChange={flag(key)} />
                  <span><b>{label}</b><small>{hint}</small></span>
                </label>
              ))}
            </div>
          </section>

          <div className="adm-guardar">
            <div aria-live="polite">
              {message && (
                <p className={message.type === 'ok' ? 'qs-ok-text' : 'qs-error-text'} role={message.type === 'ok' ? 'status' : 'alert'}>
                  {message.text}
                </p>
              )}
            </div>
            <button type="submit" className="boton boton--lleno boton--ancho" disabled={busy || Boolean(uploading)} aria-busy={busy || undefined}>
              {id ? 'Save changes' : 'Add product'}
            </button>
            {id && (
              confirmDelete ? (
                <div className="adm-borrar" role="group" aria-label="Confirm delete">
                  <p className="qs-error-text">Delete “{form.name}” for good? Orders that include it keep their copy.</p>
                  <div className="qs-botones">
                    <button type="button" className="boton adm-boton-peligro" onClick={remove} disabled={busy}>Yes, delete</button>
                    <button type="button" className="boton" onClick={() => setConfirmDelete(false)}>Keep it</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="boton boton--texto adm-texto-peligro" onClick={() => setConfirmDelete(true)}>
                  Delete product
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default function ProductsPanel({ products, categories, call, onProductSaved, onProductDeleted }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [state, setState] = useState('all');
  const [editing, setEditing] = useState(null); // product, or 'new'
  const [busy, setBusy] = useState({});
  const [rowError, setRowError] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category_id !== category) return false;
      if (state === 'visible' && !p.is_visible) return false;
      if (state === 'hidden' && p.is_visible) return false;
      if (state === 'soldout' && p.in_stock !== false) return false;
      return !q || [p.name, p.slug, p.category?.name].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [products, query, category, state]);

  const patch = async (product, changes) => {
    setBusy((b) => ({ ...b, [product.id]: true }));
    setRowError('');
    try {
      const data = await call(`/api/products?id=${encodeURIComponent(product.id)}`, { method: 'PATCH', body: changes });
      onProductSaved(data.product);
      return data.product;
    } catch (err) {
      setRowError(`${product.name}: ${err.message}`);
      throw err;
    } finally {
      setBusy((b) => ({ ...b, [product.id]: false }));
    }
  };

  return (
    <section aria-labelledby="prod-titulo">
      <div className="adm-panel-cab">
        <div>
          <h1 id="prod-titulo" className="adm-h1">Products</h1>
          <p className="qs-sub" aria-live="polite">
            {shown.length} of {products.length} · {products.filter((p) => p.is_visible).length} live in the store
          </p>
        </div>
        <button type="button" className="boton boton--lleno" onClick={() => setEditing('new')}>Add product</button>
      </div>

      <div className="qs-filtros adm-filtros" role="search" aria-label="Filter products">
        <div className="qs-field qs-filtro qs-filtro--buscar">
          <label className="qs-label" htmlFor="prod-q">Search</label>
          <input id="prod-q" className="qs-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or web address" />
        </div>
        <div className="qs-field qs-filtro">
          <label className="qs-label" htmlFor="prod-cat">Category</label>
          <select id="prod-cat" className="qs-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="qs-field qs-filtro">
          <label className="qs-label" htmlFor="prod-state">Showing</label>
          <select id="prod-state" className="qs-select" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="all">All products</option>
            <option value="visible">Live in store</option>
            <option value="hidden">Switched off</option>
            <option value="soldout">Sold out</option>
          </select>
        </div>
      </div>

      {rowError && <div className="qs-alert" role="alert"><p>{rowError}</p></div>}

      {shown.length === 0 ? (
        <div className="qs-empty">
          <h2>{products.length === 0 ? 'No products yet' : 'No products match'}</h2>
          {products.length === 0 && <button type="button" className="boton boton--lleno" onClick={() => setEditing('new')}>Add your first product</button>}
        </div>
      ) : (
        <div className="adm-tabla-wrap">
          <table className="adm-tabla adm-tabla--productos">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Price</th>
                <th scope="col">In store</th>
                <th scope="col">In stock</th>
                <th scope="col"><span className="qs-sr">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className={p.is_visible ? undefined : 'adm-fila--apagada'}>
                  <th scope="row">
                    <span className="adm-prod">
                      <span className="adm-prod__img">
                        {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="48px" />}
                      </span>
                      <span className="adm-celda-2">
                        <b>{p.name}</b>
                        <span className="qs-hint">
                          {[p.category?.name, `${p.images?.length || 0} photos`, p.compare_price ? `was ${formatINR(p.compare_price)}` : null].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td><PriceCell key={p.id} product={p} onSave={(changes) => patch(p, changes)} /></td>
                  <td>
                    <Switch
                      checked={p.is_visible}
                      label={`Show ${p.name} in the store`}
                      busy={busy[p.id]}
                      onChange={(v) => patch(p, { is_visible: v }).catch(() => {})}
                    />
                  </td>
                  <td>
                    <Switch
                      checked={p.in_stock !== false}
                      label={`${p.name} in stock`}
                      busy={busy[p.id]}
                      onChange={(v) => patch(p, { in_stock: v }).catch(() => {})}
                    />
                  </td>
                  <td>
                    <button type="button" className="boton" onClick={() => setEditing(p)}>
                      Edit<span className="qs-sr"> {p.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductEditor
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? null : editing}
          categories={categories}
          call={call}
          onClose={() => setEditing(null)}
          onSaved={onProductSaved}
          onDeleted={onProductDeleted}
        />
      )}
    </section>
  );
}
