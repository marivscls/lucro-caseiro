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

/** Visual da vitrine pública. Tokens centralizados; a capa vem só de coverUrl. */
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
--lime:#DCE86A;
--cream:#FAF8F6;
--ink:#24181E;
--blush:#F5E5E8;
--warm:#6D6266;
--white:#FFFFFF;
--cover-height:196px;
--compact-header:56px;
--page-gutter:16px;
--radius-card:22px;
--radius-chip:999px;
--radius-item:16px;
--shadow-card:0 10px 28px rgba(36,24,30,.08);
--shadow-soft:0 4px 14px rgba(74,35,50,.06);
--touch:48px;
--font:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--cream)}
body{margin:0;min-width:320px;background:var(--cream);color:var(--ink);font-family:var(--font);line-height:1.45;overflow-x:hidden}
button,input,select,textarea{font:inherit}
button,a{-webkit-tap-highlight-color:transparent}
a{color:inherit}
[hidden]{display:none!important}
svg{width:1.15em;height:1.15em;flex:none}
.whatsapp-icon{width:1em;height:1em;aspect-ratio:1;overflow:visible;flex:none}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
:focus-visible{outline:2px solid var(--storefront-action);outline-offset:3px}
.skip-link{position:absolute;left:12px;top:-40px;z-index:80;padding:8px 12px;border-radius:10px;background:var(--wine);color:#fff;font-weight:700}
.skip-link:focus{top:12px}

.storefront-canvas{width:min(980px,100%);margin:0 auto;background:var(--cream)}

.announcement{min-height:34px;display:flex;align-items:center;justify-content:center;padding:7px var(--page-gutter);background:var(--storefront-primary);color:#fff;font-weight:700;font-size:.78rem;letter-spacing:.01em;text-align:center}

.compact-header{position:fixed;top:0;left:0;right:0;z-index:40;background:var(--white);box-shadow:0 6px 18px rgba(36,24,30,.08);transform:translateY(-110%);pointer-events:none;transition:transform .2s ease}
body.is-scrolled .compact-header{transform:translateY(0);pointer-events:auto}
.compact-header-inner{width:min(980px,100%);margin:0 auto;min-height:var(--compact-header);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px var(--page-gutter)}
.compact-brand{min-width:0;flex:1;display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--storefront-primary)}
.compact-brand img,.compact-brand .logo-placeholder{width:36px;height:36px;border-radius:50%;object-fit:cover;background:var(--blush);flex:none}
.compact-brand .logo-placeholder{display:grid;place-items:center;color:var(--storefront-action)}
.compact-brand .logo-placeholder svg{width:18px;height:18px}
.compact-brand span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800;font-size:1rem}
.compact-actions{display:flex;align-items:center;gap:4px;flex:none}
.icon-button{width:var(--touch);height:var(--touch);border:0;border-radius:50%;display:grid;place-items:center;background:transparent;color:var(--storefront-primary);text-decoration:none;cursor:pointer}
.icon-button svg{width:22px;height:22px}

