export default interface IContext<
  Configuration = unknown,
  SecretKey = unknown
> {
  /**
   * Get all configuration.
   *
   * @returns all country configurations.
   */
  getConfiguration(): Configuration;

  /**
   * Get a secret.
   *
   * @param key the key of the secret.
   * @param keys the optional keys.
   *
   * @returns the secret value.
   */
  getSecret(key: SecretKey, ...keys: SecretKey[]): Promise<string[]>;
}
