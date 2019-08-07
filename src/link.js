import React from "react"
import PropTypes from "prop-types"
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby"
import { IntlContextConsumer } from "./intl-context"
import { getLocalizedPath } from "./utils/pathTransform"

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

export const navigate = (to, options) => {
  if (typeof window === "undefined") {
    return
  }

  const { language, slugs, routed } = window.___gatsbyIntl
  const link = getLocalizedPath(to, language, slugs, routed)
  gatsbyNavigate(link, options)
}

export const changeLocale = (language, to) => {
  if (typeof window === "undefined") {
    return
  }
  const { originalPath, slugs, routed } = window.___gatsbyIntl

  const pathname = to || getLocalizedPath(originalPath, language, slugs, routed)
  // TODO: check slash
  const link = `/${language}${pathname}${window.location.search}`
  localStorage.setItem("gatsby-intl-language", language)
  gatsbyNavigate(link)
}
