import React from 'react'
import ReactDOM from 'react-dom'
import HeadManager from './head-manager'
import { createClientRouter } from '../lib/router'
import EventEmitter from '../lib/EventEmitter'
import { create as createTempo } from '@symph/tempo'
import { createBrowserHistory } from 'history'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import ErrorBoundary from './error-boundary'
import Loadable from '../lib/loadable'
import App from '../lib/app'

const {
  __JOY_DATA__: {
    props,
    err,
    // page,
    pathname,
    // query,
    // buildId,
    // assetPrefix,
    // runtimeConfig,
    initStoreState
  },
  location
} = window

const headManager = new HeadManager()
const appContainer = document.getElementById('__joy')

// let lastAppProps
let webpackHMR
export let Router
export let ErrorComponent
let Component
// let App

export const emitter = new EventEmitter()

export default async ({
  webpackHMR: passedWebpackHMR
} = {}) => {
  // This makes sure this specific line is removed in production
  if (process.env.NODE_ENV === 'development') {
    webpackHMR = passedWebpackHMR
  }
  ErrorComponent = window.__JOY_ERROR
  ErrorComponent = ErrorComponent.default || ErrorComponent

  let initialErr = err

  try {
    Component = window.__JOY_APP_MAIN
    Component = Component.default || Component

    if (typeof Component !== 'function') {
      throw new Error(`The default export is not a React Component in Main: "${pathname}"`)
    }
  } catch (error) {
    // This catches errors like throwing in the top level of a module
    initialErr = error
  }

  await Loadable.preloadReady()

  const history = createBrowserHistory()
  const routerMid = routerMiddleware(history)
  const tempo = createTempo({
    initialState: initStoreState
  }, {
    initialReducer: {
      router: connectRouter(history)
    },
    setupMiddlewares: (middlewares) => {
      middlewares.unshift(routerMid)
      return middlewares
    }
  })
  tempo.start()

  Router = createClientRouter(history)

  const hash = location.hash.substring(1)
  render({ App, Component, appContentProps: props, hash, err: initialErr, emitter, Router, tempo, isComponentDidPrepare: !!initStoreState })

  return emitter
}

export async function render (props) {
  if (props.err) {
    await renderError(props)
    return
  }

  try {
    await doRender(props)
  } catch (err) {
    await renderError({ ...props, err })
  }
}

// This method handles all runtime and debug errors.
// 404 and 500 errors are special kind of errors
// and they are still handle via the main render method.
export async function renderError (props) {
  const { err } = props

  if (process.env.NODE_ENV !== 'production') {
    throw webpackHMR.prepareError(err)
  }

  // Make sure we log the error to the console, otherwise users can't track down issues.
  console.error(err)

  // In production we do a normal render with the `ErrorComponent` as component.
  // If we've gotten here upon initial render, we can use the props from the server.
  // Otherwise, we need to call `getInitialProps` on `App` before mounting.
  const initAppContentProps = Object.assign({}, props.props, { ...err })
  await doRender({ ...props, err, Component: ErrorComponent, appContentProps: initAppContentProps })
}

let isInitialRender = true

function renderReactElement (reactEl, domEl) {
  // The check for `.hydrate` is there to support React alternatives like preact
  if (initStoreState && initStoreState['@@joy'].isPrepared && isInitialRender && typeof ReactDOM.hydrate === 'function') {
    ReactDOM.hydrate(reactEl, domEl)
  } else {
    ReactDOM.render(reactEl, domEl)
  }

  isInitialRender = false
}

async function doRender (options) {
  const { App, Component, appContentProps, hash, err, emitter: emitterProp = emitter, Router, tempo, isComponentDidPrepare } = options
  const appProps = { Component, hash, err, appContentProps, headManager, Router, tempo, isComponentDidPrepare }

  emitterProp.emit('before-reactdom-render', { Component, ErrorComponent, appProps })

  // In development runtime errors are caught by react-error-overlay.
  if (process.env.NODE_ENV === 'development') {
    renderReactElement((
      <App {...appProps} />
    ), appContainer)
  } else {
    // In production we catch runtime errors using componentDidCatch which will trigger renderError.
    const onError = async (error) => {
      try {
        await renderError({ ...options, err: error })
      } catch (err) {
        console.error('Error while rendering error page: ', err)
      }
    }
    renderReactElement((
      <ErrorBoundary onError={onError}>
        <App {...appProps} />
      </ErrorBoundary>
    ), appContainer)
  }

  emitterProp.emit('after-reactdom-render', { Component, ErrorComponent, appProps })
}
