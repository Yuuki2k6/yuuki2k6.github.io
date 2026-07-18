# Nguyen Duy — Portfolio (static clone)

A dependency-free static clone of [nguyenduy.framer.website](https://nguyenduy.framer.website/) —
a Video Editor & VFX Artist portfolio — rebuilt as plain HTML/CSS/JS, ready for GitHub Pages.

## Pages

| Path | Page |
| --- | --- |
| `/` | Home (hero, short-form marquee, long-form cards, skills, behind the canvas, contact) |
| `/works/` | All works |
| `/works/finflow/` | Music Video case study |
| `/works/launchpad/` | LaunchPad case study |
| `/works/healthsync/` | HealthSync case study |
| `/works/talentbridge/` | TalentBridge case study |
| `/works/marketmingle/` | MarketMingle case study |

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this folder to it:

   ```sh
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```

2. In the repository: **Settings → Pages → Build and deployment**, set
   **Source** to *Deploy from a branch*, pick branch **main** and folder **/ (root)**, save.

3. The site appears at `https://<you>.github.io/<repo>/` after a minute.

All asset and page URLs are relative, so the site works from a project subpath
(`/repo-name/`) as well as from a user/organization root domain. `.nojekyll` is included
so GitHub Pages serves files as-is.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Notes

- No build step, no frameworks. One stylesheet (`assets/css/style.css`), one small script
  (`assets/js/main.js`) for entrance/scroll-reveal animations (respects
  `prefers-reduced-motion`; everything is visible without JavaScript).
- Fonts: DM Sans + Libre Baskerville via Google Fonts.
- Images and video loops are served locally from `assets/`.
