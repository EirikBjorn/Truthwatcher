# Dev environment

This repo deploys one GitHub Pages site:

- Production at `https://truthwatcher.app/`
- Dev at `https://truthwatcher.app/dev/`

The deploy workflow rebuilds both branches on every `main` or `dev` push, then publishes one combined Pages artifact.

## Database split

Production uses:

- `writing_progress`
- `push_subscriptions`
- `project_subscriptions`

Dev uses:

- `dev_writing_progress`
- `dev_push_subscriptions`
- `dev_project_subscriptions`

Run [dev-schema.sql](/Users/ebjorneseth/Documents/eirik/Truthwatcher/supabase/dev-schema.sql) in Supabase SQL Editor before using `/dev`.

## Branch flow

- Push to `dev`: updates `https://truthwatcher.app/dev/`
- Push to `main`: updates `https://truthwatcher.app/`
- Production scraping runs only on the workflow schedule, or by manual workflow dispatch
- Dev scraping runs only by manual workflow dispatch
- Either push also republishes the full site so `/` and `/dev/` stay in sync

## GitHub Pages setup

Keep using this repository's GitHub Pages site with the existing custom domain `truthwatcher.app`.

The workflow assumes:

1. GitHub Pages is enabled for this repository
2. The site is deployed via GitHub Actions
3. The custom domain remains `truthwatcher.app`

No extra DNS record is needed for `/dev`, because it is a path on the same site, not a subdomain.