.storefront-hero{position:relative;display:block;width:100%;margin:0;padding:0 0 8px;overflow:visible;background:transparent}
.hero-cover-wrap{position:relative;height:var(--cover-height);overflow:hidden;background:linear-gradient(180deg,color-mix(in srgb,var(--storefront-primary) 88%,#000) 0%,color-mix(in srgb,var(--storefront-primary) 70%,#6b3444) 100%)}
.hero-cover,.hero-readability{position:absolute;inset:0}
.hero-cover{z-index:0;display:block;overflow:hidden;background:transparent}
.hero-cover img{display:block;width:100%;height:100%;object-fit:cover;object-position:var(--cover-position-x,50%) var(--cover-position-y,50%);transform:scale(var(--cover-scale,1));transform-origin:var(--cover-position-x,50%) var(--cover-position-y,50%)}
.hero-readability{z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(36,24,30,.04) 0%,rgba(36,24,30,.18) 100%)}
.storefront-hero.cover-failed .hero-cover{display:none}
.storefront-hero.cover-failed .hero-readability{background:transparent}
.has-cover .hero-visual,.hero-small-alternative,.organic{display:none!important}
.featured{display:none}

.hero-classic .hero-cover-wrap,.hero-editorial .hero-cover-wrap{height:200px}
.hero-compact .hero-cover-wrap{height:180px}

.store-card{position:relative;z-index:2;width:calc(100% - 32px);margin:-52px auto 0;padding:0 18px 18px;border:1px solid color-mix(in srgb,var(--storefront-primary) 8%,white);border-radius:var(--radius-card);background:var(--white);box-shadow:var(--shadow-card);text-align:center}
.identity-mark{width:72px;height:72px;margin:-36px auto 10px;padding:3px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:var(--white);box-shadow:0 6px 16px rgba(36,24,30,.12);border:3px solid var(--white)}
.identity-mark img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.logo-placeholder{color:var(--storefront-action);display:grid;place-items:center}
.logo-placeholder svg{width:28px;height:28px}
.eyebrow{display:none}
.store-card h1{margin:0;color:var(--storefront-primary);font-family:var(--font);font-size:clamp(1.35rem,5.4vw,1.7rem);font-weight:800;line-height:1.2;letter-spacing:-.03em}
.introduction{margin:8px auto 0;max-width:36ch;color:var(--storefront-muted);font-size:.9rem;font-weight:500;line-height:1.4;white-space:pre-line}
.signature{display:flex;align-items:center;justify-content:center;gap:6px;margin:8px 0 0;color:var(--storefront-muted);font:600 0.84rem/1.2 var(--font)}
.signature svg{width:14px;height:14px}
.store-meta{display:flex;flex-direction:column;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:14px 0 0}
.counts{display:inline-flex;align-items:center;gap:6px;margin:0;color:var(--warm);font-size:.78rem;font-weight:700}
.counts svg{width:15px;height:15px;color:var(--storefront-primary)}
.status-chip{display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:0 10px;border-radius:var(--radius-chip);background:var(--lime);color:var(--ink);font-size:.72rem;font-weight:800;white-space:nowrap}
.status-dot{width:7px;height:7px;border-radius:50%;background:color-mix(in srgb,#3f6b1d 80%,#24181E)}
.primary-action{width:100%;min-height:var(--touch);margin-top:16px;padding:0 18px;border:1.5px solid var(--storefront-action);border-radius:var(--radius-chip);display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:var(--white);color:var(--storefront-action);font-weight:800;font-size:.95rem}
.primary-action:hover{background:var(--blush)}
.primary-action svg{width:18px;height:18px;aspect-ratio:1}

.storefront-shell{width:calc(100% - 32px);margin:0 auto;padding:12px 0 0}
.quick-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:14px 0 0;padding:10px 0 0;border-top:1px solid color-mix(in srgb,var(--storefront-action) 12%,transparent);background:transparent;box-shadow:none}
.quick-item{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:2px 6px;color:var(--warm);font-size:.68rem;font-weight:600;text-align:center;line-height:1.25}
.quick-item+.quick-item{border-left:1px solid color-mix(in srgb,#24181E 10%,transparent)}
.quick-item svg{width:16px;height:16px;color:var(--storefront-primary)}

.discovery{padding:4px 0 0}
.search-row{display:flex;align-items:stretch}
.search-field{flex:1;min-width:0;min-height:var(--touch);display:flex;align-items:center;gap:10px;padding:0 16px;border:1px solid var(--blush);border-radius:var(--radius-chip);background:var(--white)}
.search-field>svg{width:18px;height:18px;color:var(--warm)}
.search-field input{width:100%;min-width:0;min-height:44px;border:0;outline:0;background:transparent;color:var(--ink);font-size:1rem}
.search-field input::placeholder{color:#9a9194}
.search-field button{border:0;background:transparent;color:var(--warm);display:grid;place-items:center;min-width:40px;min-height:40px}
.filter-button{display:none}

.category-rail{position:sticky;top:0;z-index:28;margin:14px calc(var(--page-gutter) * -1) 0;padding:8px var(--page-gutter) 2px;background:var(--cream)}
body.is-scrolled .category-rail{top:var(--compact-header);background:var(--white);box-shadow:0 8px 16px rgba(36,24,30,.05)}
.category-scroll{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.category-scroll::-webkit-scrollbar{display:none}
.category-scroll button{min-height:36px;flex:none;padding:0 14px;border:1px solid var(--blush);border-radius:var(--radius-chip);background:var(--white);color:var(--storefront-primary);font-weight:700;font-size:.86rem;white-space:nowrap;cursor:pointer}
.category-scroll button[aria-pressed=true]{background:var(--storefront-primary);border-color:var(--storefront-primary);color:#fff}
[data-storefront][data-kind-filter=services] .category-rail{display:none!important}

.type-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 14px;border:0;background:transparent}
.type-tabs button{min-height:32px;padding:0 10px;border:1px solid color-mix(in srgb,var(--storefront-primary) 16%,white);border-radius:var(--radius-chip);background:var(--white);color:var(--storefront-primary);font-weight:700;font-size:.78rem;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
.type-tabs button[aria-selected=true]{background:var(--storefront-primary);border-color:var(--storefront-primary);color:#fff}
.type-tabs button>svg{width:14px;height:14px}
.type-tabs span{min-width:18px;min-height:18px;padding:0 5px;border-radius:var(--radius-chip);display:inline-grid;place-items:center;background:var(--blush);color:var(--storefront-primary);font-size:.68rem}
.type-tabs button[aria-selected=true] span{background:rgba(255,255,255,.2);color:#fff}

.highlights{margin:0 0 22px}
.highlights-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px}
.highlights-header h2,.listing-header h2{margin:0;color:var(--storefront-primary);font-family:var(--font);font-size:1.15rem;font-weight:800;letter-spacing:-.02em}
.highlights-next{width:var(--touch);height:var(--touch);border:0;border-radius:50%;background:transparent;color:var(--storefront-primary);display:grid;place-items:center;cursor:pointer}
.highlights-next[hidden]{display:none!important}
.highlights-rail{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.highlights-rail::-webkit-scrollbar{display:none}
.highlight-card{flex:none;width:136px;scroll-snap-align:start;overflow:hidden;border:1px solid color-mix(in srgb,var(--storefront-action) 12%,white);border-radius:var(--radius-item);background:var(--white);box-shadow:var(--shadow-soft)}
.highlight-card .card-hit{display:flex;flex-direction:column;height:100%;text-decoration:none;color:inherit;border:0;background:transparent;padding:0;text-align:left;cursor:pointer}
.highlight-card .item-image{width:100%;aspect-ratio:1;overflow:hidden;background:var(--blush)}
.highlight-card .item-body{padding:8px 10px 10px}
.highlight-card h3{margin:0;color:var(--storefront-primary);font-size:.78rem;font-weight:800;line-height:1.25;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.highlight-card .item-price{margin:4px 0 0;color:var(--warm);font-size:.72rem;font-weight:700}

.listing-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:6px 0 14px}
.listing-header p{display:none}
.sort-field{position:relative;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:flex-end;color:var(--storefront-primary)}
.sort-field>span{display:none}
.sort-field select{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.results-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

.storefront-grid,.cards-compact .storefront-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;align-items:stretch;gap:12px;padding:0 0 108px}
.storefront-card{position:relative;min-width:0;height:100%;overflow:hidden;border:1px solid color-mix(in srgb,var(--storefront-action) 12%,white);border-radius:var(--radius-item);background:var(--white);box-shadow:var(--shadow-soft)}
.storefront-grid[data-kind-filter=products]>.storefront-card[data-kind=services],.storefront-grid[data-kind-filter=services]>.storefront-card[data-kind=products],.storefront-card[hidden],.storefront-card.is-hidden,.highlights-rail[data-kind-filter=products]>.highlight-card[data-kind=services],.highlights-rail[data-kind-filter=services]>.highlight-card[data-kind=products],.highlight-card[hidden],.highlight-card.is-hidden{display:none!important}
.storefront-card .card-hit{display:grid;grid-template-columns:76px minmax(0,1fr);align-items:center;gap:10px;min-height:100%;width:100%;padding:8px;text-decoration:none;color:inherit;border:0;background:transparent;text-align:left;cursor:pointer}
.item-image,.cards-compact .item-image{width:76px;height:76px;overflow:hidden;background:var(--blush);border-radius:12px;flex:none}
.item-image img{width:100%;height:100%;object-fit:cover;display:block}
.item-image.is-failed img{display:none}
.item-placeholder{display:grid;place-items:center;min-height:0;color:var(--storefront-action);background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--storefront-action) 12%,white) 0%,var(--blush) 70%)}
.item-placeholder-mark{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#fff;box-shadow:0 4px 12px rgba(36,24,30,.08);color:var(--storefront-action)}
.item-placeholder-mark svg{width:18px;height:18px}
.item-body,.cards-compact .item-body{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:2px 4px 2px 0;gap:2px}
.item-category{display:none}
.item-body h3{margin:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:var(--storefront-primary);font-family:var(--font);font-size:.9rem;font-weight:800;line-height:1.25}
.item-description{display:none}
.item-description.expanded{display:block;margin:6px 0 0;color:var(--warm);font-size:.8rem}
.item-price{margin:0;color:var(--storefront-primary);font-size:.82rem;font-weight:800}
.consultation{font-size:.78rem;font-weight:700;color:var(--warm)}
.item-footer,.storefront-card .item-meta{display:none}
.item-meta{margin:0;color:var(--warm);font-size:.68rem;font-weight:600}
.item-meta-bit{display:inline-flex;align-items:center;gap:3px}
.item-meta-bit svg{width:11px;height:11px}
.card-action{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;color:transparent;font-size:0;overflow:hidden;cursor:pointer}
.card-action svg{display:none}

.no-results,.catalog-empty{text-align:center;padding:48px 16px;color:var(--warm)}
.no-results h3,.catalog-empty h2{color:var(--storefront-primary);font-family:var(--font)}
.catalog-empty>span svg{width:36px;height:36px}

.floating-contact{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,calc(env(safe-area-inset-bottom) + 12px));z-index:30;box-sizing:border-box;width:auto;height:auto;min-width:48px;min-height:48px;padding:10px 14px 10px 12px;border:3px solid #fff;border-radius:var(--radius-chip);display:inline-flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;overflow:visible;text-decoration:none;text-align:left;background:var(--storefront-action);color:#fff;box-shadow:0 8px 18px rgba(36,24,30,.16);font-size:.92rem;font-weight:800;line-height:1.2;letter-spacing:0;transition:opacity .15s ease,transform .15s ease}
body.js-ready:not(.is-scrolled) .floating-contact{opacity:0;pointer-events:none;transform:translateY(8px)}
.floating-contact svg{width:18px;height:18px;aspect-ratio:1;flex:0 0 auto}
.floating-contact .floating-label{display:block;max-width:18ch;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.92rem;line-height:1.2}
.floating-contact.obscured{opacity:0;pointer-events:none;transform:translateY(8px)}

dialog{width:min(520px,calc(100% - 28px));max-height:calc(100dvh - 28px);overflow:auto;border:0;border-radius:16px;padding:0;background:#fff;color:var(--ink);box-shadow:0 24px 60px rgba(36,24,30,.22)}
#item-details-photo{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:var(--blush)}
#item-details-photo[hidden],#item-details-price[hidden],#item-details-meta[hidden]{display:none}
#item-details-copy{margin:0;color:var(--warm);font-size:.92rem;line-height:1.5;white-space:pre-wrap}
#item-details-meta{margin:0;color:var(--warm);font-size:.78rem}
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
  :root{--cover-height:200px;--page-gutter:18px}
  .storefront-shell{width:calc(100% - 36px)}
  .store-card{width:calc(100% - 36px)}
}
@media(min-width:480px){
  :root{--cover-height:210px}
  .hero-classic .hero-cover-wrap,.hero-editorial .hero-cover-wrap{height:210px}
  .identity-mark{width:76px;height:76px}
  .highlight-card{width:148px}
}
@media(min-width:768px){
  :root{--cover-height:240px;--page-gutter:24px;--compact-header:60px}
  body{background:#f3eee9}
  .storefront-canvas{min-height:100dvh;box-shadow:0 0 0 1px rgba(74,35,50,.06)}
  .hero-classic .hero-cover-wrap,.hero-editorial .hero-cover-wrap{height:240px}
  .hero-compact .hero-cover-wrap{height:200px}
  .store-card{width:min(640px,calc(100% - 48px));padding:0 28px 24px}
  .store-card h1{font-size:2rem}
  .store-meta{flex-direction:row;gap:8px 12px}
  .introduction{font-size:1rem;max-width:42ch}
  .storefront-shell{width:min(860px,calc(100% - 48px));padding-top:18px}
  .quick-info{margin-top:16px}
  .search-field{min-height:52px}
  .storefront-grid,.cards-compact .storefront-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
  .storefront-card .card-hit{grid-template-columns:92px minmax(0,1fr);gap:12px}
  .item-image,.cards-compact .item-image{width:92px;height:92px}
  .item-body h3{font-size:1rem}
  .highlight-card{width:168px}
  .floating-contact{min-height:52px;padding:12px 18px 12px 16px}
}
@media(min-width:1040px){
  .storefront-shell{width:min(980px,calc(100% - 64px))}
  .storefront-grid,.cards-compact .storefront-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media(max-width:389px){
  :root{--cover-height:180px;--page-gutter:12px}
  .hero-compact .hero-cover-wrap{height:168px}
  .storefront-shell{width:calc(100% - 24px)}
  .store-card{width:calc(100% - 24px);padding:0 14px 14px}
  .store-card h1{font-size:1.28rem}
  .introduction{font-size:.84rem}
  .highlight-card{width:124px}
  .form-row{grid-template-columns:1fr}
}
@media(max-width:329px){
  .storefront-grid,.cards-compact .storefront-grid{grid-template-columns:1fr}
  .storefront-card .card-hit{grid-template-columns:72px minmax(0,1fr)}
}
@media(max-width:767px){
  .hero-small-alternative{display:none}
}
@media(prefers-reduced-motion:reduce){
  *,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}
  .compact-header,.floating-contact{transition:none!important}
}
@media(forced-colors:active){.primary-action,.card-hit,.category-scroll button,.type-tabs button{border:1px solid ButtonText}}
`;
}
