const webpack = require("webpack")
const path = require("path")
const fs = require("fs")
const yaml = require("js-yaml")

const { getLocalizedPath } = require("./path-transform")

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
// requires json
function getJson(pathname) {
  try {
    return require(pathname)
  } catch (err) {
    return {}
  }
}
// get yaml file
function getYaml(pathname) {
  try {
    return yaml.safeLoad(fs.readFileSync(pathname, "utf8"))
  } catch (err) {
    return {}
  }
}
// tries to read files with json || yaml || yml extensions
function getDataFromJsonOrYaml(pathname) {
  const extension = path.extname(pathname)

  const isEmpty = o => Object.keys(o).length === 0

  switch (extension) {
    case ".json":
      return getJson(pathname)
    case ".yml":
    case ".yaml":
      return getYaml(pathname)
    default:
      const fromJson = getJson(`${pathname}.json`)
      if (!isEmpty(fromJson)) return fromJson

      const fromYml = getYaml(`${pathname}.yml`)
      if (!isEmpty(fromYml)) return fromYml

      const fromYaml = getYaml(`${pathname}.yaml`)
      if (!isEmpty(fromYaml)) return fromYaml

      return {}
  }
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
      const messages = getDataFromJsonOrYaml(`${path}/${language}`)
      //
      return flattenMessages(messages)
    } catch (err) {
      return {}
    }
  }

  const getSlugs = (path, file) => {
    try {
      return getDataFromJsonOrYaml(`${path}/${file}`)
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
