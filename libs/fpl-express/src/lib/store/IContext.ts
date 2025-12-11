export default interface IContext<Configuration = unknown> {
  /**
   * Get all configuration.
   *
   * @returns all country configurations.
   */
  getConfiguration(): Configuration;
}
