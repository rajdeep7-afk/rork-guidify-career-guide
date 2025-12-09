import * as FileSystem from 'expo-file-system/legacy';

export async function extractTextFromFile(uri: string, filename: string): Promise<string> {
  try {
    console.log('[Resume Parser] Extracting text from file:', filename);

    if (filename.toLowerCase().endsWith('.txt')) {
      const content = await FileSystem.readAsStringAsync(uri);
      console.log('[Resume Parser] Successfully read TXT file, length:', content.length);
      return content;
    }

    if (filename.toLowerCase().endsWith('.pdf') || 
        filename.toLowerCase().endsWith('.doc') || 
        filename.toLowerCase().endsWith('.docx')) {
      console.log('[Resume Parser] Processing binary file:', filename);
      
      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      console.log('[Resume Parser] Successfully read file, base64 length:', base64Content.length);

      const instructionText = `
RESUME FILE: ${filename}

This is a ${filename.split('.').pop()?.toUpperCase()} file. Since we cannot parse the binary content directly in React Native, the AI will infer a typical resume structure.

Please provide information about:
- Your name and contact details
- Educational background
- Work experience (if applicable)
- Technical and soft skills
- Projects and achievements
- Location preferences

The AI will create a reasonable template based on your profile type (fresher/experienced) and this filename indicates you have prepared a resume.

IMPORTANT: For best results, please manually verify and complete the extracted information in the next step.
`;

      console.log('[Resume Parser] Binary file processed, returning instruction text');
      return instructionText;
    }

    throw new Error('Unsupported file format. Please use PDF, DOC, DOCX, or TXT files.');
  } catch (error) {
    console.error('[Resume Parser] Error extracting text:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
    throw new Error('Failed to read file. Please try again.');
  }
}
