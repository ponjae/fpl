import * as express from 'express';

export default class Server {
  /**
   * Start the the server.
   *
   * @param app the express app.
   * @param port the port to start the app in.
   *
   * @returns the port number.
   */
  public static start(
    app: express.Application,
    port?: number
  ): Promise<string | number> {
    const p = port || process.env.PORT || 3001;
    return new Promise((resolve) => {
      app.listen(p, () => {
        resolve(p);
      });
    });
  }
}
