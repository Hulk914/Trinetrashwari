"use strict";

/* All music destinations live here. Keep the supplied URLs intact, including
   their query parameters. Add a new object and a local icon to add a service. */
const MUSIC_PLATFORMS = Object.freeze([
  {
    id: "spotify",
    name: "Spotify",
    icon: "assets/icons/spotify.svg",
    action: "Listen now",
    url: "https://open.spotify.com/album/5cbsY7rgRlxSGR2H37nDtb?si=YsgXbgDCQOWTPPRCgk6CtA&utm_source=copy-link"
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "assets/icons/youtube.svg",
    action: "Watch the music video",
    url: "https://youtu.be/L5fivEQxBL4?si=XWLZzccpu0Qn4izW"
  },
  {
    id: "youtubemusic",
    name: "YouTube Music",
    icon: "assets/icons/youtubemusic.svg",
    action: "Listen now",
    url: "https://music.youtube.com/watch?v=L5fivEQxBL4&si=KdR09eJH3BARC0G0&drli=1"
  },
  {
    id: "applemusic",
    name: "Apple Music",
    icon: "assets/icons/applemusic.svg",
    action: "Listen now",
    url: "https://music.apple.com/in/album/trinetrashwari-single/6826457405"
  },
  {
    id: "amazonmusic",
    name: "Amazon Music",
    icon: "assets/icons/amazonmusic.svg",
    action: "Listen now",
    url: "https://music.amazon.in/albums/B0HP3M34LZ?do=play&trackAsin=B0HP3JGLGV&ts=1792829870&ref=dm_sh_pxql7o7OZu6CRZOmTfdSn5Uwz&referrer=dm_sh_whatsapp"
  },
  {
    id: "jiosaavn",
    name: "JioSaavn",
    // Official, unmodified primary logo. Icon-only use requires written approval.
    icon: "assets/icons/jiosaavn.png",
    action: "Listen now",
    url: "https://www.jiosaavn.com/song/trinetrashwari/XT4JWjtTAQE"
  }
]);

const SITE_CONFIG = Object.freeze({
  // Optional: set your absolute public URL, including a repository path if used.
  // An empty value automatically shares the current public HTTPS page.
  publicUrl: "",
  // Official band details: leave empty until confirmed. Empty links stay hidden.
  instagram: "",
  youtubeChannel: "",
  contactEmail: ""
});

const VIDEO_ID = "L5fivEQxBL4";
const youtubePlatform = MUSIC_PLATFORMS.find(platform => platform.id === "youtube");
const arrowMarkup = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';

function renderPlatforms() {
  const fragment = document.createDocumentFragment();
  MUSIC_PLATFORMS.forEach(platform => {
    const link = document.createElement("a");
    link.className = `platform-card platform-card--${platform.id}`;
    link.href = platform.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${platform.action} on ${platform.name} (opens in a new tab)`);

    const icon = document.createElement("img");
    icon.className = "platform-icon";
    icon.src = platform.icon;
    icon.alt = ""; // The card's accessible label already names the service.
    icon.width = platform.id === "jiosaavn" ? 106 : 28;
    icon.height = 28;
    icon.decoding = "async";

    const copy = document.createElement("span");
    copy.className = "platform-copy";
    const name = document.createElement("span");
    name.className = "platform-name";
    name.textContent = platform.name;
    const action = document.createElement("span");
    action.className = "platform-action";
    action.textContent = platform.action;
    copy.append(name, action);
    link.append(icon, copy);
    link.insertAdjacentHTML("beforeend", arrowMarkup);
    fragment.append(link);
  });
  document.getElementById("platform-links").replaceChildren(fragment);
  document.getElementById("watch-youtube").href = youtubePlatform.url;
}

/* <picture> falls back for unsupported formats, but not failed WebP requests.
   Retry the original JPEG if a selected WebP cannot load. Direct-file previews
   use JPEG immediately; HTTP(S) deployments retain responsive WebP delivery. */
function initializeImageFallbacks() {
  document.querySelectorAll("img[data-fallback]").forEach(image => {
    const useOriginal = () => {
      if (image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = "true";
      image.closest("picture")?.querySelectorAll("source").forEach(source => source.remove());
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      image.src = image.dataset.fallback;
    };
    image.addEventListener("error", useOriginal, { once: true });
    if (window.location.protocol === "file:" || (image.complete && !image.naturalWidth)) {
      useOriginal();
    }
  });
}

function initializeVideoNavigation() {
  const shortcut = document.querySelector('.header-listen[href="#video-player"]');
  shortcut.addEventListener("click", event => {
    event.preventDefault();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("video-player").scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "center"
    });
  });
}

/* No YouTube connection is made until a visitor requests the player.
   Deliberately omit autoplay: loading the iframe never starts playback.
   file:// and editor WebViews cannot supply an HTTP Referer, which causes
   YouTube Error 153. Those previews use the exact official YouTube link. */
function initializeVideo() {
  const trigger = document.getElementById("load-video");
  if (!["http:", "https:"].includes(window.location.protocol)) {
    const directLink = document.createElement("a");
    directLink.className = trigger.className;
    directLink.id = trigger.id;
    directLink.href = youtubePlatform.url;
    directLink.target = "_blank";
    directLink.rel = "noopener noreferrer";
    directLink.setAttribute("aria-label", "Watch Trinetrashwari on YouTube (opens in a new tab)");
    directLink.append(...trigger.childNodes);
    directLink.querySelector(".video-hint").firstChild.textContent = "WATCH ON YOUTUBE ";
    trigger.replaceWith(directLink);
    return;
  }
  trigger.addEventListener("click", () => {
    const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`);
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("playsinline", "1");
    embedUrl.searchParams.set("origin", window.location.origin);
    const iframe = document.createElement("iframe");
    iframe.src = embedUrl.href;
    iframe.title = "Trinetrashwari — Traffic Jam | Official Music Video";
    iframe.allow = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.tabIndex = 0;
    document.getElementById("video-player").replaceChildren(iframe);
    iframe.focus({ preventScroll: true });
  }, { once: true });
}

