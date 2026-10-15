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
