# TRINETRASHWARI · TRAFFIC JAM

A static release page for **Trinetrashwari**, the 2026 original single by Traffic Jam, Bengaluru. Built with HTML, CSS, and vanilla JavaScript. There are no packages to install, build commands, frameworks, or backend services.

## Run locally

1. Open this folder in VS Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Use the local address shown by the extension, usually `http://127.0.0.1:5500`.

You can also open `index.html` directly. A local server is recommended for browser security features and accurate testing. On mobile, open the server's LAN address while connected to the same Wi-Fi; the share button will still avoid sharing that private address.

## Files

```text
index.html                         Page, song copy, credits, SEO, structured data
style.css                          Colors, self-hosted fonts, responsive styles
script.js                          Platform data, video, sharing, optional band links
assets/
  trinetrashwari-cover.jpg          Original supplied JPEG, unchanged
  trinetrashwari-cover.webp         Full-size WebP delivery copy
  trinetrashwari-cover-1200.webp    Responsive delivery copy, complete composition
  trinetrashwari-cover-640.webp     Responsive delivery copy, complete composition
  trinetrashwari-video.webp         Official video thumbnail, stored locally
  fonts/                           Cinzel and Manrope WOFF2 files and licenses
  icons/                           Local brand logos, favicon, source information
README.md
```

## Edit the six platform URLs

Open `script.js` and find the clearly labeled **`MUSIC_PLATFORMS`** array at the top. Change an object's `url` to update that card. All six supplied URLs, including query parameters, are preserved as provided. YouTube's watch button and local-preview share fallback also use the YouTube entry in this array.

The two YouTube links in `index.html` are fallbacks for visitors with JavaScript disabled. If the official video changes, update those links, `VIDEO_ID` in `script.js`, the thumbnail, and the video metadata in `index.html` too.

## Edit song credits

Find `The People Behind the Music` in `index.html`. Each contribution has a commented, semantic credit group. Edit the names directly in the definition list, lists, and paragraphs. Also update composer/lyricist names in the JSON-LD block near the top of the file when relevant.

## Add another streaming service

1. Save an approved logo in `assets/icons/`. Prefer SVG and preserve the brand's proportions and permitted colors.
2. Add an object to `MUSIC_PLATFORMS`, following this format:

   ```js
   {
     id: "unique-service-id",
     name: "Service name",
     icon: "assets/icons/approved-service-logo.svg",
     action: "Listen now",
     url: "YOUR_CONFIRMED_HTTPS_RELEASE_URL"
   }
   ```

3. Save and refresh. JavaScript creates the card, accessible label, new-tab behavior, and external-link indicator automatically. The grid accommodates additional entries.
4. Document the logo's source in `assets/icons/SOURCES.md`.

The sample value above is documentation only; never publish a card until its destination is confirmed.

## Publish to GitHub Pages

1. Create a GitHub repository and upload **the contents of this folder**, keeping `index.html` at the repository root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your branch (usually `main`) and the **`/ (root)`** folder. Save.
5. Wait for GitHub's deployment to complete, then use the URL shown in Pages settings.
6. Update the public metadata below and push the changes. Keep GitHub's **Enforce HTTPS** enabled where available.

Relative asset paths support repository sites such as `https://ACCOUNT.github.io/REPOSITORY/` as well as a custom domain. There is no build step. For **Netlify**, drag the folder into the manual deploy area, or connect the repository with an empty build command and `.` as the publish directory.

## Set the public canonical and social image URLs

**Do this before sharing the deployed site publicly.** Search `index.html` for `https://YOUR-DOMAIN.example/` and replace every occurrence with the real absolute HTTPS site URL. Include the repository subpath and trailing slash if GitHub Pages uses one.

Update all of these:

- `<link rel="canonical">` and `og:url`.
- `og:image` and `twitter:image`: absolute public URLs ending in `assets/trinetrashwari-cover.jpg`.
- JSON-LD `url` and `image`.

