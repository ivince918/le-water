/* Server entry for the build-time prerender.
   Renders the same <App /> the browser renders, with no browser involved — so it
   works on any CI, unlike a headless-Chrome snapshot. <Analytics /> is omitted:
   it is a browser-only beacon and contributes nothing to the static HTML. */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import App from './App.jsx'

export function render() {
  return renderToStaticMarkup(<App />)
}
