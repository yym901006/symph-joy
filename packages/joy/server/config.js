import findUp from 'find-up'
import { CONFIG_FILE } from '../lib/constants'

type WebpackConfig = *

type WebpackDevMiddlewareConfig = *

export type JoyConfig = {|
  webpack: null | (webpackConfig: WebpackConfig, {dir: string, dev: boolean, isServer: boolean, buildId: string, config: JoyConfig, defaultLoaders: {}, totalPages: number}) => WebpackConfig,
  webpackDevMiddleware: null | (WebpackDevMiddlewareConfig: WebpackDevMiddlewareConfig) => WebpackDevMiddlewareConfig,
  poweredByHeader: boolean,
  distDir: string,
  assetPrefix: string,
  configOrigin: string,
  useFileSystemPublicRoutes: boolean,
  generateBuildId: () => string,
  generateEtags: boolean,
  pageExtensions: Array<string>
|}

const defaultConfig: JoyConfig = {
  main: 'src/index.js',
  serverRender: true,
  webpack: null,
  webpackDevMiddleware: null,
  poweredByHeader: true,
  distDir: '.joy',
  assetPrefix: '',
  configOrigin: 'default',
  useFileSystemPublicRoutes: true,
  generateBuildId: () => {
    // nanoid is a small url-safe uuid generator
    const nanoid = require('nanoid')
    return nanoid()
  },
  generateEtags: true,
  pageExtensions: ['jsx', 'js', 'ts', 'tsx'],
  exportPathMap: async () => {
    return {
      '/': { page: '/' }
    }
  }
}

type PhaseFunction = (phase: string, options: {defaultConfig: JoyConfig}) => JoyConfig

export default function loadConfig (phase: string, dir: string, customConfig?: JoyConfig): JoyConfig {
  if (customConfig) {
    customConfig.configOrigin = 'server'
    return preparePlugins({ ...defaultConfig, ...customConfig })
  }
  const path: string = findUp.sync(CONFIG_FILE, {
    cwd: dir
  })

  // If config file was found
  if (path && path.length) {
    // $FlowFixMe
    const userConfigModule = require(path)
    const userConfigInitial: JoyConfig | PhaseFunction = userConfigModule.default || userConfigModule
    if (typeof userConfigInitial === 'function') {
      return preparePlugins({ ...defaultConfig, configOrigin: CONFIG_FILE, ...userConfigInitial(phase, { defaultConfig }) })
    }

    return preparePlugins({ ...defaultConfig, configOrigin: CONFIG_FILE, ...userConfigInitial })
  }

  return defaultConfig
}

function preparePlugins (config) {
  if (!config.plugins) {
    return config
  }

  config = { ...config }
  if (!Array.isArray(config.plugins)) {
    throw new Error(`in ${CONFIG_FILE}, the plugins config value must is a Array, or empty`)
  }

  config.plugins.forEach(plugin => {
    config = plugin(config)
  })
  return config
}
