import { MIME_EML, MIME_HTML, MIME_JSON, MIME_PLAIN } from 'src/constants/mime';
import { LooseAutocomplete } from '..';

export type GistResponse = {
  files: Record<
    string,
    {
      /**
       * same value as Record key
       */
      filename: string;
      type: LooseAutocomplete<
        | typeof MIME_EML
        | typeof MIME_HTML
        | typeof MIME_JSON
        | typeof MIME_PLAIN
      >;
      language: LooseAutocomplete<'JSON' | 'TYPESCRIPT' | 'JAVASCRIPT'>;
      raw_url: string;
      size: number;
      truncated: boolean;
      content: string;
    }
  >;
};
