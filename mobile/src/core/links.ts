const merchantHosts = [
  "flipkart.com",
  "amazon.in",
  "myntra.com",
  "ajio.com",
  "bonkerscorner.com",
  "bewakoof.com",
  "snitch.com",
  "snitch.co.in",
  "thesouledstore.com",
  "newme.asia",
  "meesho.com",
  "nykaafashion.com",
  "tatacliq.com",
  "tatacliqluxury.com",
  "hm.com",
  "uniqlo.com",
  "westside.com",
  "freakins.com",
  "offduty.in",
  "superkicks.in",
  "vegnonveg.com",
  "puma.com",
];
export function trustedMerchantUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !merchantHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
  )
    throw new Error("This store link is not supported. Try another result.");
  return url.href;
}

// Permit only this app's signed /go endpoint, never a general Convex-site redirect.
export function trustedProductLink(value:string,backendUrl?:string){
 const url=new URL(value);
 if(backendUrl){
  const backend=new URL(backendUrl);
  const expected=backend.hostname.endsWith('.convex.cloud')?backend.origin.replace(/\.convex\.cloud$/,'.convex.site'):null;
  if(expected&&url.origin===expected&&url.protocol==='https:'&&!url.username&&!url.password&&!url.hash&&url.pathname==='/go'&&[...url.searchParams.keys()].length===1&&/^[\w-]+\.[\w-]+$/.test(url.searchParams.get('token')??''))return url.href;
 }
 return trustedMerchantUrl(value);
}
