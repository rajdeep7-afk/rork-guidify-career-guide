import * as FileSystem from 'expo-file-system';

export async function extractTextFromFile(uri: string, filename: string): Promise<string> {
  try {
    console.log('[Resume Parser] Extracting text from file:', filename);

    if (filename.toLowerCase().endsWith('.txt')) {
      const content = await FileSystem.readAsStringAsync(uri);
      console.log('[Resume Parser] Successfully read TXT file');
      return content;
    }

    if (filename.toLowerCase().endsWith('.pdf') || 
        filename.toLowerCase().endsWith('.doc') || 
        filename.toLowerCase().endsWith('.docx')) {
      console.log('[Resume Parser] Reading binary file as base64');
      
      await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const sampleText = `
RESUME DOCUMENT

File: ${filename}
Note: This is a demonstration. In production, you would use a PDF/DOC parsing library.

For accurate parsing, please convert your resume to TXT format, or the AI will attempt to extract information from the file metadata and name.

Based on typical resume content, this file likely contains:
- Personal Information (Name, Email, Phone)
- Professional Summary
- Work Experience
- Education
- Technical Skills
- Projects
- Certifications

The AI will do its best to infer information and create a template profile.
`;

      console.log('[Resume Parser] Binary file detected, using template text');
      return sampleText;
    }

    throw new Error('Unsupported file format. Please use PDF, DOC, DOCX, or TXT files.');
  } catch (error) {
    console.error('[Resume Parser] Error extracting text:', error);
    throw new Error('Failed to read file. Please try again.');
  }
}
