# Embedding CBS-Afstemning on copenhagenbikeshow.dk

CBS-Afstemning is a separate Next.js application hosted on Vercel
(replace `<deployment-url>` below with the real `.vercel.app` URL, or a
dedicated subdomain, once deployed), not part of the WordPress site's
codebase. It's embedded into WordPress/Bricks via `<iframe>`, with a small
script that lets the iframe resize itself to fit its content instead of
showing a fixed-height scrollbar.

Nothing needs to be installed, hosted, or maintained on the WordPress side
beyond the iframe + script below. Vote counts update live as people vote —
no rebuild or redeploy needed on either side.

- URL: `https://<deployment-url>/widget`

## 1. Add the iframe

In Bricks, add a **Code** element wherever the voting widget should appear
and paste (adjust the `src` to the real deployment URL):

```html
<iframe
  id="cbs-widget-afstemning"
  src="https://<deployment-url>/widget"
  style="width:100%; border:0; display:block;"
  scrolling="no"
  title="Afstemning fra Copenhagen Bike Show"
></iframe>
```

Give each iframe on the page a distinct `id` if more than one CBS widget is
embedded on the same page.

## 2. Add the auto-resize script

The widget posts its content height to the parent page on load and
whenever it changes (e.g. after voting, when the results view appears).
Without this script the iframe falls back to whatever height the browser
gives an iframe by default, which will cut content off.

```html
<script>
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "cbs-widget-height") return;
    document.querySelectorAll("iframe[src*='<deployment-url>']").forEach(function (iframe) {
      if (iframe.contentWindow === event.source) {
        iframe.style.height = event.data.height + "px";
      }
    });
  });
</script>
```

Add this **once per page** that embeds the widget — either in the same
Code element as the iframe, or (if the widget appears on multiple pages)
once site-wide via Bricks' custom code / footer scripts, or a code
snippets plugin. Adding it more than once is harmless, just redundant.

If Bricks' Code element strips `<script>` tags on save, use Bricks'
dedicated header/footer custom-code setting, or a plugin like WPCode,
instead of the inline Code element.

## Notes

- No CSS is required on the WordPress side — the widget is a fully
  self-contained page with its own styling.
- The widget is responsive (mobile, tablet, desktop).
- One vote per browser, enforced by a cookie set on the widget's own
  domain — this works inside the iframe as long as the visitor's browser
  allows third-party cookies for embedded content (standard for same-site
  iframes; some strict privacy browser settings may block it).