For example, if the public site is `https://ACCOUNT.github.io/REPOSITORY/`, its image URL is `https://ACCOUNT.github.io/REPOSITORY/assets/trinetrashwari-cover.jpg`. Placeholder domains exist only in metadata and are never displayed as links. The original 2000 × 2000 JPEG is retained for crawler compatibility.

Social previews require a publicly accessible site and image. GitHub Pages and Netlify provide HTTPS; private previews cannot be fetched by social crawlers. Preview caches may take time to refresh after changes.

## Share button

- On a public HTTPS deployment, the button shares the current page URL, excluding query strings and fragments.
- Optionally set `SITE_CONFIG.publicUrl` in `script.js` to an absolute public HTTPS URL, including a repository subpath. This takes precedence over the current page address.
- Supported devices use the native share sheet. A cancelled share simply closes the sheet.
- Other browsers copy the link. If clipboard permissions are denied, the page offers a selectable link for manual copying.
- Localhost, file previews, LAN addresses, and example domains **never become share destinations**. During local previews, sharing uses the exact official YouTube destination supplied for this release.

The page does not display deployment instructions or developer messages to visitors.

## Add official band links

In `SITE_CONFIG`, fill in `instagram`, `youtubeChannel`, and/or `contactEmail` only with confirmed official band details. Empty values are intentional placeholders in the code. They produce no visible footer links. Social entries require valid HTTPS Instagram or YouTube profile/channel URLs.

## Artwork, logos, and fonts

- The original supplied artwork is copied byte-for-byte. The WebP files preserve its complete square composition, colors, and existing text; responsive variants reduce transfer size. The artwork receives no text overlay, cropping, filters, or animation.
- Five platform SVGs come from [Simple Icons v13.21.0](https://github.com/simple-icons/simple-icons/tree/13.21.0). Their original paths are retained and brand colors are applied. Source links and the bundled license are in `assets/icons/`.
- JioSaavn uses its **unmodified complete white primary logo** from the [official logo kit](https://www.jiosaavn.com/corporate/_assets/JioSaavn-Logo-Kit.zip). Its [brand guide](https://corporate.saavn.com/brand) requires approval for icon-only use, so the complete logo is used here.
- All platform marks belong to their respective owners and identify release destinations; they do not imply sponsorship.
- Cinzel and Manrope are locally hosted with their SIL Open Font License notices in `assets/fonts/`. No Google Fonts request is made by visitors' browsers.
- The official YouTube thumbnail is stored locally. The privacy-enhanced YouTube iframe is created only after a visitor requests it; no iframe, tracking connection, audio, or video playback runs on initial load. Autoplay is never enabled. After loading, use the YouTube player's play control.

## Accessibility and performance

Semantic landmarks and headings, a keyboard skip link, visible focus outlines, accessible card/button names, live share feedback, 44px minimum touch targets, and reduced-motion support are included. Below-the-fold video artwork is lazy-loaded; images reserve their space; responsive cover images and local fonts minimize requests. Background effects are static CSS gradients with no animation loop.

## Validation

The finished page was checked in headless desktop Chrome at viewport widths **320, 375, 390, 430, 768, 1024, 1280, and 1440px**. Checks covered horizontal overflow, loaded logos/fonts, touch targets, exact platform destinations, safe new-tab attributes, reduced motion, hidden unconfigured footer links, valid JSON-LD, and JavaScript runtime errors.

Native sharing and clipboard success/denial/cancellation paths were checked with browser API stubs; actual OS share sheets should also be checked on your target phone after deployment. The official YouTube embed returned HTTP 200 and loaded on demand without autoplay. Playback and streaming availability can vary by account, region, and platform restrictions; the supplied destinations are used exactly and have not been replaced with alternatives.

Before launch, set the public metadata URLs, check the live page on an actual phone, open each streaming service, and confirm that the share sheet and social preview use the final domain.
