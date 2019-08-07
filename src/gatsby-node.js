const webpack = require("webpack")
const { getLocalizedPath } = require("./utils/pathTransform")

function flattenMessages(nestedMessages, prefix = "") {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    let value = nestedMessages[key]
    let prefixedKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === "string") {
      messages[prefixedKey] = value
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey))
    }

    return messages
  }, {})
}

exports.onCreateWebpackConfig = ({ actions, plugins }, pluginOptions) => {
  const { redirectComponent = null, languages, defaultLanguage } = pluginOptions
  if (!languages.includes(defaultLanguage)) {
    languages.push(defaultLanguage)
  }
  const regex = new RegExp(languages.map(l => l.split("-")[0]).join("|"))
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        GATSBY_INTL_REDIRECT_COMPONENT_PATH: JSON.stringify(redirectComponent),
      }),
      new webpack.ContextReplacementPlugin(
        /react-intl[/\\]locale-data$/,
        regex
      ),
    ],
  })
}

exports.onCreatePage = async ({ page, actions }, pluginOptions) => {
  //Exit if the page has already been processed.
  if (typeof page.context.intl === "object") {
    return
  }
  const { createPage, deletePage } = actions
  const {
    path = ".",
    slugsFilename = "slugs.json",
    languages = ["en"],
    defaultLanguage = "en",
    defaultLocale = true,
    redirect = false,
  } = pluginOptions

  const getMessages = (path, language) => {
    try {
      // TODO load yaml here
      const messages = require(`${path}/${language}.json`)
      //
      return flattenMessages(messages)
    } catch (err) {
      return {}
    }
  }

  const getSlugs = (path, file) => {
    try {
      // TODO load yaml here
      return require(`${path}/${file}`)
    } catch (err) {
      return {}
    }
  }

  const generatePage = (routed, language) => {
    const messages = getMessages(path, language)
    const slugs = getSlugs(path, slugsFilename)
    const newPath = getLocalizedPath(page.path, language, slugs, routed)
    return {
      ...page,
      path: newPath,
      context: {
        ...page.context,
        intl: {
          language,
          languages,
          messages,
          slugs,
          routed,
          originalPath: page.path,
          redirect,
        },
      },
    }
  }

  const newPage = generatePage(false, defaultLanguage)
  deletePage(page)
  createPage(newPage)

  languages
    .filter(locale => {
      if (defaultLocale === true) return true
      return locale !== defaultLanguage
    })
    .forEach(language => {
      const localePage = generatePage(true, language)
      if (localePage.path.includes(`/404/`)) {
        localePage.matchPath = `/${language}/*`
      }
      createPage(localePage)
    })
}
