# PurposeJoy Listen — Admin Guide for Mike

Welcome! This is everything you need to upload and manage songs on the PurposeJoy music player.  
You don't need to know anything about code or servers. Just follow the steps below.

---

## What Is This?

PurposeJoy Listen is a music player website at **listen.purposejoy.org/listen** where people can stream PurposeJoy songs. You have admin access to upload new songs, write descriptions, and control what's published.

---

## How to Log In

1. Open your browser and go to: **https://listen.purposejoy.org/admin/music**
2. You'll see a Cloudflare login screen asking for your email address
3. Enter the email address that was added to the allowlist
4. Check your inbox — you'll receive an email with a **6-digit code** (arrives within 30 seconds)
5. Type the code into the box on screen → click **Sign in**
6. You're in! You'll see the song management dashboard.

**Session stays active for 24 hours.** After that, you'll need to log in again with a new code.

**Trouble logging in?**
- Make sure you're using the same email that was added to the allowlist
- Check your spam folder if the code doesn't arrive
- Request a new code if it expires (codes are single-use)
- Contact Brandon if your email isn't on the allowlist yet

---

## How to Upload a Song

1. From the admin dashboard, click **+ Upload song** (top right)
2. Fill in the form:

   **Audio file (MP3)** ← Required  
   Click the music note area to choose your MP3 file.  
   - File type: MP3 only  
   - Recommended max size: 50MB  
   - Larger files will take longer to upload but will work fine

   **Cover image** ← Optional but recommended  
   Click to choose a square image (JPG or PNG).  
   - Ideal size: 1024×1024 pixels or larger  
   - Square crops look best — if your image isn't square, crop it first  

   **Title** ← Required  
   The song name as it will appear to listeners.

   **Slug** ← Auto-generated from title  
   This is the URL for the song page (e.g. `amazing-grace` → `listen.purposejoy.org/listen/amazing-grace`). You can edit it but lowercase-with-dashes only.

   **Artist**  
   Default is "PurposeJoy". Change if needed.

   **Album**  
   Optional. Leave blank if the song isn't part of a specific album.

   **Description**  
   A short paragraph about the song — what inspired it, what it means. Shown on the song detail page. Listeners appreciate this.

   **Lyrics**  
   Paste the full lyrics here. They'll be displayed on the song page for listeners to follow along.

   **Release date**  
   Optional. When the song was originally released.

   **Download enabled**  
   Toggle this ON if you want listeners to be able to download this song as an MP3.  
   Default is OFF. You can change this any time.

3. Click **Upload song**
4. Watch the progress bar — it fills as your file uploads to the server
5. When complete, you'll be taken back to the song list

**The song is saved as a Draft. It is NOT public yet.**

---

## Draft vs. Published

Every uploaded song starts as a **Draft**. This means:
- ✅ It exists in the system and you can edit it
- ❌ Listeners cannot see or hear it on the website

You control exactly when a song goes live. This lets you upload in advance, review everything, then publish when ready.

---

## How to Publish a Song (Make It Live)

1. On the song list, find your song — it shows **○ Draft** in the Published column
2. Click **○ Draft**
3. A confirmation box appears: *"[Song title] will go live on /listen for all visitors."*
4. Click **Yes, publish**
5. The button changes to **✓ Live** — your song is now public at `listen.purposejoy.org/listen`

**To unpublish:** Click **✓ Live** → the song goes back to Draft. Listeners can no longer see it, but it's still in your admin panel and nothing is deleted.

---

## How to Edit a Song

1. On the song list, click **Edit** next to any song
2. Update any text fields: title, description, lyrics, etc.
3. Click **Save changes**

Note: You cannot replace the audio file or cover image through the edit form — only text fields. To replace the audio, archive the song and re-upload.

---

## How to Share a Song

Once a song is published, you can share it:

1. On the listener-facing site, navigate to the song (click the song title on `/listen`)
2. Click the **🔗 Share** button on the song detail page
3. Choose how to share:
   - **Copy link** — paste anywhere
   - **SMS** — opens your default messages app with a pre-filled text
   - **Email** — opens your email with subject and body pre-filled
   - **Twitter/X** or **Facebook** — opens the platform with the post pre-written

**The OG preview card** (the image + title that appears when you paste the link on social media) is automatically generated. It shows the song title, artist, and PurposeJoy branding.

**Pro tip:** Before sharing on social media, "warm up" the preview card by opening this URL once in your browser:  
`https://listen.purposejoy.org/api/share-card/YOUR-SONG-SLUG.png`  
(Replace `YOUR-SONG-SLUG` with your song's slug, e.g. `amazing-grace.png`)  
This generates and caches the image so social platforms see it immediately.

---

## How to Enable Downloads

1. On the song list, find your song → click **— Off** in the Download column
2. It toggles to **⬇ On** — listeners now see a Download button on the song page
3. A disclaimer is shown to listeners: "For personal listening. Not for redistribution."
4. To disable: click **⬇ On** → toggles back to off

---

## How to Archive a Song

Archiving hides a song from listeners but keeps it in your admin panel. Think of it as unpublishing permanently — the files are still there.

1. On the song list, click **Archive** next to a song
2. A confirmation box appears: *"[Song title] will be hidden from listeners."*
3. Click **Yes, archive**

The song disappears from the public playlist but remains in your admin view. You can re-publish it anytime by toggling it live again.

---

## Hard Delete (Permanent — use with caution)

Hard delete permanently removes the song and its audio/image files. This cannot be undone.

This requires a technical step — contact Brandon if you need to permanently delete a song.

---

## Troubleshooting

**"I can't log in"**  
→ Check that you're using the email on the allowlist  
→ Check spam for the OTP code  
→ Try clicking "request a new code" if the first one expired  
→ Contact Brandon if your email isn't working

**"Upload fails or gets stuck"**  
→ Make sure the file is MP3 format (not M4A, WAV, or FLAC)  
→ Check your internet connection  
→ Try a smaller file size first  
→ Try a different browser (Chrome recommended)

**"Song doesn't appear on the listener site after publishing"**  
→ Make sure the Published toggle shows **✓ Live** (not ○ Draft)  
→ Hard refresh the listener page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)  
→ Wait 30 seconds and try again — database updates are near-instant but CDN cache can take a moment

**"The share preview looks wrong or broken"**  
→ Hit the pre-warm URL mentioned above and wait 60 seconds, then re-share  
→ Facebook sometimes caches OG data — use their Sharing Debugger: https://developers.facebook.com/tools/debug/

**"I accidentally published something"**  
→ Click **✓ Live** immediately to unpublish — it returns to Draft and disappears from the site instantly

---

## Questions?

Contact Brandon: the site is built to be reliable, but if anything unexpected happens, he can dig into it.
