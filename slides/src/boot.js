/* start on the slide named in the link (#s12), or the cover */
{
  const m = (location.hash || "").match(/^#s(\d+)$/);
  go(m ? +m[1] - 1 : 0);
}
