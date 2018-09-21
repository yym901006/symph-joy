import React from 'react'
import httpStatus from 'http-status'
// @ts-ignore
import Head from './head'

type ErrorProps = {
  err: null | string | Error
}

export default class Error extends React.Component<ErrorProps> {
  render () {
    const { err } = this.props
    // @ts-ignore
    const statusCode: number = err ? err.statusCode : null
    const title = statusCode === 404
      ? 'This page could not be found'
      // @ts-ignore
      : httpStatus[statusCode] || 'An unexpected error has occurred'

    return (
      <div style={styles.error}>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1.0' />
          <title>{statusCode}: {title}</title>
        </Head>
        <div>
          <style dangerouslySetInnerHTML={{ __html: 'body { margin: 0 }' }} />
          {statusCode ? <h1 style={styles.h1}>{statusCode}</h1> : null}
          <div style={styles.desc}>
            <h2 style={styles.h2}>{title}.</h2>
          </div>
        </div>
      </div>)
  }
}

const styles : any = {
  error: {
    color: '#000',
    background: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", "Fira Sans", Avenir, "Helvetica Neue", "Lucida Grande", sans-serif',
    height: '100vh',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },

  desc: {
    display: 'inline-block',
    textAlign: 'left',
    lineHeight: '49px',
    height: '49px',
    verticalAlign: 'middle'
  },

  h1: {
    display: 'inline-block',
    borderRight: '1px solid rgba(0, 0, 0,.3)',
    margin: 0,
    marginRight: '20px',
    padding: '10px 23px 10px 0',
    fontSize: '24px',
    fontWeight: 500,
    verticalAlign: 'top'
  },

  h2: {
    fontSize: '14px',
    fontWeight: 'normal',
    lineHeight: 'inherit',
    margin: 0,
    padding: 0
  }
}