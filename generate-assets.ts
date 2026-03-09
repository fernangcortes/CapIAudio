import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({});

async function generate() {
  try {
    console.log('Generating favicon...');
    const favRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A minimalist, modern app icon for an audio recording and transcription app called CapIAudio. Clean lines, emerald green and cyan colors, dark background, vector style, simple.',
    });
    
    for (const part of favRes.candidates[0].content.parts) {
      if (part.inlineData) {
        fs.writeFileSync('public/favicon.png', Buffer.from(part.inlineData.data, 'base64'));
        console.log('Favicon saved.');
        break;
      }
    }

    console.log('Generating cover...');
    const coverRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A professional cover image for an audio recording and transcription web application called CapIAudio. Features a sleek dark mode interface, audio waveforms, and AI transcription concepts. Emerald green and cyan accents. Cinematic lighting, high quality.',
    });

    for (const part of coverRes.candidates[0].content.parts) {
      if (part.inlineData) {
        fs.writeFileSync('public/cover.png', Buffer.from(part.inlineData.data, 'base64'));
        console.log('Cover saved.');
        break;
      }
    }
    console.log('Images generated successfully');
  } catch (e) {
    console.error(e);
  }
}

generate();
