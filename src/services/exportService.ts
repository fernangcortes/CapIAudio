import { Marker } from '../types';

export function downloadAudio(audioUrl: string, filename: string = 'gravacao.webm') {
  const a = document.createElement('a');
  a.href = audioUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function generatePremiereXML(markers: Marker[], filename: string = 'marcadores.xml') {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence id="sequence-1">
    <name>CapIAudio Sequence</name>
    <duration>0</duration>
    <rate>
      <timebase>30</timebase>
      <ntsc>TRUE</ntsc>
    </rate>
    <marker>
      ${markers.map(m => `
      <marker>
        <name>${m.label} ${m.data ? `(${m.data})` : ''}</name>
        <in>${Math.floor(m.time * 30)}</in>
        <out>-1</out>
        <comment>${m.type}</comment>
      </marker>`).join('')}
    </marker>
  </sequence>
</xmeml>`;

  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function generateDaVinciCSV(markers: Marker[], filename: string = 'marcadores_davinci.csv') {
  // DaVinci Resolve Marker CSV Format
  // Name,Notes,Marker Type,Color,In,Out,Duration
  
  const header = 'Name,Notes,Marker Type,Color,In,Out,Duration\n';
  const rows = markers.map(m => {
    const color = getColorForType(m.type);
    const inTime = formatTimecode(m.time);
    const outTime = formatTimecode(m.time + 1); // 1 second duration
    return `"${m.label}","${m.data || ''}","Marker","${color}",${inTime},${outTime},00:00:01:00`;
  }).join('\n');

  const csvContent = header + rows;
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
    case 'action': return 'Red';
    case 'decision': return 'Green';
    case 'person': return 'Blue';
    case 'location': return 'Yellow';
    case 'cut': return 'Purple';
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
