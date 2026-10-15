# Neovim Keymap Reference

The whole config is one file: `packages/nvim/.config/nvim/init.lua`. Press
`<leader>` (Space) and wait to see the which-key popup, or `<leader>?` to
search every keymap.

## Key Notation

- `<leader>` = Space
- `<C-x>` = Ctrl + x, `<M-x>` = Alt/Option + x, `<S-x>` = Shift + x

## Custom keymaps

| Keymap      | Mode   | Action                         |
| ----------- | ------ | ------------------------------ |
| `jj` / `jk` | Insert | Escape to normal mode          |
| `<Esc>`     | Normal | Clear search highlight         |
| `<leader>w` | Normal | Save file                      |
| `<leader>q` | Normal | Quit window                    |
| `<leader>e` | Normal | File explorer (built-in netrw) |
| `<leader>f` | Normal | Find file                      |
| `<leader>/` | Normal | Search text in project         |
| `<leader>b` | Normal | Open buffers                   |
| `<leader>r` | Normal | Recent files                   |
| `<leader>?` | Normal | Search all keymaps             |

## Plugins

Managed by Neovim's built-in `vim.pack` (needs Neovim 0.12+). Versions are
pinned in `nvim-pack-lock.json`; update with `:lua vim.pack.update()`.

- `catppuccin` - colourscheme (`catppuccin-mocha`)
- `which-key.nvim` - popup of available keys
- `telescope.nvim` (+ `plenary.nvim`) - fuzzy finder
- `gitsigns.nvim` - git change markers in the gutter

## Learning Vim

Run `:Tutor` for the built-in 30-minute tutorial.
