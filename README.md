# codnay.github.io

Personal site and blog of Pranay Gupta. Plain static HTML served by GitHub Pages.

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
