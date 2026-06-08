import { NextResponse } from 'next/server';
const PDFParser = require("pdf2json");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1); // 1 enables raw text parsing
      
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      
      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
