export type StorefrontThemeTokens = {
  primary: string;
  action: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  soft: string;
  highlight: string;
  border: string;
  actionHover: string;
  disabled: string;
  onPrimary: string;
  onAction: string;
};

/** Visual editorial da vitrine pública. A capa vem só de coverUrl do usuário. */
export function storefrontStyles(theme: StorefrontThemeTokens): string {
  return `:root{
--storefront-primary:${theme.primary};
--storefront-action:${theme.action};
--storefront-background:${theme.background};
--storefront-surface:${theme.surface};
--storefront-text:${theme.text};
--storefront-muted:${theme.muted};
--storefront-soft:${theme.soft};
--storefront-highlight:${theme.highlight};
--storefront-border:${theme.border};
--storefront-on-primary:${theme.onPrimary};
--storefront-on-action:${theme.onAction};
--storefront-action-hover:${theme.actionHover};
--storefront-disabled:${theme.disabled};
--wine:#4A2332;
--rose:#B65F72;
--cream:#FAF8F6;
--ink:#24181E;
--blush:#F5E5E8;
--neutral:#F5F3F1;
--warm:#6D6266;
--radius:14px;
--shadow:0 6px 16px rgba(74,35,50,.06)
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--cream)}
body{margin:0;min-width:320px;background:var(--cream);color:var(--ink);font-family:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.45;overflow-x:hidden}
button,input,select,textarea{font:inherit}
button,a{-webkit-tap-highlight-color:transparent}
a{color:inherit}
svg{width:1.15em;height:1.15em;flex:none}
.whatsapp-icon{width:1em;height:1em;aspect-ratio:1;overflow:visible;flex:none}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
:focus-visible{outline:2px solid var(--storefront-action);outline-offset:3px}

.announcement{min-height:34px;display:flex;align-items:center;justify-content:center;padding:6px 16px;background:var(--storefront-primary);color:#fff;font-weight:700;font-size:.78rem;letter-spacing:.01em;text-align:center}

.storefront-hero{position:relative;display:block;min-height:min(68vh,540px);width:100%;margin:0;padding:28px 20px 36px;overflow:hidden;background:var(--cream)}
.hero-cover,.hero-readability{position:absolute;inset:0}
.hero-cover{z-index:0;display:block;overflow:hidden;background:transparent}
.hero-cover img{display:block;width:100%;height:100%;object-fit:cover;object-position:var(--cover-position-x,50%) var(--cover-position-y,50%);transform:scale(var(--cover-scale,1))}
.hero-readability{z-index:1;pointer-events:none;background:linear-gradient(90deg,#FAF8F6 0%,rgba(250,248,246,.94) 22%,rgba(250,248,246,.62) 38%,rgba(250,248,246,.22) 54%,rgba(250,248,246,0) 70%)}
.storefront-hero.cover-failed .hero-cover{display:none}
.storefront-hero.cover-failed .hero-readability{background:var(--cream)}
.has-cover .hero-visual{display:none}
.no-visual:not(.has-cover){background:var(--cream)}

.hero-copy{position:relative;z-index:2;width:min(58%,268px);padding:0}
.identity-mark{width:52px;height:52px;margin:0 0 16px;padding:6px;border-radius:14px;display:grid;place-items:center;overflow:hidden;background:#fff;box-shadow:0 4px 12px rgba(36,24,30,.08)}
.identity-mark img{width:100%;height:100%;object-fit:contain}
.logo-placeholder{color:var(--storefront-action);display:grid;place-items:center}
.logo-placeholder svg{width:26px;height:26px}
.eyebrow{margin:0 0 8px;color:var(--storefront-action);font-size:.68rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.storefront-hero h1{margin:0;max-width:11ch;color:var(--storefront-primary);font-family:Manrope,system-ui,sans-serif;font-size:clamp(1.85rem,8.4vw,2.35rem);font-weight:800;line-height:1.05;letter-spacing:-.03em}
.introduction{max-width:24ch;margin:12px 0 0;color:var(--warm);font-size:.92rem;font-weight:500;line-height:1.45;white-space:pre-line}
.signature{display:flex;align-items:center;gap:6px;margin:10px 0 0;color:var(--storefront-action);font:600 0.92rem/1.2 Manrope,system-ui,sans-serif}
.signature svg{width:14px;height:14px}
.signature span{display:block}
.counts{display:inline-flex;align-items:center;min-height:28px;margin:14px 0 0;padding:0 11px;border-radius:999px;background:color-mix(in srgb,var(--neutral) 88%,var(--blush));color:var(--warm);font-size:.72rem;font-weight:700}
.primary-action{width:max-content;min-height:48px;margin-top:16px;padding:0 18px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:var(--storefront-action);color:var(--storefront-on-action);font-weight:800;font-size:.92rem;box-shadow:0 6px 14px color-mix(in srgb,var(--storefront-action) 18%,transparent)}
.primary-action:hover{background:var(--storefront-action-hover)}
.primary-action svg{width:18px;height:18px;aspect-ratio:1}

.hero-visual{position:relative;min-height:220px}
.organic{display:none!important}
.featured{position:absolute;left:var(--x-de);top:var(--y-de);z-index:var(--z-de);width:min(52%,260px);max-height:72%;height:auto;object-fit:cover;transform:translate(-50%,-50%) scale(var(--s-de))}
.featured-cutout{object-fit:contain;background:transparent;filter:drop-shadow(0 10px 18px rgba(36,24,30,.16))}
.featured-photo{object-fit:cover;border-radius:16px}
.hero-small-alternative{display:none}

.storefront-shell{width:min(720px,calc(100% - 32px));margin:0 auto}
.quick-info{position:relative;z-index:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:0 -16px 22px;padding:14px 8px;border:0;border-top:1px solid color-mix(in srgb,var(--storefront-action) 12%,transparent);border-radius:0;background:var(--cream);box-shadow:none}
.quick-item{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:4px 8px;color:var(--warm);font-size:.68rem;font-weight:600;text-align:center;line-height:1.25}
.quick-item+.quick-item{border-left:1px solid color-mix(in srgb,#24181E 10%,transparent)}
.quick-item svg{width:18px;height:18px;aspect-ratio:1;color:var(--storefront-primary)}

.discovery{padding:0 0 6px}
.search-row{display:flex;align-items:stretch;min-height:50px;border:1px solid color-mix(in srgb,var(--storefront-action) 22%,white);border-radius:16px;background:#fff}
.search-field{flex:1;min-width:0;min-height:50px;display:flex;align-items:center;gap:10px;padding:0 14px;border:0;background:transparent}
.search-field>svg{width:18px;height:18px;color:var(--warm)}
.search-field input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--ink);font-size:.95rem}
.search-field input::placeholder{color:#9a9194}
.search-field button{border:0;background:transparent;color:var(--warm);display:grid;place-items:center;min-width:40px;min-height:40px}
.filter-button{width:50px;min-width:50px;min-height:50px;border:0;border-left:1px solid color-mix(in srgb,var(--storefront-action) 16%,white);border-radius:0 16px 16px 0;background:transparent;color:var(--storefront-primary);display:grid;place-items:center}
.filter-button svg{width:18px;height:18px}
.filter-button span{display:none}

.category-scroll{display:flex;gap:18px;overflow-x:auto;padding:16px 2px 10px;scrollbar-width:none}
.category-scroll::-webkit-scrollbar{display:none}
.category-scroll button{min-height:36px;flex:none;padding:0 0 8px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--warm);font-weight:600;font-size:.88rem;white-space:nowrap}
.category-scroll button[aria-pressed=true]{background:transparent;color:var(--storefront-primary);border-bottom-color:var(--storefront-action);font-weight:800}

.type-tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 22px;border:0;background:transparent}
.type-tabs button{min-height:50px;border:1px solid color-mix(in srgb,var(--storefront-primary) 28%,white);border-radius:14px;background:var(--cream);color:var(--storefront-primary);font-weight:800;font-size:.88rem;display:flex;align-items:center;justify-content:center;gap:8px}
.type-tabs button+button{border:1px solid color-mix(in srgb,var(--storefront-primary) 28%,white)}
.type-tabs button[aria-selected=true]{background:var(--storefront-primary);border-color:var(--storefront-primary);color:#fff;box-shadow:none}
.type-tabs button>svg{width:18px;height:18px}
.type-tabs span{min-width:22px;min-height:22px;padding:0 6px;border-radius:999px;display:inline-grid;place-items:center;background:color-mix(in srgb,var(--blush) 70%,white);color:var(--storefront-primary);font-size:.72rem}
.type-tabs button[aria-selected=true] span{background:rgba(255,255,255,.2);color:#fff}

.listing-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:6px 0 16px}
.listing-header h2{margin:0;color:var(--storefront-primary);font-family:Manrope,system-ui,sans-serif;font-size:clamp(1.28rem,5vw,1.55rem);font-weight:800;letter-spacing:-.02em}
.listing-header p{margin:4px 0 0;color:var(--warm);font-size:.8rem}
.sort-field{position:relative;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:flex-end;color:var(--storefront-primary)}
.sort-field>span{display:flex;align-items:center;gap:0;font-size:0;pointer-events:none}
.sort-field>span svg{width:20px;height:20px}
.sort-field select{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.results-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

.storefront-grid,.cards-compact .storefront-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;align-items:start;gap:12px;padding:0 0 96px}
.storefront-card{min-width:0;height:auto;align-self:start;overflow:hidden;border:1px solid color-mix(in srgb,var(--storefront-action) 16%,white);border-radius:var(--radius);background:#fff;box-shadow:var(--shadow);display:flex;flex-direction:column}
.item-image,.cards-compact .item-image{width:100%;aspect-ratio:1;overflow:hidden;background:var(--blush)}
.item-image img{width:100%;height:100%;object-fit:cover;display:block}
.item-placeholder{position:relative;display:grid;place-items:center;min-height:0;color:var(--storefront-action);background:var(--blush)}
.item-placeholder:after{content:"";position:absolute;width:22px;height:34px;right:16%;bottom:12%;border:1.4px solid color-mix(in srgb,var(--storefront-action) 42%,transparent);border-radius:70% 40% 60% 40%;transform:rotate(22deg);pointer-events:none}
.item-placeholder svg{width:28px;height:28px}
.item-body,.cards-compact .item-body{height:auto;min-height:0;display:flex;flex-direction:column;padding:12px 12px 0}
.item-category{margin:0 0 4px;color:var(--storefront-action);font-size:.62rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.item-body h3{margin:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:var(--storefront-primary);font-family:Manrope,system-ui,sans-serif;font-size:.98rem;font-weight:800;line-height:1.2}
.item-description{display:none}
.item-description.expanded{display:block;margin:6px 0 0;color:var(--warm);font-size:.8rem}
.item-price{margin:6px 0 10px;color:var(--storefront-action);font-size:.82rem;font-weight:800}
.consultation{font-size:.78rem}
.item-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding:9px 0 12px;border-top:1px solid color-mix(in srgb,var(--storefront-action) 12%,white)}
.item-footer .item-meta{display:flex;align-items:center;gap:4px;min-width:0;margin:0;color:var(--warm);font-size:.68rem;font-weight:600}
.item-footer .item-meta svg{width:13px;height:13px;flex:none}
.card-action{width:auto;max-width:100%;min-height:34px;flex:0 1 auto;margin:0;padding:0 10px;border:0;border-radius:10px;background:var(--storefront-action);color:var(--storefront-on-action);display:inline-flex;align-items:center;justify-content:center;gap:5px;text-decoration:none;font-weight:800;font-size:.72rem;line-height:1;cursor:pointer;box-shadow:none;white-space:nowrap}
.card-action:hover{background:var(--storefront-action-hover)}
.card-action svg{width:13px;height:13px;aspect-ratio:1}

.no-results,.catalog-empty{text-align:center;padding:48px 16px;color:var(--warm)}
.no-results h3,.catalog-empty h2{color:var(--storefront-primary);font-family:Manrope,system-ui,sans-serif}
.catalog-empty>span svg{width:36px;height:36px}

.floating-contact{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:30;box-sizing:border-box;width:76px;height:76px;min-width:76px;min-height:76px;padding:8px 9px 10px;border:3px solid #fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;overflow:hidden;text-decoration:none;text-align:center;background:var(--storefront-action);color:#fff;box-shadow:0 8px 18px rgba(36,24,30,.16);font-size:.48rem;font-weight:800;line-height:1.1;letter-spacing:-.02em}
.floating-contact svg{width:18px;height:18px;aspect-ratio:1;flex:0 0 auto}
.floating-contact .floating-label{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;max-width:100%;min-width:0}
.floating-contact .floating-label span{display:block;max-width:100%;overflow-wrap:anywhere}

dialog{width:min(520px,calc(100% - 28px));max-height:calc(100dvh - 28px);border:0;border-radius:16px;padding:0;background:#fff;color:var(--ink);box-shadow:0 24px 60px rgba(36,24,30,.22)}
dialog::backdrop{background:rgba(36,24,30,.45)}
dialog form,.dialog-panel{display:grid;gap:14px;padding:22px}
dialog header{display:flex;align-items:center;justify-content:space-between;gap:15px}
dialog header p,dialog header h2{margin:0}
.dialog-close{width:44px;height:44px;border:1px solid var(--storefront-border);border-radius:50%;display:grid;place-items:center;background:transparent;color:var(--ink)}
dialog label{display:grid;gap:6px;font-weight:700}
dialog input,dialog select,dialog textarea{width:100%;min-height:46px;border:1px solid var(--storefront-border);border-radius:10px;padding:10px;background:var(--cream);color:var(--ink)}
dialog textarea{min-height:84px;resize:vertical}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dialog-submit{min-height:48px;border:0;border-radius:12px;background:var(--storefront-action);color:var(--storefront-on-action);font-weight:800}
footer{padding:24px 16px calc(24px + env(safe-area-inset-bottom));text-align:center;color:var(--warm);font-size:.76rem;border-top:1px solid color-mix(in srgb,var(--storefront-action) 10%,white)}

@media(min-width:430px){
  .storefront-hero{padding:32px 24px 40px}
  .hero-copy{width:min(52%,300px)}
  .storefront-shell{width:min(760px,calc(100% - 36px))}
  .quick-info{margin-inline:-18px}
}
@media(min-width:480px){
  .storefront-hero{min-height:min(64vh,560px);padding:36px 28px 44px}
  .hero-copy{width:min(48%,320px)}
  .identity-mark{width:56px;height:56px}
  .storefront-hero h1{font-size:clamp(2rem,6vw,2.6rem)}
}
@media(min-width:768px){
  .storefront-hero{min-height:520px;padding:44px 48px 48px}
  .hero-readability{background:linear-gradient(90deg,#FAF8F6 0%,rgba(250,248,246,.92) 26%,rgba(250,248,246,.5) 44%,rgba(250,248,246,.12) 60%,rgba(250,248,246,0) 74%)}
  .hero-copy{width:min(42%,380px)}
  .identity-mark{width:58px;height:58px}
  .storefront-hero h1{max-width:12ch;font-size:clamp(2.2rem,4.4vw,3rem)}
  .introduction{max-width:30ch;font-size:1rem}
  .storefront-shell{width:min(860px,calc(100% - 48px))}
  .quick-info{margin:0 0 28px;padding:16px 4px}
  .quick-item{font-size:.78rem}
  .search-field,.search-row{min-height:54px}
  .filter-button{width:54px;min-width:54px;min-height:54px}
  .storefront-grid,.cards-compact .storefront-grid{gap:16px}
  .item-body h3{font-size:1.08rem}
  .item-price{font-size:.9rem}
  .card-action{min-height:36px;padding:0 12px;font-size:.76rem}
  .floating-contact{width:80px;height:80px;min-width:80px;min-height:80px;font-size:.5rem}
  .featured{left:var(--x-ta);top:var(--y-ta);z-index:var(--z-ta);transform:translate(-50%,-50%) scale(var(--s-ta))}
}
@media(min-width:1040px){
  .storefront-shell{width:min(980px,calc(100% - 64px))}
  .storefront-grid,.cards-compact .storefront-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .featured{left:var(--x-de);top:var(--y-de);z-index:var(--z-de);transform:translate(-50%,-50%) scale(var(--s-de))}
}
@media(max-width:389px){
  .storefront-hero{padding:22px 16px 32px;min-height:min(70vh,500px)}
  .hero-copy{width:min(64%,250px)}
  .storefront-hero h1{font-size:clamp(1.7rem,8vw,2.05rem)}
  .introduction{font-size:.84rem}
  .storefront-shell{width:calc(100% - 24px)}
  .quick-info{margin-inline:-12px;padding:12px 4px}
  .quick-item{padding:2px 5px;font-size:.62rem}
  .card-action{white-space:normal;text-align:center;line-height:1.15;max-width:58%}
  .form-row{grid-template-columns:1fr}
}
@media(max-width:329px){
  .storefront-grid,.cards-compact .storefront-grid{grid-template-columns:1fr}
  .hero-copy{width:min(72%,230px)}
  .item-footer{flex-wrap:wrap}
  .card-action{max-width:100%}
}
@media(max-width:767px){
  .hero-small-alternative{display:block;width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
  .hero-small-alternative~.featured{display:none}
  .featured{left:var(--x-mo);top:var(--y-mo);z-index:var(--z-mo);transform:translate(-50%,-50%) scale(var(--s-mo))}
}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
@media(forced-colors:active){.primary-action,.card-action,.category-scroll button,.type-tabs button{border:1px solid ButtonText}}
`;
}
