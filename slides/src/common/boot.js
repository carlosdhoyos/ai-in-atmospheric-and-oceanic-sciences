/* start on the slide named in the link (#s12 or a slide id such as #op-dense), or the cover */
{
  const h = decodeURIComponent((location.hash || "").slice(1)), m = h.match(/^s(\d+)$/), byId = h && slides.indexOf(document.getElementById(h));
  go(m ? +m[1] - 1 : byId > 0 ? byId : 0);
}
