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
vim.keymap.set("n", "<leader>e", "<cmd>Explore<CR>", { desc = "File explorer" })

-- Plugins: installed on first start, updated with :lua vim.pack.update()
vim.pack.add({
  "https://github.com/folke/which-key.nvim",
  "https://github.com/nvim-lua/plenary.nvim",
  "https://github.com/nvim-telescope/telescope.nvim",
  "https://github.com/lewis6991/gitsigns.nvim",
}, { confirm = false })

vim.opt.rtp:prepend("~/_git/barrydobson/voltaic/nvim")
vim.cmd.colorscheme("voltaic-dark")

require("which-key").setup({ delay = 300 })
require("gitsigns").setup()

local telescope = require("telescope.builtin")
vim.keymap.set("n", "<leader>f", telescope.find_files, { desc = "Find file" })
vim.keymap.set("n", "<leader>/", telescope.live_grep, { desc = "Search text in project" })
vim.keymap.set("n", "<leader>b", telescope.buffers, { desc = "Open buffers" })
vim.keymap.set("n", "<leader>r", telescope.oldfiles, { desc = "Recent files" })
vim.keymap.set("n", "<leader>?", telescope.keymaps, { desc = "Search all keymaps" })
