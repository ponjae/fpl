/**
 * Regexp used to replace values in path.
 */
const UrlReplaceRegexp = /:(\w+)/g;

/**
 * String param inference type. Infers union type of values from string with a certain delimiter.
 */
export type StringParams<
  Source extends string,
  Prefix extends string,
  Suffix extends string
> = Source extends `${string}${Prefix}${infer Head}${Suffix}${infer Tail}`
  ? Head | StringParams<Tail, Prefix, Suffix>
  : Source extends `${string}${Prefix}${infer Head}`
  ? Head
  : never;

export type PathParams<T extends string> = StringParams<T, ':', '/'>;

/**
 * Replace text in a template string.
 *
 * @param template - the text template.
 * @param regexp - the regular expression.
 * @param replacements - a dictionary of the replacements to do in the text.
 *
 * @returns the text with replaced texts.
 */
export const replace = (
  template: string,
  regexp: RegExp,
  replacements: Record<string, string | number>
) =>
  template.replace(regexp, (sub, args) =>
    Object.prototype.hasOwnProperty.call(replacements, args)
      ? replacements[args].toString()
      : sub
  );

/**
 * Populate a templated path /:a/:b with values.
 *
 * @param path - the path base.
 * @param values - the values to insert.
 *
 * @returns the populated path with the values.
 */
export const toPath = <T extends string>(
  path: T,
  params: Record<PathParams<T>, string | number>
) => replace(path, UrlReplaceRegexp, params);
