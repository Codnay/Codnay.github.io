# codnay.github.io

Personal site and blog of Pranay Gupta. Plain static HTML served by GitHub Pages.

## Edit the text (no tools needed)

On github.com, open the file, click the pencil, type, then **Commit changes**. The site rebuilds and goes live in
about two minutes.

- Homepage intro: `about.md`. The first paragraph is the big line; a last paragraph starting with **bold** is the
  hello line. `<mark>…</mark>` highlights words.
- A post: `posts/<slug>.md`. Lines like `{{ mahjong-chart }}` place a chart or clip from `posts/<slug>/_parts/`;
  leave them as they are, or move or delete a line to move or drop that piece.

## Write a post

1. Add `posts/<slug>.md` (images in `posts/<slug>/`):

   ```markdown
   ---
   title: Why robots need their own experience
   date: 2026-11-02
   description: One or two sentences for the blog index, the homepage and link previews.
   ---
   The post, in Markdown.
   ```

   Add `authors: A and B` for a co-written post (the byline defaults to Pranay Gupta). To list a post published elsewhere, add `external: <url>` and `where: <site>` and leave the body empty.
2. Run `uv run build.py`. It writes `blog/`, the RSS feed and the homepage's Writing list.
3. Commit everything, including the generated files, and push.

Drafts go in `drafts/` (ignored by git). `uv run build.py --preview /tmp/site` builds the whole site with drafts into another folder to look at.
