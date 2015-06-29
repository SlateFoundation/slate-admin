#!/bin/bash

# app theme
git clone https://github.com/SlateFoundation/slate-theme.git slate-theme

# framework hotfixes
git clone -b ext/5/1/1/451 https://github.com/JarvusInnovations/sencha-hotfixes.git jarvus-hotfixes

# feature packages
git clone https://github.com/JarvusInnovations/emergence-apikit.git
git clone https://github.com/JarvusInnovations/jarvus-apikit.git
git clone https://github.com/JarvusInnovations/jarvus-ext-searchfield.git
git clone -b ext/5/1/1/451 https://github.com/JarvusInnovations/jarvus-ext-routing.git
git clone -b ext/5/1/1/451 https://github.com/JarvusInnovations/jarvus-lazydata.git
git clone https://github.com/JarvusInnovations/jarvus-ext-actionevents.git
git clone https://github.com/JarvusInnovations/jarvus-ext-glyphs.git
git clone https://github.com/JarvusInnovations/jarvus-ext-treerecords.git