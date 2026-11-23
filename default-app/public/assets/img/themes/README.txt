YEAR THEME BANNERS
==================

Drop a banner image here for each Rotary year, named with the EXACT Rotary year
label the API uses (short form), e.g.:

    2024-25.png
    2025-26.png
    2026-27.png

How it's used (js/home.js -> themeBannerUrl / loadHeroSlides):
- The home hero shows the district's UPLOADED banners for the selected year.
- If the district has no uploaded banner for that year, the hero shows
  assets/img/themes/<yearLabel>.png  (this folder).
- If there is no theme image for that year either, it falls back to
  assets/img/banner-default.png.

So the banner you see, in order of preference:
    uploaded banner (selected year)  ->  year theme banner  ->  generic default

Recommended image size: same aspect as the hero (wide, ~1600x500). PNG or JPG
(the lookup uses .png; rename your file to .png, or tell us to switch the
extension/add multiple).
