# Flame Strike candidates

Open `http://127.0.0.1:5202/viewer.html` while the local server is running. Start it from the project root:

```sh
node art/generated/ash-warden-flame-strike-vfx-v1/serve.mjs
```

Read `REPORT.md` before selection. The raw RD GIFs retain a residual ground patch; only the separately labeled prepared previews fade completely. No runtime integration has been performed.

Reproduce extraction and review artifacts with installed dependencies:

```sh
node art/generated/ash-warden-flame-strike-vfx-v1/decode.mjs
node art/generated/ash-warden-flame-strike-vfx-v1/build-review.mjs
node art/generated/ash-warden-flame-strike-vfx-v1/verify.mjs
```

`prepare.mjs` authored the ignition reference PNGs and captured the protection baseline. Keep that baseline intact. The complete generation requests and actual MCP responses are archived in each variant folder; do not automatically restart a paid job. `download.mjs a b c` downloads the existing saved task results without generating again; if signed URLs expire, retrieve the same task IDs through MCP first. No new dependencies are needed.

`validation.json`, `viewer-validation.json`, `project-checks.json` and `expenses.json` contain the measured results. `metadata.json` uses zero-based frame indices; report phase numbers are one-based. Preview GIFs contain no infinite-loop extension. The viewer has an explicit optional repeat mode for comparison.
