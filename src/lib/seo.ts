export function setSEO(opts: { title: string; description?: string; canonical?: string }) {
  document.title = opts.title;
  if (opts.description) {
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", opts.description);
  }
  if (opts.canonical) {
    let l = document.querySelector('link[rel="canonical"]');
    if (!l) {
      l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      document.head.appendChild(l);
    }
    l.setAttribute("href", opts.canonical);
  }
}
