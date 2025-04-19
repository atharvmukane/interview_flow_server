declare module 'pdf-parse' {
    import { Buffer } from 'buffer';

    interface PDFInfo {
        numpages: number;
        numrender: number;
        info: any;
        metadata: any;
        version: string;
        text: string;
    }

    function pdf(dataBuffer: Buffer): Promise<PDFInfo>;

    export = pdf;
}
