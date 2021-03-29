# coc-glslx

This is a fork from Evanw for support of glslx on coc.nvim

This adds support for the [GLSLX shader language](https://github.com/evanw/glslx) to [coc.nvim](https://github.com/neoclide/coc.nvim). Features include inline errors, type tooltips, go-to-definition, symbol renaming, and format-on-save. It's [open source](https://github.com/Eric-Song-Nop/coc-glslx).

## Installation

Right now the plugin is already published on npm, so you need to install the plugin with plugin managers or full url from github.

```viml
" Take vim-plug as example
" First install coc.nvim
Plug 'neoclide/coc.nvim'

" Then install coc-glslx using CocInstall
:CocInstall coc-glslx
" Or use Vim-Plug
" Plug 'Eric-Song-Nop/coc-glslx'
```

## Important Note
**You need to register the file as glslx filetype so that the extension will take effect!**

You can use my vim-glslx plugin for syntax hilighting and filetype recongization: 
```viml
Plug 'Eric-Song-Nop/vim-glslx'
```

Or if you don't want my plugin, you can type the following in vim command line to register a new filetype:

```viml
:set filetype=glslx
```
