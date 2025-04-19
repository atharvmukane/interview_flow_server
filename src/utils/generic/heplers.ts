export function extractExtention(filename: string): string | undefined {
    const regex: RegExp = /(?:\.([^.]+))?$/;
    const extractedFilename = regex.exec(filename);
    if (extractedFilename) {
        return extractedFilename[1].toLowerCase();
    }
    return undefined;
}