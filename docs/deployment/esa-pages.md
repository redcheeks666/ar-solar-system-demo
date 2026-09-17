# ESA Pages deployment

The public temporary experience is hosted at `https://demo.blushling.com` with Alibaba Cloud ESA Functions & Pages.

## Current configuration

- ESA site: `blushling.com`
- Access mode: CNAME
- Service region: Global (excluding the Chinese mainland)
- Pages project: `ar-solar-system-demo`
- Production branch: `codex/esa-pages-dist`
- Static asset directory: `dist`
- Build command in ESA: `echo static-artifact-ready`
- SPA fallback: enabled through `notFoundStrategy: singlePageApplication`
- Custom domain: `demo.blushling.com`
- DNS: CNAME `demo` to `demo.blushling.com.a1.initkk.com`
- HTTPS: free ESA-managed certificate; HTTP redirects to HTTPS
- Traffic protection: stop the ESA site when monthly site traffic exceeds 45 GB (90% of the 50 GB nominal basic-plan quota)

The site uses the free Functions & Pages mode. No paid order, nameserver migration, backend, authentication, database, or analytics service is part of this deployment.

## Deployment artifact

The ESA project consumes a static artifact branch instead of rebuilding the application in ESA. The branch contains only:

- the verified local `dist/` output;
- `esa.jsonc`, pointing Pages at `./dist` with SPA fallback;
- a short deployment README.

The application source branch and the local working tree are not switched or rewritten by this publishing path.

## Updating the public site

1. From the application source checkout, run:

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

2. Replace the contents of the orphan deployment worktree with the newly verified `dist/` directory while retaining `esa.jsonc`.
3. Commit and push the artifact to `codex/esa-pages-dist`.
4. In ESA Pages, confirm the production deployment succeeds and reaches 100% publication.
5. Verify `/`, `/debug`, the MediaPipe model/WASM files, and at least one audio asset over HTTPS.

Do not commit ESA access tokens, GitHub credentials, ownership TXT values, or certificate-validation TXT values. Those records belong only in the cloud consoles and DNS provider.

## Rollback and retirement

- Roll back by selecting a previously successful production version in ESA Pages.
- To retire only the temporary experience, remove the `demo` CNAME after unbinding the Pages custom domain. Do not change the domain's nameservers or unrelated DNS records.
- The traffic hard cap intentionally favors cost safety over availability: exceeding 45 GB in a calendar month stops the ESA site until it is re-enabled or the next safe operating decision is made.
