const notifier = require('node-notifier')
const relative = require('path').relative

const babelOpts = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        targets: {
          esmodules: true
        },
        loose: true,
        exclude: ['transform-typeof-symbol']
      }
    ],
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 2,
        helpers: true,
        regenerator: false,
        useESModules: false
      }
    ]
  ]
}

export async function src (task, opts) {
  await task
    .source(opts.src || 'src/**/*.+(js|ts|tsx)')
    .babel(babelOpts)
    .target('dist')
  notify('Compiled src files')
}

export async function compile (task) {
  await task.parallel([
    'src'
  ])
}

export async function build (task) {
  await task.serial(['compile'])
}

export default async function (task) {
  await task.clear('dist')
  await task.start('build')
  await task.watch('src/**/*.+(js|ts|tsx)', 'src')
}

export async function release (task) {
  await task.clear('dist').start('build')
}

// notification helper
function notify (msg) {
  return notifier.notify({
    title: '▲ @symph/temp',
    message: msg,
    icon: false
  })
}
