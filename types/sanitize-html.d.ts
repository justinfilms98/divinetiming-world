declare module 'sanitize-html' {
  interface Options {
    allowedTags?: string[] | false;
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowedSchemesAppliedToAttributes?: string[];
    transformTags?: Record<
      string,
      | string
      | ((
          tagName: string,
          attribs: Record<string, string>
        ) => { tagName: string | false; attribs: Record<string, string> })
    >;
  }
  function sanitizeHtml(html: string, options?: Options): string;
  export = sanitizeHtml;
}
