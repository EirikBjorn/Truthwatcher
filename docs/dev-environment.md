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
- `profiles`
- `currently_reading_items`
- `activity_events`
- `reading_checklist_items`

Dev uses:

- `dev_writing_progress`
- `dev_push_subscriptions`
- `dev_project_subscriptions`
- `dev_profiles`
- `dev_currently_reading_items`
- `dev_activity_events`
- `dev_reading_checklist_items`

Run [schema.sql](/Users/ebjorneseth/Documents/eirik/Truthwatcher/supabase/schema.sql) in Supabase SQL Editor to create both the production and `dev_` table sets in the shared database.

When you run the app locally on `localhost`, the client uses the `dev_` tables by default. Hosted production still uses the unprefixed tables, and the hosted `/dev/` build still uses `dev_` via deploy-time env vars.

## Branch flow

- Push to `dev`: updates `https://truthwatcher.app/dev/`
- Push to `main`: updates `https://truthwatcher.app/`
- Production scraping runs only on the workflow schedule, or by manual workflow dispatch
- Production activity notifications run every 5 minutes in GitHub Actions
- Dev scraping runs only by manual workflow dispatch
- Dev activity notifications run only by manual workflow dispatch
- Either push also republishes the full site so `/` and `/dev/` stay in sync

## GitHub Pages setup

Keep using this repository's GitHub Pages site with the existing custom domain `truthwatcher.app`.

The workflow assumes:

1. GitHub Pages is enabled for this repository
2. The site is deployed via GitHub Actions
3. The custom domain remains `truthwatcher.app`

No extra DNS record is needed for `/dev`, because it is a path on the same site, not a subdomain.
