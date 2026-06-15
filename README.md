# BEGIN.S DESIGN Website

GitHub upload friendly version with a simple local admin editor.

## Upload

Upload every file inside this folder to the root of the GitHub repository.

The repository root should show:

- `index.html`
- `styles.css`
- `script.js`
- `admin`
- `data`
- `project-assets`
- `netlify.toml`

## Admin

Open `/admin/` from the website.

Password:

```text
begins316
```

This admin page does not require Netlify Identity.

After editing Photo or Project items:

1. Click `JSON 파일 다운로드`.
2. Replace `data/site-content.json` in GitHub with the downloaded file.
3. Commit the change.
4. Netlify will redeploy from GitHub.

## Notes

This version keeps image files small so GitHub web upload can commit successfully.
