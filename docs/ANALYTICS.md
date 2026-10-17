# Analytics: PostHog and Convex

Use PostHog for website traffic and interface activity: page views, sessions, and button clicks. These events describe what a browser attempted; a click or form submission is not proof that Chauffeur accepted or completed the action.

Use Convex as the source of truth for product usage. Guest discovery is stored in `guestSearches`, not `conversations` or `messages`. Signed-in chat is stored in `conversations` and `messages`. Guest search text and results are cleared after 24 hours, while the small record remains so the one-search guest limit cannot be reset by refreshing.

The web app also sends server-confirmed PostHog events after a successful Convex request: `guest_search_accepted`, `guest_search_ready` (or `guest_search_clarifying` / `guest_search_failed`), and `conversation_message_accepted`. These are the events to compare with Convex rows, rather than `button_clicked` or `form_submitted`. Browser analytics can still be blocked, so Convex remains authoritative when counts differ.

For a business-usage snapshot from the production database, run:

```sh
npm run usage:prod
```

It reports the last 7 and 30 days without printing message text or customer details. It reads up to the 10,000 most recently created records per table. For infrastructure activity such as backend function calls, database reads/writes and storage, open the production deployment's **Usage** view in the Convex dashboard. Convex does not count passive website visits; use PostHog for those.
