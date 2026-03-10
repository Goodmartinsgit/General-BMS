import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, FileText, Globe, ChevronDown, ChevronUp, Eye, EyeOff,
  Plus, Trash2, Edit3, Save, X, GripVertical, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown, Image as ImageIcon, Type, AlignLeft, Megaphone,
  Grid3X3, MessageSquare, HelpCircle, Mail, Code, Loader2,
  LayoutPanelLeft, Settings2, Store, Navigation, Monitor, Smartphone,
  ExternalLink, Check, AlertCircle, Copy, RefreshCw,
  Home, BarChart3, Sparkles, Link as LinkIcon, Truck,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../api/axios';
import * as wb from '../api/websiteBuilder';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TYPE REGISTRY (for custom pages)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_TYPES = [
  {
    type: 'hero', label: 'Hero Banner', icon: ImageIcon,
    description: 'Full-width banner with heading, text and CTA buttons',
    defaultContent: {
      heading: 'Welcome to Our Store', subheading: 'Discover amazing products at unbeatable prices',
      cta_text: 'Shop Now', cta_url: '/products', secondary_cta_text: '', secondary_cta_url: '',
      background_image: '', background_type: 'color', background_color: '#1a1a2e',
      overlay_opacity: 0.4, text_alignment: 'center', text_color: 'light',
    },
  },
  {
    type: 'features', label: 'Features Grid', icon: Grid3X3,
    description: 'Grid of features, benefits or icons with text',
    defaultContent: {
      heading: 'Why Choose Us', subheading: '', columns: 3,
      items: [
        { icon: 'truck', title: 'Fast Delivery', description: 'Get your order quickly' },
        { icon: 'shield', title: 'Secure Payment', description: '100% safe transactions' },
        { icon: 'refresh', title: 'Easy Returns', description: '30-day return policy' },
      ],
    },
  },
  {
    type: 'text_block', label: 'Text Block', icon: Type,
    description: 'Heading and rich body text',
    defaultContent: { heading: '', body: '', alignment: 'left' },
  },
  {
    type: 'image_text', label: 'Image + Text', icon: LayoutPanelLeft,
    description: 'Side-by-side image and text with optional CTA',
    defaultContent: { heading: '', body: '', image_url: '', image_position: 'left', cta_text: '', cta_url: '' },
  },
  {
    type: 'products_grid', label: 'Products Grid', icon: Store,
    description: 'Display featured products',
    defaultContent: { heading: 'Featured Products', subheading: '', product_ids: [], columns: 4, show_all_link: true },
  },
  {
    type: 'categories_grid', label: 'Categories Grid', icon: Grid3X3,
    description: 'Category tiles for quick navigation',
    defaultContent: { heading: 'Shop by Category', subheading: '', category_ids: [], columns: 4 },
  },
  {
    type: 'testimonials', label: 'Testimonials', icon: MessageSquare,
    description: 'Customer reviews and social proof',
    defaultContent: {
      heading: 'What Our Customers Say', subheading: '',
      items: [{ name: 'Jane Doe', role: 'Customer', avatar: '', text: 'Amazing products and service!', rating: 5 }],
    },
  },
  {
    type: 'cta_banner', label: 'CTA Banner', icon: Megaphone,
    description: 'Eye-catching call to action section',
    defaultContent: {
      heading: 'Ready to Get Started?', subheading: 'Join thousands of happy customers',
      cta_text: 'Shop Now', cta_url: '/products',
      background_color: '#d4a017', text_color: '#ffffff',
    },
  },
  {
    type: 'faq', label: 'FAQ', icon: HelpCircle,
    description: 'Frequently asked questions accordion',
    defaultContent: {
      heading: 'Frequently Asked Questions', subheading: '',
      items: [
        { question: 'How long does shipping take?', answer: 'Usually 3–5 business days.' },
        { question: 'What is your return policy?', answer: 'We offer a 30-day return policy.' },
      ],
    },
  },
  {
    type: 'gallery', label: 'Image Gallery', icon: ImageIcon,
    description: 'Photo grid / gallery',
    defaultContent: { heading: '', columns: 3, images: [{ url: '', alt: '', caption: '' }] },
  },
  {
    type: 'newsletter', label: 'Newsletter', icon: Mail,
    description: 'Email signup form',
    defaultContent: {
      heading: 'Stay in the Loop',
      subheading: 'Get the latest news, offers and updates straight to your inbox.',
      placeholder: 'Enter your email address', button_text: 'Subscribe', background_color: '#f9fafb',
    },
  },
  {
    type: 'custom_html', label: 'Custom HTML', icon: Code,
    description: 'Paste raw HTML / embed code',
    defaultContent: { html: '<!-- Your custom HTML here -->' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

const FormField = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-theme-muted">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-theme-muted">{hint}</p>}
  </div>
);

const TInput = ({ value, onChange, placeholder, type = 'text', disabled, className = '' }) => (
  <input
    type={type}
    value={value ?? ''}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition disabled:opacity-60 ${className}`}
  />
);

const TTextarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value ?? ''}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition resize-none"
  />
);

const TSelect = ({ value, onChange, children }) => (
  <select
    value={value ?? ''}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm bg-theme-primary border border-theme rounded-lg text-theme-primary outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 transition cursor-pointer"
  >
    {children}
  </select>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${checked ? 'bg-accent-gold' : 'bg-theme-tertiary'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
    {label && <span className="text-sm text-theme-primary">{label}</span>}
  </label>
);

const ColorField = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-theme-muted">{label}</label>}
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-theme cursor-pointer bg-transparent p-0.5"
      />
      <TInput value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="flex-1" />
    </div>
  </div>
);

const SectionLabel = ({ children }) => (
  <h4 className="text-xs font-semibold text-theme-primary mb-2 pb-1 border-b border-theme uppercase tracking-wide">{children}</h4>
);

const ImageUploadField = ({ label, value, onChange, category = 'branding' }) => {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/upload/${category}`, fd);
      onChange(data.url);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-theme-muted">{label}</label>}
      <div className="flex gap-2 items-center">
        <TInput value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://..." className="flex-1" />
        <label className="flex-shrink-0 cursor-pointer px-3 py-2 text-xs bg-theme-secondary border border-theme rounded-lg text-theme-muted hover:text-theme-primary transition flex items-center gap-1">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
          <span>{uploading ? 'Uploading…' : 'Upload'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {value && (
        <img src={value} alt="preview" className="mt-1 w-20 h-14 object-cover rounded border border-theme" />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SAVE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

const SaveBar = ({ onSave, saving, saved }) => (
  <div className="flex items-center gap-3 pt-4 border-t border-theme mt-4">
    <button
      onClick={onSave}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2 bg-accent-gold hover:bg-accent-gold-dark text-white text-sm font-medium rounded-lg disabled:opacity-60 transition"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? 'Saving…' : 'Save Changes'}
    </button>
    {saved && (
      <span className="flex items-center gap-1 text-green-500 text-xs">
        <Check className="w-3.5 h-3.5" /> Saved
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ACCORDION SECTION PANEL (for home page sections)
// ─────────────────────────────────────────────────────────────────────────────

const AccordionPanel = ({ title, icon: Icon, visible, onToggleVisible, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-theme rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-theme-secondary cursor-pointer hover:bg-theme-tertiary/30 transition"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 text-theme-muted flex-shrink-0" />}
          <span className="text-sm font-semibold text-theme-primary">{title}</span>
        </div>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {onToggleVisible !== undefined && (
            <Toggle checked={!!visible} onChange={onToggleVisible} />
          )}
          <div onClick={() => setOpen(v => !v)}>
            {open ? <ChevronUp className="w-4 h-4 text-theme-muted" /> : <ChevronDown className="w-4 h-4 text-theme-muted" />}
          </div>
        </div>
      </div>
      {open && (
        <div className="px-4 py-4 bg-theme-primary space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE PICKER (visual card selector)
// ─────────────────────────────────────────────────────────────────────────────

function TemplatePicker({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`relative flex flex-col items-start rounded-xl border-2 overflow-hidden transition group ${
            value === opt.id
              ? 'border-accent-gold shadow-md'
              : 'border-theme hover:border-accent-gold/50'
          }`}
        >
          {/* Mini preview */}
          <div className="w-full bg-theme-secondary" style={{ aspectRatio: opt.aspect || '16/9' }}>
            <opt.Preview />
          </div>
          {/* Label row */}
          <div className="w-full px-2.5 py-2 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-semibold text-theme-primary leading-tight">{opt.label}</p>
              <p className="text-[10px] text-theme-muted leading-tight mt-0.5">{opt.desc}</p>
            </div>
            {value === opt.id && (
              <div className="w-4 h-4 rounded-full bg-accent-gold flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Desktop template mini-previews ────────────────────────────────────────────

const DesktopPreviews = {
  split: () => (
    <div className="w-full h-full flex bg-[#F8F5F0] p-1.5 gap-1.5">
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="h-1.5 w-3/4 rounded bg-gray-700" />
        <div className="h-1 w-1/2 rounded bg-gray-400" />
        <div className="mt-1 h-2 w-1/3 rounded-full bg-gray-800" />
      </div>
      <div className="w-2/5 relative">
        <div className="absolute inset-0 rounded-lg bg-[#C9BFAE] flex items-center justify-center">
          <ImageIcon className="w-3 h-3 text-gray-400" />
        </div>
        {/* Floating mini cards */}
        <div className="absolute bottom-0.5 right-0 flex flex-col gap-0.5">
          {[1,2].map(i => (
            <div key={i} className="w-6 bg-white rounded shadow-sm flex items-center gap-0.5 p-0.5">
              <div className="w-2 h-2 rounded bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-px">
                <div className="h-0.5 bg-gray-300 rounded w-full" />
                <div className="h-0.5 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  fullwidth: () => (
    <div className="w-full h-full relative bg-gray-800 flex items-end p-2">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <ImageIcon className="w-5 h-5 text-white" />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="relative z-10 space-y-0.5">
        <div className="h-2 w-16 bg-white rounded opacity-90" />
        <div className="h-1 w-10 bg-white/70 rounded" />
        <div className="mt-1 h-1.5 w-8 bg-white rounded-full" />
      </div>
    </div>
  ),
  fashion: () => (
    <div className="w-full h-full flex bg-white">
      <div className="flex-1 relative bg-gray-100 flex items-end">
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-gray-300" />
        </div>
        <div className="relative z-10 p-1.5 space-y-0.5">
          <div className="h-2.5 w-14 bg-gray-900 rounded" />
          <div className="h-1 w-9 bg-gray-400 rounded" />
          <div className="h-1.5 w-6 bg-gray-900 rounded-full mt-1" />
        </div>
      </div>
      {/* Feature cards strip */}
      <div className="w-5 flex flex-col gap-px bg-gray-50 p-0.5">
        {[1,2,3].map(i => (
          <div key={i} className="flex-1 bg-white rounded border border-gray-100 p-px">
            <div className="h-1 bg-gray-200 rounded w-full mb-px" />
            <div className="h-0.5 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  ),
  spotlight: () => (
    <div className="w-full h-full flex bg-white p-1.5 gap-1.5">
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="h-1 w-2/3 rounded bg-gray-300" />
        <div className="h-2 w-3/4 rounded bg-gray-800" />
        <div className="h-1 w-1/2 rounded bg-gray-400" />
        <div className="h-1.5 w-1/3 rounded-full bg-gray-900 mt-1" />
      </div>
      {/* Product floating */}
      <div className="w-2/5 relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-lg">
          <Store className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  ),
  deals_grid: () => (
    <div className="w-full h-full flex gap-1 p-1.5 bg-white">
      {[
        { label: 'New Deals', color: '#F8F5F0' },
        { label: 'Great Value', color: '#E8E8E8' },
      ].map((card, i) => (
        <div key={i} className="flex-1 rounded-lg p-1" style={{ background: card.color }}>
          <div className="h-1 w-3/4 rounded bg-gray-600 mb-1" />
          <div className="h-0.5 w-1/2 rounded bg-gray-400 mb-1.5" />
          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  ),
};

// ── Mobile template mini-previews ─────────────────────────────────────────────

const MobilePreviews = {
  dark_promo: () => (
    <div className="w-full h-full relative bg-[#1C1C1E] rounded-lg overflow-hidden flex items-end p-1.5">
      {/* Concentric rings */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
        {[20,14,8].map((sz, i) => (
          <div key={i} className="absolute rounded-full border border-white" style={{ width: sz, height: sz, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        ))}
      </div>
      {/* Hero image placeholder */}
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gray-600 opacity-40" />
      {/* Text */}
      <div className="relative z-10 space-y-0.5">
        <div className="h-1.5 w-8 bg-white rounded font-bold" />
        <div className="h-1 w-5 bg-green-400 rounded" />
        <div className="h-2 w-6 bg-green-500 rounded-full mt-0.5" />
      </div>
      {/* Dots */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`rounded-full ${i===0 ? 'w-2 h-0.5 bg-white' : 'w-0.5 h-0.5 bg-white/30'}`} />
        ))}
      </div>
    </div>
  ),
  minimal: () => (
    <div className="w-full h-full bg-[#F5F5F5] p-1.5 flex flex-col gap-1">
      {/* Search bar */}
      <div className="h-2.5 bg-white rounded-full border border-gray-200" />
      {/* Category chips */}
      <div className="flex gap-0.5">
        {[0,1,2].map(i => (
          <div key={i} className={`h-1.5 rounded-full flex-1 ${i===1 ? 'bg-gray-900' : 'bg-white border border-gray-200'}`} />
        ))}
      </div>
      {/* Heading */}
      <div className="h-1 w-1/2 bg-gray-800 rounded" />
      {/* Product grid */}
      <div className="flex-1 grid grid-cols-2 gap-0.5">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white rounded-lg" />
        ))}
      </div>
    </div>
  ),
  centered: () => (
    <div className="w-full h-full relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="text-center space-y-1 px-2">
        <div className="h-0.5 w-8 bg-white/60 rounded mx-auto" />
        <div className="h-2 w-12 bg-white rounded mx-auto" />
        <div className="h-1 w-9 bg-white/70 rounded mx-auto" />
        <div className="h-2 w-7 bg-white rounded-full mx-auto mt-1" />
      </div>
    </div>
  ),
};

// ── Config for all template options ──────────────────────────────────────────

const DESKTOP_TEMPLATES = [
  { id: 'split',      label: 'Split Hero',       desc: 'Text left · Image right · Floating cards', aspect: '16/7', Preview: DesktopPreviews.split },
  { id: 'fullwidth',  label: 'Full-Width Banner', desc: 'Background image · Bold text overlay',      aspect: '16/7', Preview: DesktopPreviews.fullwidth },
  { id: 'fashion',    label: 'Fashion Showcase',  desc: 'Large model image · Feature cards strip',   aspect: '16/7', Preview: DesktopPreviews.fashion },
  { id: 'spotlight',  label: 'Product Spotlight', desc: 'Floating product · Clean headline + CTA',   aspect: '16/7', Preview: DesktopPreviews.spotlight },
  { id: 'deals_grid', label: 'Deals Grid',        desc: 'Dual product highlight cards',              aspect: '16/7', Preview: DesktopPreviews.deals_grid },
];

const MOBILE_TEMPLATES = [
  { id: 'dark_promo', label: 'Dark Promo',  desc: 'Dark banner · Discount · Hero image',       aspect: '9/14', Preview: MobilePreviews.dark_promo },
  { id: 'minimal',    label: 'Minimal',     desc: 'No banner · Clean search + grid',           aspect: '9/14', Preview: MobilePreviews.minimal },
  { id: 'centered',   label: 'Centered',    desc: 'Gradient banner · Centered text + CTA',     aspect: '9/14', Preview: MobilePreviews.centered },
];

// ── Hero Slide Editor (single slide) ─────────────────────────────────────────

function HeroSlideEditor({ slide, onChange, onRemove, index, total, onMoveUp, onMoveDown, desktopTpl, mobileTpl }) {
  const [open, setOpen] = useState(index === 0);
  const upd = (key, val) => onChange({ ...slide, [key]: val });

  const updFeatureCard = (i, field, val) => {
    const cards = [...(slide.feature_cards || [])];
    cards[i] = { ...cards[i], [field]: val };
    upd('feature_cards', cards);
  };
  const addFeatureCard = () => upd('feature_cards', [...(slide.feature_cards || []), { label: '', sub: '' }]);
  const removeFeatureCard = (i) => upd('feature_cards', (slide.feature_cards || []).filter((_, idx) => idx !== i));

  return (
    <div className="border border-theme rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-theme-secondary cursor-pointer hover:bg-theme-tertiary/30 transition"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <GripVertical className="w-4 h-4 text-theme-muted flex-shrink-0" />
          <span className="text-sm font-semibold text-theme-primary truncate">
            Slide {index + 1}{slide.heading ? ` — ${slide.heading.slice(0, 30)}` : ''}
          </span>
          {!slide.is_visible && <span className="text-[10px] bg-theme-tertiary text-theme-muted px-2 py-0.5 rounded-full">Hidden</span>}
          {slide.is_visible !== false && slide.show_on_desktop === false && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Mobile only</span>}
          {slide.is_visible !== false && slide.show_on_mobile === false && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Desktop only</span>}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => onMoveUp()} disabled={index === 0} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition" title="Move up">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMoveDown()} disabled={index === total - 1} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition" title="Move down">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <Toggle checked={slide.is_visible !== false} onChange={v => upd('is_visible', v)} />
          {total > 1 && (
            <button onClick={onRemove} className="p-1 text-red-400 hover:text-red-600 transition" title="Delete slide">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div onClick={() => setOpen(v => !v)} className="cursor-pointer">
            {open ? <ChevronUp className="w-4 h-4 text-theme-muted" /> : <ChevronDown className="w-4 h-4 text-theme-muted" />}
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 py-4 bg-theme-primary space-y-4">
          {/* Platform visibility */}
          <div>
            <SectionLabel>Show On</SectionLabel>
            <p className="text-[10px] text-theme-muted mb-3">Choose which platforms display this slide.</p>
            <div className="flex gap-6">
              <Toggle checked={slide.show_on_desktop !== false} onChange={v => upd('show_on_desktop', v)} label="Desktop" />
              <Toggle checked={slide.show_on_mobile !== false} onChange={v => upd('show_on_mobile', v)} label="Mobile" />
            </div>
          </div>

          {/* Text visibility toggles */}
          <div>
            <SectionLabel>Text Visibility</SectionLabel>
            <p className="text-[10px] text-theme-muted mb-3">Toggle which text elements appear on this slide.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
              <Toggle checked={slide.show_badge !== false} onChange={v => upd('show_badge', v)} label="Badge text" />
              <Toggle checked={slide.show_heading !== false} onChange={v => upd('show_heading', v)} label="Heading" />
              <Toggle checked={slide.show_subheading !== false} onChange={v => upd('show_subheading', v)} label="Subheading" />
              <Toggle checked={slide.show_cta !== false} onChange={v => upd('show_cta', v)} label="CTA button" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {slide.show_badge !== false && (
              <FormField label="Badge / Eyebrow text" hint="Small label shown above the main heading">
                <TInput value={slide.badge_text} onChange={e => upd('badge_text', e.target.value)} placeholder="New Collection · Free Shipping · 50% Off" />
              </FormField>
            )}
            {slide.show_heading !== false && (
              <FormField label="Main Heading">
                <TTextarea value={slide.heading} onChange={e => upd('heading', e.target.value)} placeholder="Transform Your Space with Sustainable Furniture" rows={2} />
              </FormField>
            )}
            {slide.show_subheading !== false && (
              <FormField label="Subheading / Description">
                <TTextarea value={slide.subheading} onChange={e => upd('subheading', e.target.value)} placeholder="Discover timeless pieces crafted for modern living." rows={2} />
              </FormField>
            )}
            {slide.show_cta !== false && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Primary CTA Text">
                  <TInput value={slide.cta_text} onChange={e => upd('cta_text', e.target.value)} placeholder="Shop Now" />
                </FormField>
                <FormField label="Primary CTA URL">
                  <TInput value={slide.cta_url} onChange={e => upd('cta_url', e.target.value)} placeholder="/products" />
                </FormField>
                <FormField label="Secondary CTA Text" hint="Optional second button">
                  <TInput value={slide.secondary_cta_text} onChange={e => upd('secondary_cta_text', e.target.value)} placeholder="Learn More" />
                </FormField>
                <FormField label="Secondary CTA URL">
                  <TInput value={slide.secondary_cta_url} onChange={e => upd('secondary_cta_url', e.target.value)} placeholder="/about" />
                </FormField>
              </div>
            )}
          </div>

          {/* Linked Product */}
          <div>
            <SectionLabel>Linked Product</SectionLabel>
            <p className="text-[10px] text-theme-muted mb-3">Link a product to this slide. The product image appears on the right and clicking leads to the product page.</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Product Slug" hint="e.g. blue-sneakers">
                <TInput value={slide.product_slug} onChange={e => upd('product_slug', e.target.value)} placeholder="product-slug" />
              </FormField>
              <FormField label="Product Image URL" hint="Overrides hero image on mobile">
                <TInput value={slide.product_image_url} onChange={e => upd('product_image_url', e.target.value)} placeholder="https://..." />
              </FormField>
            </div>
            <div className="mt-2">
              <ImageUploadField label="Or upload product image" value={slide.product_image_url} onChange={v => upd('product_image_url', v)} category="products" />
            </div>
          </div>

          {/* Hero / background image */}
          <div>
            <ImageUploadField label="Hero / background image" value={slide.image_url} onChange={v => upd('image_url', v)} category="branding" />
          </div>

          {/* Appearance */}
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Background Color" value={slide.bg_color || '#F8F5F0'} onChange={v => upd('bg_color', v)} />
            <FormField label="Text Color Scheme">
              <TSelect value={slide.text_color || 'dark'} onChange={e => upd('text_color', e.target.value)}>
                <option value="dark">Dark text (on light bg)</option>
                <option value="light">Light text (on dark/image bg)</option>
              </TSelect>
            </FormField>
          </div>
          {desktopTpl === 'fullwidth' && (
            <FormField label={`Image Overlay Opacity — ${Math.round((slide.overlay_opacity ?? 0.5) * 100)}%`} hint="Darkens the background image so text stays readable">
              <input type="range" min={0} max={1} step={0.05} value={slide.overlay_opacity ?? 0.5}
                onChange={e => upd('overlay_opacity', parseFloat(e.target.value))} className="w-full accent-yellow-500" />
            </FormField>
          )}

          {/* Floating feature cards (split template) */}
          {desktopTpl === 'split' && (
            <div>
              <SectionLabel>Floating Product Cards</SectionLabel>
              <p className="text-[10px] text-theme-muted mb-3">Mini-cards that float over the hero image. Add up to 3.</p>
              <div className="space-y-2">
                {(slide.feature_cards || []).map((card, i) => (
                  <div key={i} className="flex gap-2 items-start p-2.5 border border-theme rounded-lg bg-theme-secondary/30">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <FormField label="Label"><TInput value={card.label} onChange={e => updFeatureCard(i, 'label', e.target.value)} placeholder="Product name" /></FormField>
                      <FormField label="Sub-label"><TInput value={card.sub} onChange={e => updFeatureCard(i, 'sub', e.target.value)} placeholder="$49.00" /></FormField>
                    </div>
                    <button onClick={() => removeFeatureCard(i)} className="mt-5 p-1 text-red-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {(slide.feature_cards || []).length < 3 && (
                  <button onClick={addFeatureCard} className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline"><Plus className="w-3.5 h-3.5" /> Add Feature Card</button>
                )}
              </div>
            </div>
          )}

          {/* Mobile-specific fields with toggles */}
          {mobileTpl === 'dark_promo' && (
            <div>
              <SectionLabel>Mobile Dark Promo — Details</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 border border-theme rounded-lg bg-theme-secondary/30">
                  <div className="flex-1 mr-3">
                    <FormField label="Discount Label"><TInput value={slide.discount_label} onChange={e => upd('discount_label', e.target.value)} placeholder="Discount" disabled={slide.show_discount_label === false} /></FormField>
                  </div>
                  <Toggle checked={slide.show_discount_label !== false} onChange={v => upd('show_discount_label', v)} />
                </div>
                <div className="flex items-center justify-between p-2.5 border border-theme rounded-lg bg-theme-secondary/30">
                  <div className="flex-1 mr-3">
                    <FormField label="Discount Value"><TInput value={slide.discount_value} onChange={e => upd('discount_value', e.target.value)} placeholder="50%" disabled={slide.show_discount_value === false} /></FormField>
                  </div>
                  <Toggle checked={slide.show_discount_value !== false} onChange={v => upd('show_discount_value', v)} />
                </div>
                <div className="flex items-center justify-between p-2.5 border border-theme rounded-lg bg-theme-secondary/30">
                  <div className="flex-1 mr-3">
                    <FormField label="Button Text"><TInput value={slide.mobile_cta_text} onChange={e => upd('mobile_cta_text', e.target.value)} placeholder="Shop Now" disabled={slide.show_mobile_cta === false} /></FormField>
                  </div>
                  <Toggle checked={slide.show_mobile_cta !== false} onChange={v => upd('show_mobile_cta', v)} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hero Section Full Editor ──────────────────────────────────────────────────

const DEFAULT_SLIDE = {
  id: '', heading: '', subheading: '', badge_text: '', cta_text: 'Shop Now', cta_url: '/products',
  secondary_cta_text: '', secondary_cta_url: '', image_url: '', bg_color: '#1C1C1E',
  text_color: 'light', overlay_opacity: 0.5, feature_cards: [], discount_label: 'Discount',
  discount_value: '50%', mobile_cta_text: 'Shop Now', is_visible: true,
  show_badge: true, show_heading: true, show_subheading: true, show_cta: true,
  show_discount_label: true, show_discount_value: true, show_mobile_cta: true,
  product_slug: '', product_image_url: '',
  show_on_desktop: true, show_on_mobile: true,
};

function makeSlideId() {
  return 'slide_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

/** Migrate legacy single-hero fields into hero_slides array */
function migrateToSlides(hs) {
  if (hs.hero_slides?.length) return hs.hero_slides;
  // Build one slide from the flat fields
  return [{
    id: makeSlideId(),
    heading: hs.hero_heading || '',
    subheading: hs.hero_subheading || '',
    badge_text: hs.hero_badge_text || '',
    cta_text: hs.hero_cta_text || 'Shop Now',
    cta_url: hs.hero_cta_url || '/products',
    secondary_cta_text: hs.hero_secondary_cta_text || '',
    secondary_cta_url: hs.hero_secondary_cta_url || '',
    image_url: hs.hero_image_url || '',
    bg_color: hs.hero_bg_color || '#1C1C1E',
    text_color: hs.hero_text_color || 'dark',
    overlay_opacity: hs.hero_overlay_opacity ?? 0.5,
    feature_cards: hs.hero_feature_cards || [],
    discount_label: hs.mobile_discount_label || 'Discount',
    discount_value: hs.mobile_discount_value || '50%',
    mobile_cta_text: hs.mobile_cta_text || 'Shop Now',
    is_visible: true,
  }];
}

function HeroEditor({ hs, upd, onSave, saving, saved }) {
  const desktopTpl = hs.hero_template_desktop || 'split';
  const mobileTpl  = hs.hero_template_mobile  || 'dark_promo';

  // Ensure slides array exists
  const slides = migrateToSlides(hs);
  const setSlides = (newSlides) => upd('hero_slides', newSlides);

  const addSlide = () => {
    setSlides([...slides, { ...DEFAULT_SLIDE, id: makeSlideId() }]);
  };

  const updateSlide = (i, updated) => {
    const next = [...slides];
    next[i] = updated;
    setSlides(next);
  };

  const removeSlide = (i) => {
    if (slides.length <= 1) return;
    setSlides(slides.filter((_, idx) => idx !== i));
  };

  const moveSlide = (from, to) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSlides(next);
  };

  return (
    <div className="space-y-6">

      {/* ── Use mobile layout on desktop toggle ── */}
      <div className="flex items-center justify-between p-3 border border-theme rounded-lg bg-theme-secondary/30">
        <div>
          <p className="text-sm font-medium text-theme-primary">Use mobile hero on desktop</p>
          <p className="text-[10px] text-theme-muted">Display the mobile hero carousel full-width on desktop instead of desktop templates.</p>
        </div>
        <Toggle checked={!!hs.hero_use_mobile_on_desktop} onChange={v => upd('hero_use_mobile_on_desktop', v)} />
      </div>

      {/* ── Desktop template ── */}
      {!hs.hero_use_mobile_on_desktop && (
        <div>
          <SectionLabel>Desktop Template</SectionLabel>
          <TemplatePicker value={desktopTpl} onChange={v => upd('hero_template_desktop', v)} options={DESKTOP_TEMPLATES} />
        </div>
      )}

      {/* ── Mobile template ── */}
      <div>
        <SectionLabel>Mobile Template</SectionLabel>
        <TemplatePicker value={mobileTpl} onChange={v => upd('hero_template_mobile', v)} options={MOBILE_TEMPLATES} />
      </div>

      {/* ── Carousel Settings ── */}
      <div>
        <SectionLabel>Carousel Settings</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label="Swipe Direction">
            <TSelect value={hs.hero_swipe_direction || 'horizontal'} onChange={e => upd('hero_swipe_direction', e.target.value)}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </TSelect>
          </FormField>
          <FormField label="Autoplay">
            <TSelect value={hs.hero_autoplay ? 'on' : 'off'} onChange={e => upd('hero_autoplay', e.target.value === 'on')}>
              <option value="on">On</option>
              <option value="off">Off</option>
            </TSelect>
          </FormField>
          <FormField label="Interval (seconds)">
            <TInput type="number" value={hs.hero_autoplay_interval || 5} onChange={e => upd('hero_autoplay_interval', parseInt(e.target.value) || 5)} placeholder="5" />
          </FormField>
        </div>
      </div>

      {/* ── Mobile section heading ── */}
      <FormField label="Section Heading (below hero on mobile)">
        <TInput value={hs.mobile_section_heading} onChange={e => upd('mobile_section_heading', e.target.value)} placeholder="Special For You" />
      </FormField>

      {/* ── Hero Slides ── */}
      <div>
        <SectionLabel>Hero Slides ({slides.length})</SectionLabel>
        <div className="space-y-3">
          {slides.map((slide, i) => (
            <HeroSlideEditor
              key={slide.id || i}
              slide={slide}
              index={i}
              total={slides.length}
              onChange={updated => updateSlide(i, updated)}
              onRemove={() => removeSlide(i)}
              onMoveUp={() => moveSlide(i, i - 1)}
              onMoveDown={() => moveSlide(i, i + 1)}
              desktopTpl={desktopTpl}
              mobileTpl={mobileTpl}
            />
          ))}
        </div>
        <button onClick={addSlide} className="mt-3 flex items-center gap-1.5 text-xs text-accent-gold hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add Slide
        </button>
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE TAB
// ─────────────────────────────────────────────────────────────────────────────

function HomePageTab({ hs, setHs, onSave, saving, saved }) {
  // hs = home_sections object

  const upd = (key, val) => setHs(prev => ({ ...prev, [key]: val }));

  const updStatItem = (i, field, val) => {
    const stats = [...(hs.stats || [])];
    stats[i] = { ...stats[i], [field]: val };
    upd('stats', stats);
  };

  const addStat = () => {
    upd('stats', [...(hs.stats || []), { value: '', label: '' }]);
  };

  const removeStat = (i) => {
    upd('stats', (hs.stats || []).filter((_, idx) => idx !== i));
  };

  const updWhyItem = (i, field, val) => {
    const items = [...(hs.why_items || [])];
    items[i] = { ...items[i], [field]: val };
    upd('why_items', items);
  };

  const addWhyItem = () => {
    upd('why_items', [...(hs.why_items || []), { title: '', body: '' }]);
  };

  const removeWhyItem = (i) => {
    upd('why_items', (hs.why_items || []).filter((_, idx) => idx !== i));
  };

  const updBullet = (i, val) => {
    const bullets = [...(hs.cta_bullets || [])];
    bullets[i] = val;
    upd('cta_bullets', bullets);
  };

  const addBullet = () => upd('cta_bullets', [...(hs.cta_bullets || []), '']);
  const removeBullet = (i) => upd('cta_bullets', (hs.cta_bullets || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {/* Hero */}
      <AccordionPanel title="Hero Section" icon={ImageIcon} visible={hs.hero_visible} onToggleVisible={v => upd('hero_visible', v)} defaultOpen={true}>
        <HeroEditor hs={hs} upd={upd} onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* Stats */}
      <AccordionPanel title="Stats Bar" icon={BarChart3} visible={hs.stats_visible} onToggleVisible={v => upd('stats_visible', v)}>
        <div className="space-y-3">
          {(hs.stats || []).map((stat, i) => (
            <div key={i} className="flex gap-2 items-start p-3 border border-theme rounded-lg bg-theme-secondary/30">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <FormField label="Value (e.g. 18K+)">
                  <TInput value={stat.value} onChange={e => updStatItem(i, 'value', e.target.value)} placeholder="18K+" />
                </FormField>
                <FormField label="Label">
                  <TInput value={stat.label} onChange={e => updStatItem(i, 'label', e.target.value)} placeholder="Products delivered" />
                </FormField>
              </div>
              <button onClick={() => removeStat(i)} className="mt-5 p-1 text-red-400 hover:text-red-600 transition flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addStat}
            className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stat
          </button>
        </div>
        <SaveBar onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* Products Section */}
      <AccordionPanel title="Products Showcase" icon={Store} visible={hs.products_visible} onToggleVisible={v => upd('products_visible', v)}>
        <FormField label="Section Heading">
          <TInput value={hs.products_heading} onChange={e => upd('products_heading', e.target.value)} placeholder="Our Best Quality Products" />
        </FormField>
        <SaveBar onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* Why Choose Us */}
      <AccordionPanel title="Why Choose Us" icon={Sparkles} visible={hs.why_visible} onToggleVisible={v => upd('why_visible', v)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Section Heading">
            <TInput value={hs.why_heading} onChange={e => upd('why_heading', e.target.value)} placeholder="Why Choose Us" />
          </FormField>
          <div>
            <ImageUploadField label="Section Image" value={hs.why_image} onChange={v => upd('why_image', v)} category="branding" />
          </div>
        </div>
        <SectionLabel>Accordion Items</SectionLabel>
        <div className="space-y-3">
          {(hs.why_items || []).map((item, i) => (
            <div key={i} className="p-3 border border-theme rounded-lg bg-theme-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-theme-muted">Item {i + 1}</span>
                <button onClick={() => removeWhyItem(i)} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <FormField label="Title">
                <TInput value={item.title} onChange={e => updWhyItem(i, 'title', e.target.value)} placeholder="Sustainability" />
              </FormField>
              <FormField label="Body">
                <TTextarea value={item.body} onChange={e => updWhyItem(i, 'body', e.target.value)} placeholder="Describe this point..." rows={2} />
              </FormField>
            </div>
          ))}
          <button onClick={addWhyItem} className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        <SaveBar onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* CTA Banner */}
      <AccordionPanel title="CTA Banner" icon={Megaphone} visible={hs.cta_visible} onToggleVisible={v => upd('cta_visible', v)}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Eyebrow Text">
            <TInput value={hs.cta_eyebrow} onChange={e => upd('cta_eyebrow', e.target.value)} placeholder="Our Vision" />
          </FormField>
          <FormField label="Button Text">
            <TInput value={hs.cta_text} onChange={e => upd('cta_text', e.target.value)} placeholder="See Products" />
          </FormField>
        </div>
        <FormField label="Main Heading">
          <TInput value={hs.cta_heading} onChange={e => upd('cta_heading', e.target.value)} placeholder="When We Create Furniture," />
        </FormField>
        <FormField label="Heading (alt / accent color)">
          <TInput value={hs.cta_heading_alt} onChange={e => upd('cta_heading_alt', e.target.value)} placeholder="We Strive For The Finest Quality." />
        </FormField>
        <FormField label="Button URL">
          <TInput value={hs.cta_url} onChange={e => upd('cta_url', e.target.value)} placeholder="/products" />
        </FormField>
        <SectionLabel>Bullet Points</SectionLabel>
        <div className="space-y-2">
          {(hs.cta_bullets || []).map((b, i) => (
            <div key={i} className="flex gap-2">
              <TInput value={b} onChange={e => updBullet(i, e.target.value)} placeholder="Bullet point text" className="flex-1" />
              <button onClick={() => removeBullet(i)} className="text-red-400 hover:text-red-600 transition p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addBullet} className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add Bullet
          </button>
        </div>
        <SaveBar onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* Newsletter */}
      <AccordionPanel title="Newsletter Section" icon={Mail} visible={hs.newsletter_visible} onToggleVisible={v => upd('newsletter_visible', v)}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Heading">
            <TInput value={hs.newsletter_heading} onChange={e => upd('newsletter_heading', e.target.value)} placeholder="Subscribe to our newsletter" />
          </FormField>
          <FormField label="Subheading">
            <TInput value={hs.newsletter_subheading} onChange={e => upd('newsletter_subheading', e.target.value)} placeholder="and grab 30% OFF..." />
          </FormField>
          <FormField label="Placeholder Text">
            <TInput value={hs.newsletter_placeholder} onChange={e => upd('newsletter_placeholder', e.target.value)} placeholder="Enter your email address" />
          </FormField>
          <FormField label="Button Text">
            <TInput value={hs.newsletter_button_text} onChange={e => upd('newsletter_button_text', e.target.value)} placeholder="Subscribe" />
          </FormField>
        </div>
        <SaveBar onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* Mobile Promo */}
      <AccordionPanel title="Mobile Promo Banner" icon={Smartphone} visible={hs.mobile_promo_visible} onToggleVisible={v => upd('mobile_promo_visible', v)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Discount Label">
            <TInput value={hs.mobile_discount_label} onChange={e => upd('mobile_discount_label', e.target.value)} placeholder="Discount" />
          </FormField>
          <FormField label="Discount Value (e.g. 50%)">
            <TInput value={hs.mobile_discount_value} onChange={e => upd('mobile_discount_value', e.target.value)} placeholder="50%" />
          </FormField>
          <FormField label="CTA Button Text">
            <TInput value={hs.mobile_cta_text} onChange={e => upd('mobile_cta_text', e.target.value)} placeholder="Shop Now" />
          </FormField>
          <FormField label="Section Heading">
            <TInput value={hs.mobile_section_heading} onChange={e => upd('mobile_section_heading', e.target.value)} placeholder="Special For You" />
          </FormField>
        </div>
        <SaveBar onSave={onSave} saving={saving} saved={saved} />
      </AccordionPanel>

      {/* Global Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-gold hover:bg-accent-gold-dark text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save All Home Sections'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <Check className="w-4 h-4" /> Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION TAB
// ─────────────────────────────────────────────────────────────────────────────

function NavItemRow({ item, index, onEdit, onDelete, onMove, total }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border border-theme rounded-lg bg-theme-secondary/30">
      <GripVertical className="w-4 h-4 text-theme-muted flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-theme-primary truncate">{item.label || 'Untitled'}</p>
        <p className="text-xs text-theme-muted truncate">{item.url}</p>
      </div>
      {item.is_active !== undefined && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {item.is_active ? 'Active' : 'Hidden'}
        </span>
      )}
      <div className="flex items-center gap-1">
        <button onClick={() => onMove(index, -1)} disabled={index === 0} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onEdit(index)} className="p-1 text-theme-muted hover:text-accent-gold transition">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(index)} className="p-1 text-red-400 hover:text-red-600 transition">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function NavigationTab({ hc, setHc, fc, setFc, onSave, saving, saved }) {
  const [editingNav, setEditingNav] = useState(null); // null | { index: number, item: {} }
  const [editingLink, setEditingLink] = useState(null);

  const navItems = hc.nav_items || [];
  const serviceLinks = fc.service_links || [];

  const moveNav = (i, dir) => {
    const items = [...navItems];
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    setHc(prev => ({ ...prev, nav_items: items }));
  };

  const saveNavEdit = (item) => {
    const items = [...navItems];
    if (editingNav.index === -1) {
      items.push(item);
    } else {
      items[editingNav.index] = item;
    }
    setHc(prev => ({ ...prev, nav_items: items }));
    setEditingNav(null);
  };

  const deleteNav = (i) => {
    setHc(prev => ({ ...prev, nav_items: navItems.filter((_, idx) => idx !== i) }));
  };

  const moveLink = (i, dir) => {
    const links = [...serviceLinks];
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    [links[i], links[j]] = [links[j], links[i]];
    setFc(prev => ({ ...prev, service_links: links }));
  };

  const saveLinkEdit = (item) => {
    const links = [...serviceLinks];
    if (editingLink.index === -1) {
      links.push(item);
    } else {
      links[editingLink.index] = item;
    }
    setFc(prev => ({ ...prev, service_links: links }));
    setEditingLink(null);
  };

  const deleteLink = (i) => {
    setFc(prev => ({ ...prev, service_links: serviceLinks.filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="space-y-6">
      {/* Header Nav */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Header Navigation</h3>
            <p className="text-xs text-theme-muted">Links shown in the desktop header nav bar</p>
          </div>
          <button
            onClick={() => setEditingNav({ index: -1, item: { label: '', url: '', is_active: true } })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
        <div className="p-4 space-y-2">
          {navItems.length === 0 ? (
            <p className="text-sm text-theme-muted text-center py-4">No nav items yet. Add one above.</p>
          ) : navItems.map((item, i) => (
            <NavItemRow
              key={i} item={item} index={i} total={navItems.length}
              onEdit={(idx) => setEditingNav({ index: idx, item: { ...navItems[idx] } })}
              onDelete={deleteNav} onMove={moveNav}
            />
          ))}
        </div>
      </div>

      {/* Footer Service Links */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Footer Service Links</h3>
            <p className="text-xs text-theme-muted">Links shown in the "Service" column of the footer</p>
          </div>
          <button
            onClick={() => setEditingLink({ index: -1, item: { label: '', url: '' } })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
        <div className="p-4 space-y-2">
          {serviceLinks.length === 0 ? (
            <p className="text-sm text-theme-muted text-center py-4">No service links yet.</p>
          ) : serviceLinks.map((link, i) => (
            <NavItemRow
              key={i} item={link} index={i} total={serviceLinks.length}
              onEdit={(idx) => setEditingLink({ index: idx, item: { ...serviceLinks[idx] } })}
              onDelete={deleteLink} onMove={moveLink}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-gold hover:bg-accent-gold-dark text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Navigation'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      {/* Nav Edit Modal */}
      {editingNav && (
        <NavEditModal
          item={editingNav.item}
          title={editingNav.index === -1 ? 'Add Nav Item' : 'Edit Nav Item'}
          showActive
          onSave={saveNavEdit}
          onClose={() => setEditingNav(null)}
        />
      )}

      {/* Link Edit Modal */}
      {editingLink && (
        <NavEditModal
          item={editingLink.item}
          title={editingLink.index === -1 ? 'Add Footer Link' : 'Edit Footer Link'}
          showActive={false}
          onSave={saveLinkEdit}
          onClose={() => setEditingLink(null)}
        />
      )}
    </div>
  );
}

function NavEditModal({ item, title, showActive, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-theme-primary border border-theme rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h3 className="font-semibold text-theme-primary">{title}</h3>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Label">
            <TInput value={form.label} onChange={e => upd('label', e.target.value)} placeholder="Products" />
          </FormField>
          <FormField label="URL">
            <TInput value={form.url} onChange={e => upd('url', e.target.value)} placeholder="/products" />
          </FormField>
          {showActive && (
            <Toggle checked={!!form.is_active} onChange={v => upd('is_active', v)} label="Visible in nav" />
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2 bg-accent-gold text-white text-sm font-semibold rounded-lg hover:bg-accent-gold-dark transition"
          >
            Save
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-theme text-theme-primary text-sm rounded-lg hover:bg-theme-secondary transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY TAB
// ─────────────────────────────────────────────────────────────────────────────

function DeliveryTab({ dc, setDc, onSave, saving, saved, currency }) {
  const upd = (k, v) => setDc(prev => ({ ...prev, [k]: v }));
  const updPolicy = (k, v) => setDc(prev => ({ ...prev, policies: { ...(prev.policies || {}), [k]: v } }));
  const zones = dc.zones || [];

  const addZone = () => {
    setDc(prev => ({
      ...prev,
      zones: [...(prev.zones || []), { name: '', areas: '', fee: 0, est_days: '', is_active: true }],
    }));
  };

  const updateZone = (i, k, v) => {
    const updated = [...zones];
    updated[i] = { ...updated[i], [k]: v };
    setDc(prev => ({ ...prev, zones: updated }));
  };

  const removeZone = (i) => {
    setDc(prev => ({ ...prev, zones: (prev.zones || []).filter((_, idx) => idx !== i) }));
  };

  const moveZone = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= zones.length) return;
    const updated = [...zones];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setDc(prev => ({ ...prev, zones: updated }));
  };

  return (
    <div className="space-y-6">
      {/* Enable toggle + page text */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary">
          <h3 className="text-sm font-semibold text-theme-primary">Delivery Page</h3>
          <p className="text-xs text-theme-muted">Configure the public /delivery page shown to customers</p>
        </div>
        <div className="p-4 space-y-4">
          <Toggle checked={!!dc.enabled} onChange={v => upd('enabled', v)} label="Enable delivery page & show link in header" />
          <FormField label="Page Title">
            <TInput value={dc.title || ''} onChange={e => upd('title', e.target.value)} placeholder="Delivery Information" />
          </FormField>
          <FormField label="Page Description" hint="Introductory text shown at the top of the delivery page">
            <textarea
              value={dc.description || ''}
              onChange={e => upd('description', e.target.value)}
              placeholder="We deliver to the following areas..."
              rows={3}
              className="w-full rounded-lg border border-theme bg-theme-primary text-theme-primary px-3 py-2 text-sm focus:ring-2 focus:ring-accent-gold/30 focus:border-accent-gold outline-none transition resize-y"
            />
          </FormField>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Delivery Zones</h3>
            <p className="text-xs text-theme-muted">Define areas you deliver to, their fees and estimated delivery time</p>
          </div>
          <button
            onClick={addZone}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Zone
          </button>
        </div>
        <div className="p-4 space-y-3">
          {zones.length === 0 && (
            <p className="text-sm text-theme-muted text-center py-6">No delivery zones yet. Click "Add Zone" to create one.</p>
          )}
          {zones.map((zone, i) => (
            <div key={i} className="border border-theme rounded-lg p-4 space-y-3 bg-theme-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Zone {i + 1}</span>
                  <Toggle checked={zone.is_active !== false} onChange={v => updateZone(i, 'is_active', v)} label="" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveZone(i, -1)} disabled={i === 0} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveZone(i, 1)} disabled={i === zones.length - 1} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeZone(i)} className="p-1 text-red-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Zone Name">
                  <TInput value={zone.name} onChange={e => updateZone(i, 'name', e.target.value)} placeholder="e.g. City Center" />
                </FormField>
                <FormField label="Areas Covered">
                  <TInput value={zone.areas} onChange={e => updateZone(i, 'areas', e.target.value)} placeholder="e.g. Downtown, Midtown, Uptown" />
                </FormField>
                <FormField label={`Delivery Fee (${currency})`}>
                  <TInput type="number" value={zone.fee ?? ''} onChange={e => updateZone(i, 'fee', parseFloat(e.target.value) || 0)} placeholder="0" />
                </FormField>
                <FormField label="Estimated Delivery Time">
                  <TInput value={zone.est_days || ''} onChange={e => updateZone(i, 'est_days', e.target.value)} placeholder="e.g. Same day, 1-2 days" />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Policies */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary">
          <h3 className="text-sm font-semibold text-theme-primary">Delivery Policies</h3>
          <p className="text-xs text-theme-muted">Set rules and additional info for deliveries</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={`Minimum Order Amount (${currency})`} hint="0 = no minimum">
            <TInput type="number" value={dc.policies?.min_order ?? ''} onChange={e => updPolicy('min_order', parseFloat(e.target.value) || 0)} placeholder="0" />
          </FormField>
          <FormField label={`Free Delivery Above (${currency})`} hint="0 = never free">
            <TInput type="number" value={dc.policies?.free_delivery_above ?? ''} onChange={e => updPolicy('free_delivery_above', parseFloat(e.target.value) || 0)} placeholder="0" />
          </FormField>
          <FormField label="Delivery Hours">
            <TInput value={dc.policies?.delivery_hours || ''} onChange={e => updPolicy('delivery_hours', e.target.value)} placeholder="e.g. 9:00 AM - 6:00 PM" />
          </FormField>
          <FormField label="Additional Notes" hint="Shown at the bottom of the delivery page">
            <textarea
              value={dc.policies?.notes || ''}
              onChange={e => updPolicy('notes', e.target.value)}
              placeholder="e.g. Deliveries are not available on public holidays..."
              rows={3}
              className="w-full rounded-lg border border-theme bg-theme-primary text-theme-primary px-3 py-2 text-sm focus:ring-2 focus:ring-accent-gold/30 focus:border-accent-gold outline-none transition resize-y"
            />
          </FormField>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-gold hover:bg-accent-gold-dark text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Delivery Settings'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS TAB (header appearance + footer newsletter)
// ─────────────────────────────────────────────────────────────────────────────

function SettingsTab({ hc, setHc, fc, setFc, onSave, saving, saved }) {
  const updHc = (k, v) => setHc(prev => ({ ...prev, [k]: v }));
  const updFc = (k, v) => setFc(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Header settings */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary">
          <h3 className="text-sm font-semibold text-theme-primary">Header Settings</h3>
          <p className="text-xs text-theme-muted">Control which elements appear in the header</p>
        </div>
        <div className="p-4 space-y-4">
          <Toggle checked={!!hc.show_search} onChange={v => updHc('show_search', v)} label="Show search button" />
          <Toggle checked={!!hc.show_cart} onChange={v => updHc('show_cart', v)} label="Show cart button" />
        </div>
      </div>

      {/* Footer Colors */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary">
          <h3 className="text-sm font-semibold text-theme-primary">Footer Colors</h3>
          <p className="text-xs text-theme-muted">Customize the footer background and text colors</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorField label="Background Color" value={fc.bg_color || '#ffffff'} onChange={v => updFc('bg_color', v)} />
          <ColorField label="Text Color" value={fc.text_color || '#6b7280'} onChange={v => updFc('text_color', v)} />
        </div>
      </div>

      {/* Footer newsletter */}
      <div className="border border-theme rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-theme-secondary">
          <h3 className="text-sm font-semibold text-theme-primary">Footer Newsletter Block</h3>
          <p className="text-xs text-theme-muted">Text shown in the newsletter column of the footer</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Heading">
            <TInput value={fc.newsletter_heading} onChange={e => updFc('newsletter_heading', e.target.value)} placeholder="Newsletter" />
          </FormField>
          <FormField label="Sub-text">
            <TInput value={fc.newsletter_text} onChange={e => updFc('newsletter_text', e.target.value)} placeholder="Subscribe for exclusive deals..." />
          </FormField>
          <FormField label="Placeholder">
            <TInput value={fc.newsletter_placeholder} onChange={e => updFc('newsletter_placeholder', e.target.value)} placeholder="Email address" />
          </FormField>
          <FormField label="Button Text">
            <TInput value={fc.newsletter_button_text} onChange={e => updFc('newsletter_button_text', e.target.value)} placeholder="Subscribe" />
          </FormField>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-gold hover:bg-accent-gold-dark text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM PAGES TAB
// ─────────────────────────────────────────────────────────────────────────────

function SectionContentEditor({ type, content, onChange }) {
  const upd = (k, v) => onChange({ ...content, [k]: v });
  const updItem = (arr, i, k, v) => {
    const items = [...arr];
    items[i] = { ...items[i], [k]: v };
    return items;
  };

  if (type === 'hero') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <FormField label="Subheading"><TTextarea value={content.subheading} onChange={e => upd('subheading', e.target.value)} rows={2} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="CTA Text"><TInput value={content.cta_text} onChange={e => upd('cta_text', e.target.value)} /></FormField>
        <FormField label="CTA URL"><TInput value={content.cta_url} onChange={e => upd('cta_url', e.target.value)} /></FormField>
        <FormField label="Text Alignment">
          <TSelect value={content.text_alignment} onChange={e => upd('text_alignment', e.target.value)}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </TSelect>
        </FormField>
        <FormField label="Text Color">
          <TSelect value={content.text_color} onChange={e => upd('text_color', e.target.value)}>
            <option value="light">Light</option><option value="dark">Dark</option>
          </TSelect>
        </FormField>
      </div>
      <FormField label="Background Image URL"><TInput value={content.background_image} onChange={e => upd('background_image', e.target.value)} placeholder="https://..." /></FormField>
      <ColorField label="Background Color" value={content.background_color} onChange={v => upd('background_color', v)} />
    </div>
  );

  if (type === 'text_block') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <FormField label="Body Text"><TTextarea value={content.body} onChange={e => upd('body', e.target.value)} rows={5} /></FormField>
      <FormField label="Alignment">
        <TSelect value={content.alignment} onChange={e => upd('alignment', e.target.value)}>
          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
        </TSelect>
      </FormField>
    </div>
  );

  if (type === 'image_text') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <FormField label="Body Text"><TTextarea value={content.body} onChange={e => upd('body', e.target.value)} rows={4} /></FormField>
      <FormField label="Image URL"><TInput value={content.image_url} onChange={e => upd('image_url', e.target.value)} placeholder="https://..." /></FormField>
      <FormField label="Image Position">
        <TSelect value={content.image_position} onChange={e => upd('image_position', e.target.value)}>
          <option value="left">Left</option><option value="right">Right</option>
        </TSelect>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="CTA Text"><TInput value={content.cta_text} onChange={e => upd('cta_text', e.target.value)} /></FormField>
        <FormField label="CTA URL"><TInput value={content.cta_url} onChange={e => upd('cta_url', e.target.value)} /></FormField>
      </div>
    </div>
  );

  if (type === 'cta_banner') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <FormField label="Subheading"><TInput value={content.subheading} onChange={e => upd('subheading', e.target.value)} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="CTA Text"><TInput value={content.cta_text} onChange={e => upd('cta_text', e.target.value)} /></FormField>
        <FormField label="CTA URL"><TInput value={content.cta_url} onChange={e => upd('cta_url', e.target.value)} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Background" value={content.background_color} onChange={v => upd('background_color', v)} />
        <ColorField label="Text Color" value={content.text_color} onChange={v => upd('text_color', v)} />
      </div>
    </div>
  );

  if (type === 'newsletter') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <FormField label="Subheading"><TInput value={content.subheading} onChange={e => upd('subheading', e.target.value)} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Placeholder"><TInput value={content.placeholder} onChange={e => upd('placeholder', e.target.value)} /></FormField>
        <FormField label="Button Text"><TInput value={content.button_text} onChange={e => upd('button_text', e.target.value)} /></FormField>
      </div>
      <ColorField label="Background Color" value={content.background_color} onChange={v => upd('background_color', v)} />
    </div>
  );

  if (type === 'custom_html') return (
    <FormField label="HTML Code">
      <TTextarea value={content.html} onChange={e => upd('html', e.target.value)} rows={10} />
    </FormField>
  );

  if (type === 'features') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <FormField label="Columns">
        <TSelect value={content.columns} onChange={e => upd('columns', Number(e.target.value))}>
          {[2,3,4].map(n => <option key={n} value={n}>{n} columns</option>)}
        </TSelect>
      </FormField>
      <SectionLabel>Items</SectionLabel>
      {(content.items || []).map((item, i) => (
        <div key={i} className="p-3 border border-theme rounded-lg space-y-2 bg-theme-secondary/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-theme-muted">Item {i + 1}</span>
            <button onClick={() => upd('items', content.items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <FormField label="Title"><TInput value={item.title} onChange={e => upd('items', updItem(content.items, i, 'title', e.target.value))} /></FormField>
          <FormField label="Description"><TInput value={item.description} onChange={e => upd('items', updItem(content.items, i, 'description', e.target.value))} /></FormField>
        </div>
      ))}
      <button onClick={() => upd('items', [...(content.items || []), { icon: '', title: '', description: '' }])} className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline">
        <Plus className="w-3.5 h-3.5" /> Add Item
      </button>
    </div>
  );

  if (type === 'faq') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <SectionLabel>Q&A Items</SectionLabel>
      {(content.items || []).map((item, i) => (
        <div key={i} className="p-3 border border-theme rounded-lg space-y-2 bg-theme-secondary/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-theme-muted">Item {i + 1}</span>
            <button onClick={() => upd('items', content.items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <FormField label="Question"><TInput value={item.question} onChange={e => upd('items', updItem(content.items, i, 'question', e.target.value))} /></FormField>
          <FormField label="Answer"><TTextarea value={item.answer} onChange={e => upd('items', updItem(content.items, i, 'answer', e.target.value))} rows={2} /></FormField>
        </div>
      ))}
      <button onClick={() => upd('items', [...(content.items || []), { question: '', answer: '' }])} className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline">
        <Plus className="w-3.5 h-3.5" /> Add Item
      </button>
    </div>
  );

  if (type === 'testimonials') return (
    <div className="space-y-3">
      <FormField label="Heading"><TInput value={content.heading} onChange={e => upd('heading', e.target.value)} /></FormField>
      <SectionLabel>Testimonials</SectionLabel>
      {(content.items || []).map((item, i) => (
        <div key={i} className="p-3 border border-theme rounded-lg space-y-2 bg-theme-secondary/20">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-theme-muted">Testimonial {i + 1}</span>
            <button onClick={() => upd('items', content.items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Name"><TInput value={item.name} onChange={e => upd('items', updItem(content.items, i, 'name', e.target.value))} /></FormField>
            <FormField label="Role"><TInput value={item.role} onChange={e => upd('items', updItem(content.items, i, 'role', e.target.value))} /></FormField>
          </div>
          <FormField label="Review Text"><TTextarea value={item.text} onChange={e => upd('items', updItem(content.items, i, 'text', e.target.value))} rows={2} /></FormField>
        </div>
      ))}
      <button onClick={() => upd('items', [...(content.items || []), { name: '', role: '', avatar: '', text: '', rating: 5 }])} className="flex items-center gap-1.5 text-xs text-accent-gold hover:underline">
        <Plus className="w-3.5 h-3.5" /> Add Testimonial
      </button>
    </div>
  );

  return (
    <div className="p-3 bg-theme-secondary rounded-lg text-sm text-theme-muted">
      Editor for "{type}" sections is not yet available. You can add it as needed.
    </div>
  );
}

function SectionEditorDrawer({ section, onSave, onClose }) {
  const [content, setContent] = useState(section.content || {});
  const [settings, setSettings] = useState(section.settings || {});
  const [tab, setTab] = useState('content');
  const [saving, setSaving] = useState(false);

  const typeInfo = SECTION_TYPES.find(t => t.type === section.section_type);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ content, settings });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-theme-primary border-l border-theme flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div>
            <h3 className="font-semibold text-theme-primary">
              {typeInfo?.label || section.section_type}
            </h3>
            <p className="text-xs text-theme-muted">{typeInfo?.description}</p>
          </div>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-theme px-5">
          {['content', 'settings', 'visibility'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-1 mr-4 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-accent-gold text-accent-gold' : 'border-transparent text-theme-muted hover:text-theme-primary'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'content' && (
            <SectionContentEditor type={section.section_type} content={content} onChange={setContent} />
          )}
          {tab === 'settings' && (
            <div className="space-y-4">
              <FormField label="Background Color">
                <ColorField value={settings.bg_color} onChange={v => setSettings(p => ({ ...p, bg_color: v }))} />
              </FormField>
              <FormField label="Padding (top/bottom)">
                <TSelect value={settings.padding || 'md'} onChange={e => setSettings(p => ({ ...p, padding: e.target.value }))}>
                  <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option><option value="xl">Extra Large</option>
                </TSelect>
              </FormField>
            </div>
          )}
          {tab === 'visibility' && (
            <div className="space-y-4">
              <Toggle checked={section.is_visible !== false} onChange={v => onSave({ content, settings, is_visible: v })} label="Section is visible" />
              <p className="text-xs text-theme-muted">When hidden, this section won't appear on the published page.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-theme flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-gold text-white text-sm font-semibold rounded-lg hover:bg-accent-gold-dark disabled:opacity-60 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-theme text-theme-primary text-sm rounded-lg hover:bg-theme-secondary transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSectionModal({ onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-theme-primary border border-theme rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
          <h3 className="font-semibold text-theme-primary">Add Section</h3>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTION_TYPES.map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="flex flex-col items-start gap-2 p-4 border border-theme rounded-xl hover:border-accent-gold hover:bg-accent-gold/5 transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-theme-secondary group-hover:bg-accent-gold/10 flex items-center justify-center transition">
                <Icon className="w-4 h-4 text-theme-muted group-hover:text-accent-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-theme-primary">{label}</p>
                <p className="text-xs text-theme-muted leading-tight mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageFormModal({ page, onSave, onClose }) {
  const [form, setForm] = useState(page || {
    title: '', slug: '', meta_title: '', meta_description: '',
    is_active: true, show_in_nav: false,
  });
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-theme-primary border border-theme rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <h3 className="font-semibold text-theme-primary">{page ? 'Edit Page' : 'New Page'}</h3>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Page Title"><TInput value={form.title} onChange={e => upd('title', e.target.value)} placeholder="About Us" /></FormField>
          <FormField label="Slug (URL path)" hint="e.g. 'about-us' → yourstore.com/about-us">
            <TInput value={form.slug} onChange={e => upd('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="about-us" />
          </FormField>
          <FormField label="SEO Title"><TInput value={form.meta_title} onChange={e => upd('meta_title', e.target.value)} /></FormField>
          <FormField label="SEO Description"><TTextarea value={form.meta_description} onChange={e => upd('meta_description', e.target.value)} rows={2} /></FormField>
          <div className="flex gap-6">
            <Toggle checked={!!form.is_active} onChange={v => upd('is_active', v)} label="Published" />
            <Toggle checked={!!form.show_in_nav} onChange={v => upd('show_in_nav', v)} label="Show in nav" />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-gold text-white text-sm font-semibold rounded-lg hover:bg-accent-gold-dark disabled:opacity-60 transition">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Page'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-theme text-sm rounded-lg hover:bg-theme-secondary transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CustomPagesTab() {
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPageForm, setShowPageForm] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [error, setError] = useState('');

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await wb.listPages();
      setPages(data || []);
    } catch {
      setError('Failed to load pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const loadSections = useCallback(async (pageId) => {
    try {
      const { data } = await wb.listSections(pageId);
      setSections(data || []);
    } catch {
      setError('Failed to load sections.');
    }
  }, []);

  useEffect(() => {
    if (activePage) loadSections(activePage.id);
  }, [activePage, loadSections]);

  const handleSavePage = async (form) => {
    if (showPageForm?.id) {
      await wb.updatePage(showPageForm.id, form);
    } else {
      await wb.createPage(form);
    }
    await loadPages();
    setShowPageForm(null);
  };

  const handleDeletePage = async (id) => {
    if (!confirm('Delete this page and all its sections?')) return;
    await wb.deletePage(id);
    if (activePage?.id === id) setActivePage(null);
    await loadPages();
  };

  const handleAddSection = async (type) => {
    const typeInfo = SECTION_TYPES.find(t => t.type === type);
    await wb.createSection(activePage.id, {
      section_type: type,
      title: typeInfo?.label || type,
      content: typeInfo?.defaultContent || {},
      settings: {},
      is_visible: true,
    });
    setShowAddSection(false);
    await loadSections(activePage.id);
  };

  const handleSaveSection = async (updates) => {
    await wb.updateSection(activePage.id, editingSection.id, updates);
    setEditingSection(null);
    await loadSections(activePage.id);
  };

  const handleDeleteSection = async (secId) => {
    if (!confirm('Delete this section?')) return;
    await wb.deleteSection(activePage.id, secId);
    await loadSections(activePage.id);
  };

  const handleMoveSec = async (i, dir) => {
    const secs = [...sections];
    const j = i + dir;
    if (j < 0 || j >= secs.length) return;
    [secs[i], secs[j]] = [secs[j], secs[i]];
    setSections(secs);
    await wb.reorderSections(activePage.id, secs.map(s => s.id));
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="flex gap-5">
      {/* Pages list */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-theme-primary">Pages</h3>
          <button
            onClick={() => setShowPageForm({})}
            className="w-7 h-7 rounded-lg bg-accent-gold text-white flex items-center justify-center hover:bg-accent-gold-dark transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {pages.length === 0 && (
          <p className="text-xs text-theme-muted">No custom pages yet.</p>
        )}
        {pages.map(page => (
          <div
            key={page.id}
            onClick={() => setActivePage(page)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition border ${activePage?.id === page.id ? 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold' : 'border-theme hover:bg-theme-secondary text-theme-primary'}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{page.title}</p>
              <p className="text-[10px] text-theme-muted truncate">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={e => { e.stopPropagation(); setShowPageForm(page); }}
                className="p-0.5 text-theme-muted hover:text-accent-gold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleDeletePage(page.id); }}
                className="p-0.5 text-red-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sections editor */}
      <div className="flex-1 min-w-0">
        {!activePage ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-theme-muted mb-3" />
            <p className="text-sm font-medium text-theme-primary mb-1">Select a page to edit</p>
            <p className="text-xs text-theme-muted">Or create a new custom page using the + button.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-theme-primary">{activePage.title}</h3>
                <p className="text-xs text-theme-muted">/{activePage.slug}</p>
              </div>
              <button
                onClick={() => setShowAddSection(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>

            {sections.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-theme rounded-xl text-center">
                <Layout className="w-8 h-8 text-theme-muted mb-2" />
                <p className="text-sm text-theme-muted">No sections yet. Click "Add Section" to get started.</p>
              </div>
            )}

            {sections.map((sec, i) => {
              const typeInfo = SECTION_TYPES.find(t => t.type === sec.section_type);
              const Icon = typeInfo?.icon || Layout;
              return (
                <div key={sec.id} className="flex items-center gap-3 px-4 py-3 border border-theme rounded-xl bg-theme-secondary/20">
                  <GripVertical className="w-4 h-4 text-theme-muted flex-shrink-0" />
                  <Icon className="w-4 h-4 text-theme-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-primary">{sec.title || typeInfo?.label || sec.section_type}</p>
                    <p className="text-xs text-theme-muted capitalize">{typeInfo?.description || sec.section_type}</p>
                  </div>
                  {!sec.is_visible && (
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Hidden
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleMoveSec(i, -1)} disabled={i === 0} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleMoveSec(i, 1)} disabled={i === sections.length - 1} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingSection(sec)} className="p-1 text-theme-muted hover:text-accent-gold transition"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteSection(sec.id)} className="p-1 text-red-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPageForm !== null && (
        <PageFormModal page={showPageForm?.id ? showPageForm : null} onSave={handleSavePage} onClose={() => setShowPageForm(null)} />
      )}
      {showAddSection && (
        <AddSectionModal onAdd={handleAddSection} onClose={() => setShowAddSection(false)} />
      )}
      {editingSection && (
        <SectionEditorDrawer section={editingSection} onSave={handleSaveSection} onClose={() => setEditingSection(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR ITEM
// ─────────────────────────────────────────────────────────────────────────────

function SidebarItem({ icon: Icon, label, active, onClick, badge, indent = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-3 lg:py-2 text-left transition-colors min-h-[44px] lg:min-h-0 ${indent ? 'pl-5' : ''} ${
        active
          ? 'bg-accent-gold/10 text-accent-gold font-medium'
          : 'text-theme-primary hover:bg-theme-secondary'
      }`}
    >
      <Icon className={`w-4 h-4 lg:w-3.5 lg:h-3.5 flex-shrink-0 ${active ? 'text-accent-gold' : 'text-theme-muted'}`} />
      <span className="text-sm truncate flex-1">{label}</span>
      {badge && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium flex-shrink-0">
          {badge}
        </span>
      )}
      {active && <div className="w-1 h-4 rounded-full bg-accent-gold flex-shrink-0" />}
    </button>
  );
}

function SidebarSection({ label }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <p className="text-[9px] font-bold uppercase tracking-widest text-theme-muted">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SECTIONS EDITOR  (reusable — renders sections for one custom page)
// ─────────────────────────────────────────────────────────────────────────────

function PageSectionsEditor({ page, onEditPageMeta }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [error, setError] = useState('');

  const loadSections = useCallback(async () => {
    if (!page) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await wb.listSections(page.id);
      setSections(data || []);
    } catch {
      setError('Failed to load sections.');
    } finally {
      setLoading(false);
    }
  }, [page?.id]);

  useEffect(() => { loadSections(); }, [loadSections]);

  const handleAddSection = async (type) => {
    const typeInfo = SECTION_TYPES.find(t => t.type === type);
    await wb.createSection(page.id, {
      section_type: type,
      title: typeInfo?.label || type,
      content: typeInfo?.defaultContent || {},
      settings: {},
      is_visible: true,
    });
    setShowAddSection(false);
    await loadSections();
  };

  const handleSaveSection = async (updates) => {
    await wb.updateSection(page.id, editingSection.id, updates);
    setEditingSection(null);
    await loadSections();
  };

  const handleDeleteSection = async (secId) => {
    if (!confirm('Delete this section?')) return;
    await wb.deleteSection(page.id, secId);
    await loadSections();
  };

  const handleMoveSec = async (i, dir) => {
    const secs = [...sections];
    const j = i + dir;
    if (j < 0 || j >= secs.length) return;
    [secs[i], secs[j]] = [secs[j], secs[i]];
    setSections(secs);
    await wb.reorderSections(page.id, secs.map(s => s.id));
  };

  if (!page) return null;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-theme-primary">{page.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-theme-muted">/{page.slug}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${page.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {page.is_active ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEditPageMeta && (
            <button
              onClick={onEditPageMeta}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-theme text-theme-muted rounded-lg hover:text-theme-primary hover:bg-theme-secondary transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Settings
            </button>
          )}
          <button
            onClick={() => setShowAddSection(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Section
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-theme rounded-xl text-center">
          <Layout className="w-8 h-8 text-theme-muted mb-2" />
          <p className="text-sm font-medium text-theme-primary mb-1">No sections yet</p>
          <p className="text-xs text-theme-muted mb-4">Click "Add Section" to start building this page.</p>
          <button
            onClick={() => setShowAddSection(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition"
          >
            <Plus className="w-4 h-4" /> Add First Section
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((sec, i) => {
            const typeInfo = SECTION_TYPES.find(t => t.type === sec.section_type);
            const Icon = typeInfo?.icon || Layout;
            return (
              <div key={sec.id} className="flex items-center gap-3 px-4 py-3 border border-theme rounded-xl bg-theme-secondary/20 hover:bg-theme-secondary/40 transition">
                <GripVertical className="w-4 h-4 text-theme-muted flex-shrink-0" />
                <Icon className="w-4 h-4 text-theme-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-theme-primary truncate">{sec.title || typeInfo?.label || sec.section_type}</p>
                  <p className="text-xs text-theme-muted capitalize">{typeInfo?.description || sec.section_type}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sec.is_visible !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {sec.is_visible !== false ? 'Visible' : 'Hidden'}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMoveSec(i, -1)} disabled={i === 0} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleMoveSec(i, 1)} disabled={i === sections.length - 1} className="p-1 text-theme-muted hover:text-theme-primary disabled:opacity-30 transition"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingSection(sec)} className="p-1 text-theme-muted hover:text-accent-gold transition"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteSection(sec.id)} className="p-1 text-red-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddSection && <AddSectionModal onAdd={handleAddSection} onClose={() => setShowAddSection(false)} />}
      {editingSection && <SectionEditorDrawer section={editingSection} onSave={handleSaveSection} onClose={() => setEditingSection(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV ITEM PAGE EDITOR  (resolves a nav item URL to its page builder)
// ─────────────────────────────────────────────────────────────────────────────

const BUILT_IN_PATHS = [
  { path: '/products',   label: 'Products Catalogue',   desc: 'Auto-generated from your product database. Manage products under Products → Inventory.' },
  { path: '/categories', label: 'Categories',           desc: 'Auto-generated from your product categories. Manage under Products → Categories.' },
  { path: '/cart',       label: 'Shopping Cart',        desc: 'Built-in cart page. No content editing needed.' },
  { path: '/checkout',   label: 'Checkout',             desc: 'Built-in checkout page. Controlled by payment settings.' },
  { path: '/account',    label: 'Customer Account',     desc: 'Built-in customer account area (orders, profile).' },
  { path: '/search',     label: 'Search Results',       desc: 'Auto-generated search results page.' },
  { path: '/wishlist',   label: 'Wishlist',             desc: 'Built-in wishlist page (enable in Store Settings → Features).' },
  { path: '/login',      label: 'Login / Register',     desc: 'Built-in customer authentication pages.' },
];

function NavItemPageEditor({ navItem, pages, onCreatePage, onEditPage }) {
  const slug = navItem.url.replace(/^\//, '').split('?')[0].split('#')[0];
  const builtIn = BUILT_IN_PATHS.find(b => navItem.url === b.path || navItem.url.startsWith(b.path + '/'));

  if (builtIn) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 flex items-center justify-center mb-4">
          <Globe className="w-7 h-7 text-accent-gold" />
        </div>
        <h3 className="text-base font-semibold text-theme-primary mb-1">{builtIn.label}</h3>
        <p className="text-sm text-theme-muted mb-2">{navItem.url}</p>
        <p className="text-sm text-theme-muted leading-relaxed">{builtIn.desc}</p>
        <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600 text-left w-full">
          <strong className="font-semibold">Tip:</strong> This is a built-in storefront page — its layout is handled automatically.
          You can customise colours and branding in <strong>Store Settings → Branding</strong>.
        </div>
      </div>
    );
  }

  const matchPage = pages.find(p => p.slug === slug || p.slug === navItem.url);

  if (!matchPage) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-theme-secondary flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-theme-muted" />
        </div>
        <h3 className="text-base font-semibold text-theme-primary mb-1">No page built yet</h3>
        <p className="text-sm text-theme-muted mb-1">"{navItem.label}" links to <code className="bg-theme-secondary px-1 rounded text-xs">{navItem.url}</code></p>
        <p className="text-sm text-theme-muted mb-6">Create a custom page for this URL to start adding sections and content.</p>
        <button
          onClick={() => onCreatePage({ title: navItem.label, slug })}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-gold text-white text-sm font-semibold rounded-lg hover:bg-accent-gold-dark transition"
        >
          <Plus className="w-4 h-4" /> Create Page for "{navItem.label}"
        </button>
      </div>
    );
  }

  return <PageSectionsEditor page={matchPage} onEditPageMeta={() => onEditPage(matchPage)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WebsiteBuilderPage() {
  // ── Store config state ─────────────────────────────────────────────────────
  const [rawConfig, setRawConfig]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [homeSections, setHomeSections]     = useState({});
  const [headerConfig, setHeaderConfig]     = useState({});
  const [footerConfig, setFooterConfig]     = useState({});
  const [deliveryConfig, setDeliveryConfig] = useState({});
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  // ── Custom pages state ─────────────────────────────────────────────────────
  const [pages, setPages]               = useState([]);
  const [showPageForm, setShowPageForm] = useState(null); // null | {} | page

  // ── Sidebar selection ──────────────────────────────────────────────────────
  // type: 'home' | 'nav-item' | 'custom-page' | 'navigation' | 'settings'
  const [selected, setSelected] = useState({ type: 'home' });

  // ── Mobile pages panel ─────────────────────────────────────────────────────
  // On mobile the pages panel is a collapsible accordion above the editor
  const [mobilePagesPanelOpen, setMobilePagesPanelOpen] = useState(true);
  const selectAndEdit = (sel) => { setSelected(sel); };

  // ── Load store config ──────────────────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/store-config');
      setRawConfig(data);
      setHomeSections(data.home_sections || {});
      setHeaderConfig(data.header_config || {});
      setFooterConfig(data.footer_config || {});
      setDeliveryConfig(data.delivery_config || {});
    } catch (err) {
      console.error(err);
      setError('Failed to load store configuration. Make sure the store is configured.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load custom pages ──────────────────────────────────────────────────────
  const loadPages = useCallback(async () => {
    try {
      const { data } = await wb.listPages();
      setPages(data || []);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { loadPages(); },  [loadPages]);

  // ── Save store config ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/store-config', {
        ...rawConfig,
        home_sections: homeSections,
        header_config: headerConfig,
        footer_config: footerConfig,
        delivery_config: deliveryConfig,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Page CRUD ──────────────────────────────────────────────────────────────
  const handleSavePage = async (form) => {
    let saved;
    if (showPageForm?.id) {
      const { data } = await wb.updatePage(showPageForm.id, form);
      saved = data;
    } else {
      const { data } = await wb.createPage(form);
      saved = data;
    }
    await loadPages();
    setShowPageForm(null);
    // Auto-select the newly created / edited page
    if (saved?.id) setSelected({ type: 'custom-page', pageId: saved.id });
  };

  const handleDeletePage = async (id) => {
    if (!confirm('Delete this page and all its sections?')) return;
    await wb.deletePage(id);
    if (selected.type === 'custom-page' && selected.pageId === id) setSelected({ type: 'home' });
    await loadPages();
  };

  // Called from NavItemPageEditor "Create Page for this URL"
  const handleCreatePageForNav = async ({ title, slug }) => {
    const { data } = await wb.createPage({ title, slug, is_active: true, show_in_nav: false });
    await loadPages();
    if (data?.id) setSelected({ type: 'custom-page', pageId: data.id });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const navItems = headerConfig.nav_items || [];

  // The custom page whose id matches the sidebar selection
  const selectedCustomPage =
    selected.type === 'custom-page'
      ? pages.find(p => p.id === selected.pageId) ?? null
      : null;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col h-full">
      <PageHeader title="App Builder" subtitle="Manage all storefront content and appearance" />
      <div className="flex justify-center items-center flex-1 py-16 px-4"><LoadingSpinner /></div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="App Builder"
        subtitle="Click any page on the left to edit its content and layout"
        actions={
          <a
            href="http://localhost:3006"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-theme text-theme-primary text-sm font-medium rounded-lg hover:bg-theme-secondary transition"
          >
            <ExternalLink className="w-4 h-4" /> Preview Storefront
          </a>
        }
      />

      {error && (
        <div className="mx-3 sm:mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={loadConfig} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      <div className="flex flex-col gap-3 px-3 sm:px-6 pb-6 lg:flex-row lg:gap-0 lg:flex-1 lg:min-h-0 lg:overflow-hidden">

        {/* ══════════════════════════════════════════
            LEFT SIDEBAR — page tree
        ══════════════════════════════════════════ */}
        <div className="w-full lg:w-52 lg:flex-shrink-0 lg:flex lg:flex-col border border-theme rounded-xl lg:rounded-l-xl lg:rounded-r-none overflow-hidden">

          {/* ── Mobile: collapsible toggle header ── */}
          <button
            type="button"
            className="lg:hidden w-full flex items-center justify-between px-4 py-3.5 bg-theme-secondary border-b border-theme cursor-pointer select-none"
            onClick={() => setMobilePagesPanelOpen(v => !v)}
          >
            <div className="flex items-center gap-2.5">
              <Layout className="w-4 h-4 text-theme-muted" />
              <span className="text-sm font-semibold text-theme-primary">Pages & Navigation</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform duration-200 ${mobilePagesPanelOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* ── Desktop: static header ── */}
          <div className="hidden lg:block px-3 py-2.5 bg-theme-secondary border-b border-theme flex-shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Pages</p>
          </div>

          {/* ── Collapsible body (hidden on mobile when closed, always open on desktop) ── */}
          <div className={`${mobilePagesPanelOpen ? '' : 'hidden'} lg:flex lg:flex-col lg:flex-1 lg:min-h-0`}>

          <div className="lg:flex-1 lg:overflow-y-auto py-1">
            {/* Home — always first */}
            <SidebarItem
              icon={Home}
              label="Home"
              active={selected.type === 'home'}
              onClick={() => selectAndEdit({ type: 'home' })}
            />

            {/* Nav items */}
            {navItems.length > 0 && (
              <>
                <SidebarSection label="Navigation" />
                {navItems.map(item => (
                  <SidebarItem
                    key={item.url}
                    icon={Globe}
                    label={item.label}
                    active={selected.type === 'nav-item' && selected.navItem?.url === item.url}
                    onClick={() => selectAndEdit({ type: 'nav-item', navItem: item })}
                    badge={item.is_active === false ? 'hidden' : null}
                    indent
                  />
                ))}
              </>
            )}

            {/* Custom pages */}
            {pages.length > 0 && (
              <>
                <SidebarSection label="Custom Pages" />
                {pages.map(page => (
                  <div
                    key={page.id}
                    className={`group flex items-center pr-1 ${
                      selected.type === 'custom-page' && selected.pageId === page.id
                        ? 'bg-accent-gold/10'
                        : 'hover:bg-theme-secondary'
                    }`}
                  >
                    <button
                      className="flex-1 flex items-center gap-2 pl-5 py-3 lg:py-2 text-left min-h-[44px] lg:min-h-0"
                      onClick={() => selectAndEdit({ type: 'custom-page', pageId: page.id })}
                    >
                      <FileText className={`w-4 h-4 lg:w-3.5 lg:h-3.5 flex-shrink-0 ${selected.type === 'custom-page' && selected.pageId === page.id ? 'text-accent-gold' : 'text-theme-muted'}`} />
                      <span className={`text-sm truncate ${selected.type === 'custom-page' && selected.pageId === page.id ? 'text-accent-gold font-medium' : 'text-theme-primary'}`}>
                        {page.title}
                      </span>
                      {!page.is_active && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium flex-shrink-0">draft</span>
                      )}
                    </button>
                    {/* Always visible on touch; hover-only on desktop */}
                    <div className="flex items-center gap-1 lg:gap-0.5 pr-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); setShowPageForm(page); }}
                        className="p-2 lg:p-1 text-theme-muted hover:text-accent-gold transition"
                        title="Page settings"
                      >
                        <Edit3 className="w-4 h-4 lg:w-3 lg:h-3" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeletePage(page.id); }}
                        className="p-2 lg:p-1 text-red-400 hover:text-red-600 transition"
                        title="Delete page"
                      >
                        <Trash2 className="w-4 h-4 lg:w-3 lg:h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add custom page */}
            <button
              onClick={() => setShowPageForm({})}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-theme-muted hover:text-accent-gold hover:bg-theme-secondary transition text-sm border-t border-dashed border-theme mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Custom Page</span>
            </button>
          </div>

          {/* ── CONFIGURE section ── */}
          <div className="border-t border-theme flex-shrink-0">
            <div className="px-3 py-2 bg-theme-secondary border-b border-theme">
              <p className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Configure</p>
            </div>
            <SidebarItem
              icon={Navigation}
              label="Nav Links"
              active={selected.type === 'navigation'}
              onClick={() => selectAndEdit({ type: 'navigation' })}
            />
            <SidebarItem
              icon={Truck}
              label="Delivery"
              active={selected.type === 'delivery'}
              onClick={() => selectAndEdit({ type: 'delivery' })}
            />
            <SidebarItem
              icon={Settings2}
              label="Header & Footer"
              active={selected.type === 'settings'}
              onClick={() => selectAndEdit({ type: 'settings' })}
            />
          </div>

          </div>{/* end collapsible body */}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — content editor
        ══════════════════════════════════════════ */}
        <div className="lg:flex-1 lg:overflow-y-auto border border-theme lg:border-l-0 rounded-xl lg:rounded-l-none lg:rounded-r-xl p-4 sm:p-6 min-w-0">

          {/* Home page */}
          {selected.type === 'home' && (
            <HomePageTab
              hs={homeSections}
              setHs={setHomeSections}
              onSave={handleSave}
              saving={saving}
              saved={saved}
            />
          )}

          {/* Nav item → resolves to built-in notice, create-page prompt, or sections editor */}
          {selected.type === 'nav-item' && selected.navItem && (
            <NavItemPageEditor
              navItem={selected.navItem}
              pages={pages}
              onCreatePage={handleCreatePageForNav}
              onEditPage={(page) => setShowPageForm(page)}
            />
          )}

          {/* Custom page → sections editor */}
          {selected.type === 'custom-page' && (
            selectedCustomPage
              ? <PageSectionsEditor
                  page={selectedCustomPage}
                  onEditPageMeta={() => setShowPageForm(selectedCustomPage)}
                />
              : <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="w-8 h-8 text-theme-muted mb-2" />
                  <p className="text-sm text-theme-muted">Page not found. It may have been deleted.</p>
                  <button onClick={() => setSelected({ type: 'home' })} className="mt-4 text-xs text-accent-gold underline">Go to Home</button>
                </div>
          )}

          {/* Navigation links manager */}
          {selected.type === 'navigation' && (
            <NavigationTab
              hc={headerConfig}
              setHc={setHeaderConfig}
              fc={footerConfig}
              setFc={setFooterConfig}
              onSave={handleSave}
              saving={saving}
              saved={saved}
            />
          )}

          {/* Delivery settings */}
          {selected.type === 'delivery' && (
            <DeliveryTab
              dc={deliveryConfig}
              setDc={setDeliveryConfig}
              onSave={handleSave}
              saving={saving}
              saved={saved}
              currency={rawConfig?.currency || 'NGN'}
            />
          )}

          {/* Header & footer settings */}
          {selected.type === 'settings' && (
            <SettingsTab
              hc={headerConfig}
              setHc={setHeaderConfig}
              fc={footerConfig}
              setFc={setFooterConfig}
              onSave={handleSave}
              saving={saving}
              saved={saved}
            />
          )}
        </div>
      </div>

      {/* Page create / edit modal */}
      {showPageForm !== null && (
        <PageFormModal
          page={showPageForm?.id ? showPageForm : null}
          onSave={handleSavePage}
          onClose={() => setShowPageForm(null)}
        />
      )}
    </div>
  );
}
