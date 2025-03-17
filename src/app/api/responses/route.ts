import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const csvPath = process.env.OUTPUT_CSV_PATH || './output/responses.csv';
    const absolutePath = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ 
        message: "No responses generated yet" 
      }, { status: 404 });
    }
    
    // Read CSV file content
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    
    // Parse CSV content (simple parsing for demonstration)
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    const responses = lines.slice(1)
      .filter(line => line.trim().length > 0) // Skip empty lines
      .map(line => {
        const values = line.split(',');
        const response: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          response[header] = values[index] || '';
        });
        
        return response;
      });
    
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error reading responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}