/* Only public HTTPS URLs can become a share destination. Besides localhost,
   reject LAN addresses, preview names, and the documented example placeholder. */
function publicUrlOrNull(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!host.includes(".") || host === "localhost" || host.endsWith(".localhost")) return null;
    if (/\.(local|internal|test|invalid|example|lan)$/.test(host) || host.endsWith(".home.arpa")) return null;
    if (host.includes(":")) return null; // Never expose a local IPv6 address.
    if (/^(0|10|127)\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function getShareDestination() {
  const configured = publicUrlOrNull(SITE_CONFIG.publicUrl);
  if (configured) return { url: configured.href, isVideo: false };
  const current = publicUrlOrNull(window.location.href);
  if (current) {
    current.hash = "";
    current.search = ""; // Do not pass on visitor tracking or private query data.
    return { url: current.href, isVideo: false };
  }
  // Safe local/file/LAN preview fallback: an exact, supplied official destination.
  return { url: youtubePlatform.url, isVideo: true };
}

async function copyLink(url) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Some social in-app browsers deny clipboard access; try a local fallback.
    }
  }
  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = url;
  field.readOnly = true;
  field.style.cssText = "position:fixed;top:0;left:-9999px;font-size:16px;";
  document.body.append(field);
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, url.length);
  let copied = false;
  try { copied = document.execCommand("copy"); } catch { /* Offer manual copying. */ }
  field.remove();
  previousFocus?.focus({ preventScroll: true });
  return copied;
}

function initializeShare() {
  const button = document.getElementById("share-button");
  const status = document.getElementById("share-status");
  const manual = document.getElementById("manual-copy");
  const field = document.getElementById("share-url");
  button.addEventListener("click", async () => {
    const destination = getShareDestination();
    const payload = { title: "Trinetrashwari — Traffic Jam", text: "An Ode to Shiva & Shakti. Feel the energy. Share the music.", url: destination.url };
    button.disabled = true;
    status.textContent = "";
    manual.hidden = true;
    try {
      if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(payload))) {
        try {
          await navigator.share(payload);
          status.textContent = "Thanks for sharing the music.";
          return;
        } catch (error) {
          if (error.name === "AbortError") return; // Dismissing is intentional.
        }
      }
      if (await copyLink(destination.url)) {
        status.textContent = destination.isVideo ? "Official video link copied. Pass the energy on." : "Link copied. Pass the energy on.";
      } else {
        field.value = destination.url;
        manual.hidden = false;
        status.textContent = "Copy the link below to share the music.";
        field.focus({ preventScroll: true });
        field.select();
      }
    } finally {
      button.disabled = false;
    }
  });
  document.getElementById("select-share-url").addEventListener("click", () => {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, field.value.length);
  });
}

function renderBandLinks() {
  const container = document.getElementById("band-links");
  const socialLinks = [
    { label: "Instagram", value: SITE_CONFIG.instagram, hosts: ["instagram.com", "www.instagram.com"] },
    { label: "YouTube", value: SITE_CONFIG.youtubeChannel, hosts: ["youtube.com", "www.youtube.com"] }
  ];
  socialLinks.forEach(({ label, value, hosts }) => {
    const url = publicUrlOrNull(value);
    if (!url || !hosts.includes(url.hostname) || url.pathname === "/") return;
    const link = document.createElement("a");
    link.href = url.href;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Traffic Jam on ${label} (opens in a new tab)`);
    container.append(link);
  });
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SITE_CONFIG.contactEmail) && !SITE_CONFIG.contactEmail.endsWith(".example")) {
    const link = document.createElement("a");
    link.href = `mailto:${SITE_CONFIG.contactEmail}`;
    link.textContent = "Contact";
    container.append(link);
  }
  container.hidden = container.childElementCount === 0;
}

initializeImageFallbacks();
renderPlatforms();
initializeVideoNavigation();
initializeVideo();
initializeShare();
renderBandLinks();
