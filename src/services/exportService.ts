import { Marker, CinemaMetadata, RecordingSession, CinemaProject } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getAllSessions } from './storageService';

// Dicionário de tradução interna para metadados de cinema
export const CinemaTagsMapping = {
  Premiere: {
    scene: 'Scene',
    shotTake: 'Shot',
    goodTake: 'Good',
    notes: 'Log Note',
    description: 'Description',
    rollCard: 'Tape Name',
    label: 'Label'
  },
  DaVinci: {
    scene: 'Scene',
    take: 'Take',
    angle: 'Angle',
    goodTake: 'Good Take',
    camera: 'Camera #',
    rollCard: 'Roll',
    notes: 'Comments',
    keywords: 'Keywords',
    lens: 'Lens'
  }
};

export function downloadAudio(audioUrl: string, filename: string = 'gravacao.webm') {
  const a = document.createElement('a');
  a.href = audioUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function generatePremiereXML(markers: Marker[], cinemaMetadata?: CinemaMetadata, filename: string = 'marcadores.xml') {
  const xmlContent = generatePremiereXMLString(markers, cinemaMetadata);
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function generateDaVinciCSV(markers: Marker[], cinemaMetadata?: CinemaMetadata, filename: string = 'marcadores_davinci.csv') {
  // DaVinci Resolve Marker CSV Format
  // Name,Notes,Marker Type,Color,In,Out,Duration
  
  const header = 'Name,Notes,Marker Type,Color,In,Out,Duration\n';
  const rows = markers.map(m => {
    const color = getColorForType(m.type);
    const inTime = formatTimecode(m.time);
    const outTime = formatTimecode(m.time + 1); // 1 second duration
    // O campo de anotações (m.data) mapeado para Comments (Notes no CSV)
    return `"${m.label}","${m.data || ''}","Marker","${color}",${inTime},${outTime},00:00:01:00`;
  }).join('\n');

  let csvContent = header + rows;
  
  // Se tivermos metadados de cinema, podemos adicionar uma linha de metadados globais ou usar em um formato específico de metadados do DaVinci
  // Por enquanto, vamos adicionar como um marcador inicial no tempo 0 com todas as informações
  if (cinemaMetadata) {
    const metaNotes = `Scene: ${cinemaMetadata.scene || ''} | Take: ${cinemaMetadata.take || ''} | Shot: ${cinemaMetadata.shot || ''} | Cam: ${cinemaMetadata.camera || ''} | Roll: ${cinemaMetadata.rollCard || ''} | Lens: ${cinemaMetadata.lens || ''} | Good: ${cinemaMetadata.goodTake ? 'Yes' : 'No'}`;
    const metaRow = `"${cinemaMetadata.movieName || 'Metadata'}","${metaNotes}","Marker","Purple",00:00:00:00,00:00:01:00,00:00:01:00\n`;
    csvContent = header + metaRow + rows;
  }

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getColorForType(type: string): string {
  switch (type) {
    case 'action':
    case 'cinema_action': return 'Red';
    case 'decision':
    case 'cinema_good': return 'Green';
    case 'person': return 'Blue';
    case 'location': return 'Yellow';
    case 'cut':
    case 'cinema_cut': return 'Purple';
    case 'cinema_error': return 'Orange';
    case 'cinema_note': return 'Cyan';
    default: return 'Cyan';
  }
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const f = '00'; // frames
  return `${h}:${m}:${s}:${f}`;
}

export function generateALE(markers: Marker[], cinemaMetadata?: CinemaMetadata, filename: string = 'marcadores.ale') {
  const aleContent = generateALEString(markers, cinemaMetadata);
  const blob = new Blob([aleContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function generateALEString(markers: Marker[], cinemaMetadata?: CinemaMetadata): string {
  const date = new Date().toLocaleDateString('en-US');
  
  let ale = `Heading
FIELD_DELIM	TABS
VIDEO_FORMAT	1080
AUDIO_FORMAT	48khz
FPS	24

Column
Name	Tracks	Start	End	Scene	Take	Camroll	Labroll	Soundroll	Notes

Data
`;

  // For ALE, we typically define clips. If we have cinema metadata, we can define the main clip.
  if (cinemaMetadata) {
    const name = `${cinemaMetadata.scene || ''}_${cinemaMetadata.shot || ''}_${cinemaMetadata.take || ''}`;
    const start = "00:00:00:00";
    const end = "00:00:00:00"; // We don't have exact duration here easily without passing it
    const scene = cinemaMetadata.scene || '';
    const take = cinemaMetadata.take || '';
    const camroll = cinemaMetadata.camera || '';
    const labroll = cinemaMetadata.lens || '';
    const soundroll = cinemaMetadata.rollCard || '';
    const notes = cinemaMetadata.goodTake ? 'Good Take' : '';
    
    ale += `${name}	V	${start}	${end}	${scene}	${take}	${camroll}	${labroll}	${soundroll}	${notes}\n`;
  }

  // Add markers as locators (some systems parse these if formatted correctly, but ALE is mostly for clips)
  // We'll add them as additional lines or notes if needed, but standard ALE is clip-based.
  // For now, we'll just add the main clip data.
  
  return ale;
}

export async function exportProjectToZip(project: CinemaProject) {
  const zip = new JSZip();
  const projectFolder = zip.folder(project.name || 'Projeto_Sem_Nome');
  
  if (!projectFolder) return;

  const allSessions = await getAllSessions();
  
  // Filter sessions that belong to this project
  const projectSessions = allSessions.filter(s => s.cinemaMetadata?.projectId === project.id);

  for (const session of projectSessions) {
    const meta = session.cinemaMetadata;
    if (!meta) continue;

    // Build folder path: Scene / Shot
    const sceneName = meta.scene || 'Cena_Sem_Nome';
    const shotName = meta.shot || 'Plano_Sem_Nome';
    const takeName = `Take_${meta.take || '01'}`;
    
    const sceneFolder = projectFolder.folder(sceneName);
    const shotFolder = sceneFolder?.folder(shotName);
    
    if (!shotFolder) continue;

    // Generate files for this take
    const baseFilename = `${sceneName}_${shotName}_${takeName}`;

    // 1. Audio File
    if (session.audioBlobs && session.audioBlobs.length > 0) {
      const combinedBlob = new Blob(session.audioBlobs, { type: 'audio/webm' });
      shotFolder.file(`${baseFilename}.webm`, combinedBlob);
    }

    // 2. Premiere XML
    // We need to generate the XML string without downloading it.
    // Let's refactor generatePremiereXML to return the string, or just duplicate the logic here for simplicity.
    const xmlContent = generatePremiereXMLString(session.markers, meta);
    shotFolder.file(`${baseFilename}.xml`, xmlContent);

    // 3. DaVinci CSV
    const csvContent = generateDaVinciCSVString(session.markers, meta);
    shotFolder.file(`${baseFilename}.csv`, csvContent);

    // 4. Avid ALE
    const aleContent = generateALEString(session.markers, meta);
    shotFolder.file(`${baseFilename}.ale`, aleContent);
  }

  // Generate ZIP and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${project.name || 'Projeto'}.zip`);
}

export async function exportSessionToZip(
  session: RecordingSession,
  selectedFiles: {
    audio: boolean;
    transcription: boolean;
    summary: boolean;
    markersCsv: boolean;
    premiereXml: boolean;
    davinciCsv: boolean;
  }
) {
  const zip = new JSZip();
  const baseFilename = session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // 1. Audio File
  if (selectedFiles.audio && session.audioBlobs && session.audioBlobs.length > 0) {
    const combinedBlob = new Blob(session.audioBlobs, { type: 'audio/webm' });
    zip.file(`${baseFilename}.webm`, combinedBlob);
  }

  // 2. Transcription
  if (selectedFiles.transcription && session.transcription) {
    zip.file(`${baseFilename}_transcricao.txt`, session.transcription);
  }

  // 3. Summary & Tasks
  if (selectedFiles.summary && (session.summary || session.tasks)) {
    let summaryContent = '';
    if (session.modeId === 'cinema') {
      if (session.summary) summaryContent += `Resumo Geral:\n${session.summary}\n\n`;
      if (session.tasks && session.tasks.length > 0) {
        summaryContent += `Observações para Edição:\n${session.tasks.map(t => `- ${t}`).join('\n')}\n\n`;
      }
      if (session.decisions && session.decisions.length > 0) {
        summaryContent += `Decisões de Direção / Continuidade:\n${session.decisions.map(d => `- ${d}`).join('\n')}\n\n`;
      }
      if (session.intelligentIndex && session.intelligentIndex.length > 0) {
        summaryContent += `Log de Decupagem:\n${session.intelligentIndex.map(i => `[${i.timeframe}] ${i.topic}`).join('\n')}\n`;
      }
    } else if (session.modeId === 'medical_doctor') {
      if (session.summary) summaryContent += `Resumo Clínico (S/O):\n${session.summary}\n\n`;
      if (session.tasks && session.tasks.length > 0) {
        summaryContent += `Plano (Condutas e Prescrições):\n${session.tasks.map(t => `- ${t}`).join('\n')}\n\n`;
      }
      if (session.decisions && session.decisions.length > 0) {
        summaryContent += `Avaliação (Diagnósticos):\n${session.decisions.map(d => `- ${d}`).join('\n')}\n\n`;
      }
      if (session.intelligentIndex && session.intelligentIndex.length > 0) {
        summaryContent += `Tópicos da Anamnese/Exame:\n${session.intelligentIndex.map(i => `[${i.timeframe}] ${i.topic}`).join('\n')}\n`;
      }
    } else if (session.modeId === 'medical_patient') {
      if (session.summary) summaryContent += `Resumo da Consulta:\n${session.summary}\n\n`;
      if (session.tasks && session.tasks.length > 0) {
        summaryContent += `Próximos Passos:\n${session.tasks.map(t => `- ${t}`).join('\n')}\n\n`;
      }
      if (session.decisions && session.decisions.length > 0) {
        summaryContent += `Conclusões / Diagnósticos:\n${session.decisions.map(d => `- ${d}`).join('\n')}\n\n`;
      }
      if (session.intelligentIndex && session.intelligentIndex.length > 0) {
        summaryContent += `Orientações e Dúvidas:\n${session.intelligentIndex.map(i => `[${i.timeframe}] ${i.topic}`).join('\n')}\n`;
      }
    } else {
      if (session.summary) summaryContent += `Resumo:\n${session.summary}\n\n`;
      if (session.tasks && session.tasks.length > 0) {
        summaryContent += `Tarefas:\n${session.tasks.map(t => `- ${t}`).join('\n')}\n\n`;
      }
      if (session.decisions && session.decisions.length > 0) {
        summaryContent += `Decisões:\n${session.decisions.map(d => `- ${d}`).join('\n')}\n\n`;
      }
      if (session.intelligentIndex && session.intelligentIndex.length > 0) {
        summaryContent += `Índice Inteligente:\n${session.intelligentIndex.map(i => `[${i.timeframe}] ${i.topic}`).join('\n')}\n`;
      }
    }

    let fileNameSuffix = 'resumo';
    if (session.modeId === 'cinema') fileNameSuffix = 'relatorio_edicao';
    if (session.modeId === 'medical_doctor') fileNameSuffix = 'prontuario';
    if (session.modeId === 'medical_patient') fileNameSuffix = 'resumo_paciente';

    zip.file(`${baseFilename}_${fileNameSuffix}.txt`, summaryContent);
  }

  // 4. Markers CSV (Generic)
  if (selectedFiles.markersCsv && session.markers && session.markers.length > 0) {
    const header = 'Tempo,Tipo,Label,Dados\n';
    const rows = session.markers.map(m => {
      const time = formatTimecode(m.time);
      return `${time},"${m.type}","${m.label}","${m.data || ''}"`;
    }).join('\n');
    zip.file(`${baseFilename}_marcadores.csv`, header + rows);
  }

  // 5. Premiere XML
  if (selectedFiles.premiereXml && session.markers && session.markers.length > 0) {
    const xmlContent = generatePremiereXMLString(session.markers, session.cinemaMetadata);
    zip.file(`${baseFilename}_premiere.xml`, xmlContent);
  }

  // 6. DaVinci CSV
  if (selectedFiles.davinciCsv && session.markers && session.markers.length > 0) {
    const csvContent = generateDaVinciCSVString(session.markers, session.cinemaMetadata);
    zip.file(`${baseFilename}_davinci.csv`, csvContent);
  }

  // Generate ZIP and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${baseFilename}.zip`);
}

// Helper functions to return strings instead of triggering downloads
function generatePremiereXMLString(markers: Marker[], cinemaMetadata?: CinemaMetadata): string {
  // Find Ação and Corta markers to define the useful clip duration
  const acaoMarker = markers.find(m => m.type === 'cinema_action' && m.label.toLowerCase().includes('ação'));
  const cortaMarker = markers.find(m => m.type === 'cinema_action' && m.label.toLowerCase().includes('corta'));
  
  const inPoint = acaoMarker ? Math.floor(acaoMarker.time * 30) : 0;
  const outPoint = cortaMarker ? Math.floor(cortaMarker.time * 30) : -1;

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence id="sequence-1">
    <name>${cinemaMetadata?.movieName || 'CapIAudio Sequence'}</name>
    <duration>0</duration>
    <rate>
      <timebase>30</timebase>
      <ntsc>TRUE</ntsc>
    </rate>
    ${cinemaMetadata ? `
    <clipitem>
      <name>Clip</name>
      <in>${inPoint}</in>
      <out>${outPoint}</out>
      <logginginfo>
        <scene>${cinemaMetadata.scene || ''}</scene>
        <shottake>${cinemaMetadata.shot || ''} - Take ${cinemaMetadata.take || ''}</shottake>
        <lognote>Cam: ${cinemaMetadata.camera || ''} | Lens: ${cinemaMetadata.lens || ''}</lognote>
        <good>${cinemaMetadata.goodTake ? 'TRUE' : 'FALSE'}</good>
      </logginginfo>
    </clipitem>
    ` : ''}
    <marker>
      ${markers.map(m => `
      <marker>
        <name>${m.label}</name>
        <in>${Math.floor(m.time * 30)}</in>
        <out>${Math.floor(m.time * 30)}</out>
        <comment>${m.data || ''}</comment>
      </marker>
      `).join('')}
    </marker>
  </sequence>
</xmeml>`;
  return xmlContent;
}

function generateDaVinciCSVString(markers: Marker[], cinemaMetadata?: CinemaMetadata): string {
  const header = "Name,Notes,Marker Name,Color,In,Out,Duration\n";
  const rows = markers.map(m => {
    const timecode = formatTimecode(m.time);
    const color = getColorForType(m.type);
    return `"${m.label}","${m.data || ''}","${m.label}","${color}",${timecode},${timecode},00:00:00:01`;
  }).join('\n');

  let csvContent = header + rows;

  if (cinemaMetadata) {
    const metaNotes = `Scene: ${cinemaMetadata.scene || ''} | Take: ${cinemaMetadata.take || ''} | Shot: ${cinemaMetadata.shot || ''} | Cam: ${cinemaMetadata.camera || ''} | Roll: ${cinemaMetadata.rollCard || ''} | Lens: ${cinemaMetadata.lens || ''} | Good: ${cinemaMetadata.goodTake ? 'Yes' : 'No'}`;
    const metaRow = `"${cinemaMetadata.movieName || 'Metadata'}","${metaNotes}","Marker","Purple",00:00:00:00,00:00:01:00,00:00:01:00\n`;
    csvContent = header + metaRow + rows;
  }

  return csvContent;
}
