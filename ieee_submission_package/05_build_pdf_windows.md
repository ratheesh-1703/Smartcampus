# Build Print-Ready PDF on Windows

## 1) Install a LaTeX distribution (one-time)
Choose one:
- MiKTeX: https://miktex.org/download
- TeX Live: https://www.tug.org/texlive/windows.html

After install, reopen PowerShell and verify:
- pdflatex --version
- bibtex --version

## 2) Build commands
From project root:

```
cd c:\Users\ASUS\Downloads\SmartCampus\ieee_submission_package
pdflatex 01_smartcampus_ieee_manuscript.tex
bibtex 01_smartcampus_ieee_manuscript
pdflatex 01_smartcampus_ieee_manuscript.tex
pdflatex 01_smartcampus_ieee_manuscript.tex
```

Output PDF:
- 01_smartcampus_ieee_manuscript.pdf

## 3) Print-ready checks
- Two-column IEEE layout renders correctly.
- No ??? citation markers remain.
- Figures/tables are within margins.
- Author block is finalized.
- PDF opens without missing fonts.

## 4) Optional: double-blind submission
If your venue is double-blind, replace author details in the manuscript with:
- Anonymous Author(s)
- Anonymous Institution

Then rebuild PDF using the same commands.
