import React from "react"
import PropTypes from "prop-types"
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby"
import { IntlContextConsumer } from "./intl-context"
import { getLocalizedPath } from "./path-transform"

const Link = ({ to, language, children, onClick, ...rest }) => (
  <IntlContextConsumer>
    {intl => {
      const languageLink = language || intl.language
      const link = getLocalizedPath(to, languageLink, intl.slugs, intl.routed)

      const handleClick = e => {
        if (language) {
          localStorage.setItem("gatsby-intl-language", language)
        }
        if (onClick) {
          onClick(e)
        }
      }

      return (
        <GatsbyLink {...rest} to={link} onClick={handleClick}>
          {children}
        </GatsbyLink>
      )
    }}
  </IntlContextConsumer>
)

Link.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  language: PropTypes.string,
}

Link.defaultProps = {
  to: "",
}

export default Link

export const navigate = (to = "/", options) => {
  if (typeof window === "undefined") {
    return
  }

  const { language, slugs, routed } = window.___gatsbyIntl
  const link = routed ? getLocalizedPath(to, language, slugs, routed) : `${to}`
  gatsbyNavigate(link, options)
}

export const changeLocale = (language, to) => {
  if (typeof window === "undefined") {
    return
  }

  const { originalPath, slugs } = window.___gatsbyIntl

  let pathname = to
  if (typeof to === "undefined" && language !== "en") {
    pathname = getLocalizedPath(originalPath, language, slugs, true)
  } else if (typeof to === "undefined") {
    pathname = `/${language}${originalPath}`
  }

  // TODO: check slash
  const link = `${pathname}${window.location.search}`
  localStorage.setItem("gatsby-intl-language", language)
  gatsbyNavigate(link)
}
