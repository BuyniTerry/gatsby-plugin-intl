export const getLocalizedPath = (pathname, language, slugs, routed) => {
  const defaultPath = routed && language ? `/${language}${pathname}` : pathname

  const translatedSlugs = slugs[language]
  if (typeof translatedSlugs === "undefined" || translatedSlugs === null) {
    return defaultPath
  }

  let newPath = pathname
    .split("/")
    .map(word => (translatedSlugs[word] ? translatedSlugs[word] : word))
    .join("/")

  return routed && language ? `/${language}${newPath}` : newPath
}
