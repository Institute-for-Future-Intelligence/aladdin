/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { ErrorInfo } from 'react';

class ErrorPage extends React.Component<object, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    //logErrorToMyService(error, errorInfo);
  }

  clearCacheAndReload() {
    localStorage.clear();
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            marginTop: 10,
            marginLeft: 20,
          }}
        >
          <h1>Error</h1>
          <p>Something went wrong. Please click the following button to clear the cache and reload the page.</p>
          <p>
            <button onClick={this.clearCacheAndReload}>Refresh</button>
          </p>
        </div>
      );
    }
    // @ts-expect-error ignore
    return this.props.children;
  }
}

export default ErrorPage;
