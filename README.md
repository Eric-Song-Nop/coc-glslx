# coc-glslx

This is a fork from Evanw for support of glslx on coc.nvim

This adds support for the [GLSLX shader language](https://github.com/evanw/glslx) to [coc.nvim](https://github.com/neoclide/coc.nvim). Features include inline errors, type tooltips, go-to-definition, symbol renaming, and format-on-save. It's [open source](https://github.com/Eric-Song-Nop/coc-glslx).

## Installation

Right now the plugin is not published on npm, so you need to install the plugin with plugin managers or full url from github.

```vimscript
" Take vim-plug as example
" First install coc.nvim
Plug 'neoclide/coc.nvim'

" Then install coc-glslx
Plug 'Eric-Song-Nop/coc-glslx'
" Or use CocInstall
" :CocInstall https://github.com/Eric-Song-Nop/coc-glslx
```

## Important Note
**You need to register the file as glslx filetype so that the extension will take effect!**

You can type the following in vim command line:

```vimscript
:set filetype=glslx
```
