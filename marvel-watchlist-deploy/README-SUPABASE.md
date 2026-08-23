# Supabase setup

## 1. Create a project
Create a project at Supabase, then open **SQL Editor** and run the complete contents of `supabase/schema.sql`.

## 2. Get the public credentials
In **Project Settings → API**, copy:
- Project URL
- Publishable/anon key

## 3. Add them to the frontend
Open `vercel-frontend/js/app.js` and replace:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

The anon/publishable key is safe to expose in a frontend; never put a Supabase service-role key in this file.

## 4. Deploy
Deploy the Java API to Render as before, then set its URL in `API_URL` in the same file. Deploy `vercel-frontend` to Vercel.

## How persistence works
Each browser gets a random UUID stored in localStorage. Supabase stores watched/scheduled state under that UUID, so progress survives refreshes and backend restarts. Clearing browser storage creates a new empty watchlist. If you later want cross-device accounts, the next step is Supabase Auth.
