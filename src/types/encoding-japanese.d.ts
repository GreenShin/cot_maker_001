declare module 'encoding-japanese' {
  export interface ConvertOptions {
    to: string;
    from: string;
    type?: 'string' | 'arraybuffer' | 'array';
    bom?: boolean | 'auto';
  }

  export function detect(data: number[] | Uint8Array): string | boolean;
  export function convert(data: number[] | Uint8Array | string, options: ConvertOptions): number[];
  export function urlEncode(data: number[]): string;
  export function urlDecode(string: string): number[];
  export function base64Encode(data: number[]): string;
  export function base64Decode(string: string): number[];
  export function codeToString(data: number[]): string;
  export function stringToCode(string: string): number[];

  const Encoding: {
    detect: typeof detect;
    convert: typeof convert;
    urlEncode: typeof urlEncode;
    urlDecode: typeof urlDecode;
    base64Encode: typeof base64Encode;
    base64Decode: typeof base64Decode;
    codeToString: typeof codeToString;
    stringToCode: typeof stringToCode;
  };

  export default Encoding;
}


