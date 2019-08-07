export const getLocalizedPath = (pathname, language, slugs, routed) => {
  const defaultPath = routed ? `/${language}${pathname}` : pathname

  const translatedSlugs = slugs[language]
  if (!translatedSlugs) return defaultPath

  const newPath = pathname
    .split("/")
    .map(word => (translatedSlugs[word] ? translatedSlugs[word] : word))
    .join("/")

  return routed ? `/${language}${newPath}` : newPath
}
