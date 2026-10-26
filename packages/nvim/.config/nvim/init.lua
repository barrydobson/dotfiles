-- Minimal Neovim config for occasional use. Needs Neovim 0.12+ (built-in vim.pack).
-- Press <Space> and wait to see what the leader keys do.

vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- Options
vim.o.number = true -- plain line numbers, no relative numbering
vim.o.mouse = "a" -- click, scroll and select with the mouse
vim.o.clipboard = "unnamedplus" -- yank and paste use the system clipboard
vim.o.ignorecase = true -- searches ignore case...
vim.o.smartcase = true -- ...unless they contain a capital letter
vim.o.wrap = true
vim.o.breakindent = true -- wrapped lines keep their indent
vim.o.undofile = true -- undo history survives closing the file
vim.o.signcolumn = "yes" -- stops the text jumping sideways when git signs appear
vim.o.cursorline = true
vim.o.scrolloff = 8
vim.o.splitright = true
vim.o.splitbelow = true
vim.o.confirm = true -- ask to save instead of failing on :q with unsaved changes
vim.o.expandtab = true
vim.o.shiftwidth = 2
vim.o.tabstop = 2

-- Keymaps
vim.keymap.set("i", "jj", "<Esc>")
vim.keymap.set("i", "jk", "<Esc>")
vim.keymap.set("n", "<Esc>", "<cmd>nohlsearch<CR>", { desc = "Clear search highlight" })
vim.keymap.set("n", "<leader>w", "<cmd>write<CR>", { desc = "Save file" })
vim.keymap.set("n", "<leader>q", "<cmd>quit<CR>", { desc = "Quit window" })
vim.keymap.set("n", "<leader>e", "<cmd>Neotree toggle reveal<CR>", { desc = "File explorer" })

-- Plugins: installed on first start, updated with :lua vim.pack.update()
vim.pack.add({
  "https://github.com/folke/which-key.nvim",
  "https://github.com/nvim-lua/plenary.nvim",
  "https://github.com/nvim-telescope/telescope.nvim",
  "https://github.com/lewis6991/gitsigns.nvim",
  "https://github.com/MunifTanjim/nui.nvim",
  "https://github.com/nvim-tree/nvim-web-devicons",
  { src = "https://github.com/nvim-neo-tree/neo-tree.nvim", version = "v3.x" },
}, { confirm = false })

vim.opt.rtp:prepend("~/_git/barrydobson/voltaic/nvim")
vim.cmd.colorscheme("voltaic-dark")

require("which-key").setup({ delay = 300 })

-- Sidebar file tree; `nvim .` opens it instead of netrw
require("neo-tree").setup({
  filesystem = {
    hijack_netrw_behavior = "open_default",
    follow_current_file = { enabled = true },
    filtered_items = { hide_dotfiles = false, never_show = { ".git", ".DS_Store" } },
  },
})
local gitsigns = require("gitsigns")
gitsigns.setup()

-- In diff mode ]c/[c keep their built-in meaning (next/previous change in the diff)
vim.keymap.set("n", "]c", function()
  if vim.wo.diff then return vim.cmd.normal({ "]c", bang = true }) end
  gitsigns.nav_hunk("next")
end, { desc = "Next git change" })
vim.keymap.set("n", "[c", function()
  if vim.wo.diff then return vim.cmd.normal({ "[c", bang = true }) end
  gitsigns.nav_hunk("prev")
end, { desc = "Previous git change" })
vim.keymap.set("n", "<leader>hp", gitsigns.preview_hunk, { desc = "Preview git change" })
vim.keymap.set("n", "<leader>hd", gitsigns.diffthis, { desc = "Diff file against index" })

-- Pick up changes lazygit (or anything else) makes on disk
vim.api.nvim_create_autocmd({ "FocusGained", "BufEnter" }, { command = "checktime" })

local telescope = require("telescope.builtin")
vim.keymap.set("n", "<leader>g", telescope.git_status, { desc = "Changed files" })
vim.keymap.set("n", "<leader>f", telescope.find_files, { desc = "Find file" })
vim.keymap.set("n", "<leader>/", telescope.live_grep, { desc = "Search text in project" })
vim.keymap.set("n", "<leader>b", telescope.buffers, { desc = "Open buffers" })
vim.keymap.set("n", "<leader>r", telescope.oldfiles, { desc = "Recent files" })
vim.keymap.set("n", "<leader>?", telescope.keymaps, { desc = "Search all keymaps" })
