import * as XLSX from 'xlsx';
import { UploadedData } from '../types/dashboard';

export function parseExcelFile(file: File): Promise<UploadedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('No data found in file'));
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const numericColumns: string[] = [];
        const categoricalColumns: string[] = [];

        headers.forEach((header) => {
          const values = jsonData.map((row) => row[header]);
          const numericValues = values.filter((v) => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));
          if (numericValues.length > values.length * 0.6) {
            numericColumns.push(header);
            // Convert string numbers to actual numbers
            jsonData.forEach((row) => {
              if (typeof row[header] === 'string' && row[header] !== '') {
                (row as any)[header] = Number(row[header]);
              }
            });
          } else {
            categoricalColumns.push(header);
          }
        });

        resolve({
          fileName: file.name,
          headers,
          rows: jsonData,
          totalRows: jsonData.length,
          totalCols: headers.length,
          numericColumns,
          categoricalColumns,
        });
      } catch (err) {
        reject(new Error('Failed to parse file: ' + (err as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseCSVText(text: string, fileName: string): UploadedData {
  // Use xlsx to handle CSV properly (handles quoted commas, escaped quotes, etc.)
  const workbook = XLSX.read(text, { type: 'string', raw: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, { defval: '' });

  if (jsonData.length === 0) {
    throw new Error('No data found in CSV file');
  }

  const headers = Object.keys(jsonData[0]);
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  headers.forEach((header) => {
    const values = jsonData.map((row) => row[header]);
    const numericValues = values.filter((v) => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));
    if (numericValues.length > values.length * 0.6) {
      numericColumns.push(header);
      // Convert string numbers to actual numbers
      jsonData.forEach((row) => {
        if (typeof row[header] === 'string' && row[header] !== '') {
          (row as any)[header] = Number(row[header]);
        }
      });
    } else {
      categoricalColumns.push(header);
    }
  });

  return {
    fileName,
    headers,
    rows: jsonData,
    totalRows: jsonData.length,
    totalCols: headers.length,
    numericColumns,
    categoricalColumns,
  };
}
