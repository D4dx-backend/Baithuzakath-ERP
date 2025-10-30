## Commit Log: Convert `erp/` from submodule to regular directory

Date: 2025-10-30

Summary:
- Removed gitlink (submodule reference) for `erp/` which caused GitHub to show an arrow icon and hide files.
- Re-added the actual `erp/` folder contents to the main repository as regular tracked files.

Actions:
1. `git rm --cached erp` to drop the submodule gitlink from index.
2. Removed any local submodule metadata under `.git/modules/erp` if present.
3. Staged the full `erp/` directory contents and committed as normal files.

Notes:
- No `.gitmodules` file existed; the submodule was an orphaned gitlink. This fix ensures the `erp/` files are visible on GitHub.

