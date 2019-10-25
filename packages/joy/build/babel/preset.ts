import { PluginItem } from '@babel/core'
const env = process.env.NODE_ENV
const isProduction = env === 'production'
const isDevelopment = env === 'development'
const isTest = env === 'test'

type StyledJsxPlugin = [string, any] | string
type StyledJsxBabelOptions = {
  plugins?: StyledJsxPlugin[]
  'babel-test'?: boolean
} | undefined

// Resolve styled-jsx plugins
function styledJsxOptions(options: StyledJsxBabelOptions) {
  if (!options) {
    return {}
  }

  if (!Array.isArray(options.plugins)) {
    return options
  }

  options.plugins = options.plugins.map(
    (plugin: StyledJsxPlugin): StyledJsxPlugin => {
      if (Array.isArray(plugin)) {
        const [name, options] = plugin
        return [require.resolve(name), options]
      }

      return require.resolve(plugin)
    }
  )

  return options
}

type JoyBabelPresetOptions = {
  'preset-env'?: any
  'preset-react'?: any
  'class-properties'?: any
  'transform-runtime'?: any
  'experimental-modern-preset'?: PluginItem
  'styled-jsx'?: StyledJsxBabelOptions
}

type BabelPreset = {
  presets?: PluginItem[] | null
  plugins?: PluginItem[] | null
  sourceType?: 'script' | 'module' | 'unambiguous'
  overrides?: any[]
}

module.exports = (context: any, opts: JoyBabelPresetOptions = {}) => ({
  presets: [
    [require('@babel/preset-env').default, {
      // In the test environment `modules` is often needed to be set to true, babel figures that out by itself using the `'auto'` option
      // In production/development this option is set to `false` so that webpack can handle import/export with tree-shaking
      modules: isDevelopment || isProduction ? false : 'auto',
      ...opts['preset-env']
    }],
    [require('@babel/preset-typescript'), { isTSX: true, allExtensions: true }],
    [require('@babel/preset-react'), {
      // This adds @babel/plugin-transform-react-jsx-source and
      // @babel/plugin-transform-react-jsx-self automatically in development
      development: isDevelopment || isTest,
      ...opts['preset-react']
    }]

  ],
  plugins: [
    [require('./plugins/joy-autowire-label-plugin'), { autoBinding: false }],
    [require('./plugins/joy-use-effects-plugin')],
    (isDevelopment || isTest) && [require('./plugins/joy-controller-react-hot-loader-label-plugin')],
    require('babel-plugin-react-require'),
    require('@babel/plugin-syntax-dynamic-import'),
    require('./plugins/react-loadable-plugin'),
    [require('@babel/plugin-proposal-decorators'), { decoratorsBeforeExport: true }],
    [require('@babel/plugin-proposal-class-properties')],
    require('@babel/plugin-proposal-object-rest-spread'),
    [require('@babel/plugin-transform-runtime'), {
      helpers: false,
      regenerator: true,
      ...opts['transform-runtime']
    }],
    [require('styled-jsx/babel'), styledJsxOptions(opts['styled-jsx'])],
    // 暂时屏蔽该插件(版本：v0.4.21)，会导致编译错误 （Duplicate declaration "React"） 2018年12月18日
    // isProduction && require('babel-plugin-transform-react-remove-prop-types')
    (!isProduction) && require('react-hot-loader/babel')
  ].filter(Boolean)
})
