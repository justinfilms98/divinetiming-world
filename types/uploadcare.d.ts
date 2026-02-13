declare namespace JSX {
  interface IntrinsicElements {
    'uc-config': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'ctx-name'?: string;
        pubkey?: string;
        'source-list'?: string;
      },
      HTMLElement
    >;
    'uc-file-uploader-minimal': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & { 'ctx-name'?: string },
      HTMLElement
    >;
  }
}
