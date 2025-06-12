// services/ocr.service.ts
import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  };
}

export class OCRService {
  private visionApiKey: string;
  private claudeApiKey: string;

  constructor() {
    this.visionApiKey = config.googleVision.apiKey;
    this.claudeApiKey = config.claude.apiKey;
  }

  async processWithGoogleVision(imageBuffer: Buffer): Promise<OCRResult[]> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.visionApiKey}`,
        {
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 200 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 50 }
            ],
            imageContext: {
              languageHints: ['en'],
              textDetectionParams: {
                enableTextDetectionConfidenceScore: true
              }
            }
          }]
        }
      );

      return this.parseVisionResponse(response.data.responses[0]);
    } catch (error) {
      logger.error('Google Vision API error:', error);
      throw new Error('Failed to process image with Google Vision');
    }
  }

  async processWithClaude(imageBuffer: Buffer, prompt?: string): Promise<any> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const defaultPrompt = `I have a grade sheet image. For each student row in order from top to bottom:
1. Identify which score (10, 8.5, 7.5, 6.5, or 5) is marked/filled/blacked out
2. Check if M (Missing), A (Absent), or E (Exempt) cells are marked/filled/blacked out

Return a CSV with these columns:
Row,Score,Status

Return ONLY the CSV data. No explanations, no markdown, no code blocks.`;

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: config.claude.model,
          max_tokens: 4000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt || defaultPrompt },
              { 
                type: 'image', 
                source: { 
                  type: 'base64', 
                  media_type: 'image/jpeg', 
                  data: base64Image 
                }
              }
            ]
          }]
        },
        {
          headers: {
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseClaudeResponse(response.data);
    } catch (error) {
      logger.error('Claude API error:', error);
      throw new Error('Failed to process image with Claude');
    }
  }

  private parseVisionResponse(response: any): OCRResult[] {
    const textObjects: OCRResult[] = [];
    const annotations = response.textAnnotations || [];

    // Skip the first annotation (full text) and process individual elements
    for (let i = 1; i < annotations.length; i++) {
      const annotation = annotations[i];
      const vertices = annotation.boundingPoly.vertices;
      
      const minX = Math.min(...vertices.map((v: any) => v.x || 0));
      const maxX = Math.max(...vertices.map((v: any) => v.x || 0));
      const minY = Math.min(...vertices.map((v: any) => v.y || 0));
      const maxY = Math.max(...vertices.map((v: any) => v.y || 0));
      
      textObjects.push({
        text: annotation.description.trim(),
        confidence: annotation.confidence || 1.0,
        boundingBox: {
          minX, maxX, minY, maxY,
          width: maxX - minX,
          height: maxY - minY,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2
        }
      });
    }

    return textObjects;
  }

  private parseClaudeResponse(response: any): string {
    let csvResult = response.content[0].text;
    
    // Clean up the response
    csvResult = csvResult.replace(/```csv\n?/gi, '').replace(/```\n?/gi, '');
    
    const lines = csvResult.split('\n');
    let csvStartIndex = 0;
    
    // Find where the actual CSV starts
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('row') && lines[i].includes(',')) {
        csvStartIndex = i;
        break;
      }
    }
    
    return lines.slice(csvStartIndex).join('\n').trim();
  }

  async analyzeGradeSheet(imageBuffer: Buffer, studentCount: number): Promise<any> {
    // First try with Vision API for structure analysis
    const ocrResults = await this.processWithGoogleVision(imageBuffer);
    
    // Cluster into rows
    const rows = this.clusterIntoRows(ocrResults);
    
    // Analyze column positions
    const columnPositions = this.analyzeColumnPositions(rows);
    
    return {
      rows,
      columnPositions,
      ocrResults,
      studentCount
    };
  }

  private clusterIntoRows(textObjects: OCRResult[]): any[] {
    if (!textObjects || textObjects.length === 0) return [];
    
    const sortedObjects = [...textObjects].sort((a, b) => 
      a.boundingBox.centerY - b.boundingBox.centerY
    );
    
    const rows: any[] = [];
    let currentRow: any = null;
    const Y_TOLERANCE = 15;
    
    for (const textObj of sortedObjects) {
      const centerY = textObj.boundingBox.centerY;
      
      if (currentRow && Math.abs(centerY - currentRow.centerY) <= Y_TOLERANCE) {
        currentRow.textObjects.push(textObj);
        currentRow.minY = Math.min(currentRow.minY, textObj.boundingBox.minY);
        currentRow.maxY = Math.max(currentRow.maxY, textObj.boundingBox.maxY);
        currentRow.centerY = (currentRow.minY + currentRow.maxY) / 2;
      } else {
        currentRow = {
          textObjects: [textObj],
          minY: textObj.boundingBox.minY,
          maxY: textObj.boundingBox.maxY,
          centerY: textObj.boundingBox.centerY
        };
        rows.push(currentRow);
      }
    }
    
    // Sort text objects within each row by X position
    rows.forEach(row => {
      row.textObjects.sort((a: OCRResult, b: OCRResult) => 
        a.boundingBox.centerX - b.boundingBox.centerX
      );
    });
    
    return rows;
  }

  private analyzeColumnPositions(rows: any[]): any[] {
    const allXPositions: number[] = [];
    
    // Collect all X positions from sample rows
    rows.slice(0, Math.min(5, rows.length)).forEach(row => {
      row.textObjects.forEach((obj: OCRResult) => {
        allXPositions.push(Math.round(obj.boundingBox.centerX));
      });
    });
    
    // Group similar X positions
    const groupedPositions: any[] = [];
    const tolerance = 20;
    
    allXPositions.sort((a, b) => a - b);
    
    allXPositions.forEach(x => {
      const existingGroup = groupedPositions.find(group => 
        Math.abs(group.centerX - x) <= tolerance
      );
      
      if (existingGroup) {
        existingGroup.positions.push(x);
        existingGroup.centerX = existingGroup.positions.reduce((sum: number, pos: number) => sum + pos, 0) 
          / existingGroup.positions.length;
      } else {
        groupedPositions.push({
          centerX: x,
          positions: [x]
        });
      }
    });
    
    return groupedPositions
      .filter(group => group.positions.length >= 2)
      .sort((a, b) => a.centerX - b.centerX)
      .map(group => Math.round(group.centerX));
  }
}

// services/gradeSheetGenerator.service.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { IGradeSheet } from '../models/GradeSheet';
import { IStudent } from '../models/Student';
import { IPeriod } from '../models/Period';
import { logger } from '../utils/logger';

interface GenerateOptions {
  assignmentName: string;
  gradingScale: string[];
  includeStatus: boolean;
  students: IStudent[];
  period: IPeriod;
  gradeSheetId: string;
}

export class GradeSheetGeneratorService {
  private doc: PDFKit.PDFDocument;
  private pageWidth = 612; // Letter size
  private pageHeight = 792;
  private margin = 50;
  private rowHeight = 30;
  private calibrationMarkSize = 10;

  async generatePDF(options: GenerateOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        this.doc = new PDFDocument({ size: 'letter' });
        const chunks: Buffer[] = [];

        this.doc.on('data', (chunk) => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        this.generateGradeSheet(options);
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateGradeSheet(options: GenerateOptions) {
    // Add calibration marks
    this.addCalibrationMarks();

    // Add header
    this.addHeader(options.assignmentName, options.period.name);

    // Add QR code for tracking
    await this.addQRCode(options.gradeSheetId);

    // Add column headers
    const startY = this.addColumnHeaders(options.gradingScale, options.includeStatus);

    // Add student rows
    this.addStudentRows(options.students, startY, options.gradingScale, options.includeStatus);

    // Add footer
    this.addFooter();
  }

  private addCalibrationMarks() {
    const size = this.calibrationMarkSize;
    
    // Top-left
    this.doc.rect(this.margin - size, this.margin - size, size, size).fill('black');
    
    // Top-right
    this.doc.rect(this.pageWidth - this.margin, this.margin - size, size, size).fill('black');
    
    // Bottom-left
    this.doc.rect(this.margin - size, this.pageHeight - this.margin, size, size).fill('black');
    
    // Bottom-right
    this.doc.rect(this.pageWidth - this.margin, this.pageHeight - this.margin, size, size).fill('black');
  }

  private addHeader(assignmentName: string, periodName: string) {
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(assignmentName, this.margin, this.margin + 20, { align: 'center' });
    
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .text(periodName, this.margin, this.margin + 45, { align: 'center' });
  }

  private async addQRCode(gradeSheetId: string) {
    try {
      const qrCodeData = await QRCode.toBuffer(gradeSheetId, {
        type: 'png',
        width: 60,
        margin: 0
      });
      
      this.doc.image(qrCodeData, this.pageWidth - this.margin - 70, this.margin + 10, {
        width: 60,
        height: 60
      });
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
    }
  }

  private addColumnHeaders(gradingScale: string[], includeStatus: boolean): number {
    const startY = this.margin + 100;
    const rowNumWidth = 40;
    const nameWidth = 150;
    const scoreWidth = 50;
    const statusWidth = 40;
    
    let currentX = this.margin;
    
    // Row number header
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('#', currentX, startY, { width: rowNumWidth, align: 'center' });
    currentX += rowNumWidth;
    
    // Name header
    this.doc.text('Student Name', currentX, startY, { width: nameWidth, align: 'left' });
    currentX += nameWidth;
    
    // Score headers
    gradingScale.forEach(score => {
      this.doc.text(score, currentX, startY, { width: scoreWidth, align: 'center' });
      currentX += scoreWidth;
    });
    
    // Status headers
    if (includeStatus) {
      ['M', 'A', 'E'].forEach(status => {
        this.doc.text(status, currentX, startY, { width: statusWidth, align: 'center' });
        currentX += statusWidth;
      });
    }
    
    // Draw header line
    this.doc
      .moveTo(this.margin, startY + 20)
      .lineTo(this.pageWidth - this.margin, startY + 20)
      .stroke();
    
    return startY + 30;
  }

  private addStudentRows(
    students: IStudent[], 
    startY: number, 
    gradingScale: string[], 
    includeStatus: boolean
  ) {
    const rowNumWidth = 40;
    const nameWidth = 150;
    const scoreWidth = 50;
    const statusWidth = 40;
    
    students.forEach((student, index) => {
      const y = startY + (index * this.rowHeight);
      let currentX = this.margin;
      
      // Check if we need a new page
      if (y > this.pageHeight - this.margin - 50) {
        this.doc.addPage();
        this.addCalibrationMarks();
        return this.addStudentRows(
          students.slice(index), 
          this.margin + 50, 
          gradingScale, 
          includeStatus
        );
      }
      
      // Row number
      this.doc
        .fontSize(10)
        .font('Helvetica')
        .text((index + 1).toString(), currentX, y, { width: rowNumWidth, align: 'center' });
      currentX += rowNumWidth;
      
      // Student name
      this.doc.text(student.getFullName(), currentX, y, { width: nameWidth, align: 'left' });
      currentX += nameWidth;
      
      // Score bubbles
      gradingScale.forEach(() => {
        this.drawBubble(currentX + scoreWidth / 2 - 8, y - 5);
        currentX += scoreWidth;
      });
      
      // Status bubbles
      if (includeStatus) {
        ['M', 'A', 'E'].forEach(() => {
          this.drawBubble(currentX + statusWidth / 2 - 8, y - 5);
          currentX += statusWidth;
        });
      }
      
      // Row separator
      if (index < students.length - 1) {
        this.doc
          .strokeColor('#cccccc')
          .moveTo(this.margin, y + 20)
          .lineTo(this.pageWidth - this.margin, y + 20)
          .stroke();
        this.doc.strokeColor('black');
      }
    });
  }

  private drawBubble(x: number, y: number) {
    const radius = 8;
    this.doc
      .strokeColor('black')
      .lineWidth(1)
      .circle(x + radius, y + radius, radius)
      .stroke();
  }

  private addFooter() {
    const footerY = this.pageHeight - 30;
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Generated on ${new Date().toLocaleDateString()} • AutoGrade`,
        this.margin,
        footerY,
        { align: 'center' }
      );
  }
}

// services/gradeProcessor.service.ts
import { OCRService } from './ocr.service';
import { IStudent } from '../models/Student';
import { logger } from '../utils/logger';

interface ProcessedGrade {
  studentId: string;
  studentName: string;
  score: string;
  status: string[];
}

export class GradeProcessorService {
  private ocrService: OCRService;

  constructor() {
    this.ocrService = new OCRService();
  }

  async processGradeSheet(
    imageBuffer: Buffer,
    students: IStudent[],
    gradingScale: string[],
    ocrProvider: 'vision' | 'claude' = 'vision'
  ): Promise<ProcessedGrade[]> {
    try {
      let gradeData: ProcessedGrade[] = [];

      if (ocrProvider === 'claude') {
        // Process with Claude
        const csvData = await this.ocrService.processWithClaude(imageBuffer);
        gradeData = this.parseClaudeCSV(csvData, students);
      } else {
        // Process with Vision API
        const analysis = await this.ocrService.analyzeGradeSheet(imageBuffer, students.length);
        gradeData = this.processVisionResults(analysis, students, gradingScale);
      }

      // Validate and merge with student data
      return this.mergeWithStudentData(gradeData, students);
    } catch (error) {
      logger.error('Grade processing error:', error);
      throw new Error('Failed to process grade sheet');
    }
  }

  private parseClaudeCSV(csvData: string, students: IStudent[]): ProcessedGrade[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    const grades: ProcessedGrade[] = [];
    
    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('row') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length && i - startIndex < students.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const student = students[i - startIndex];
      
      if (parts.length >= 2) {
        const score = parts[1] || '';
        const statusText = parts[2] || '';
        const status = this.parseStatus(statusText);
        
        grades.push({
          studentId: student.studentId,
          studentName: student.getFullName(),
          score,
          status
        });
      }
    }
    
    return grades;
  }

  private processVisionResults(
    analysis: any,
    students: IStudent[],
    gradingScale: string[]
  ): ProcessedGrade[] {
    const grades: ProcessedGrade[] = [];
    const { rows, columnPositions } = analysis;
    
    // Process each student row
    for (let i = 0; i < students.length && i < rows.length; i++) {
      const student = students[i];
      const row = rows[i];
      
      const grade: ProcessedGrade = {
        studentId: student.studentId,
        studentName: student.getFullName(),
        score: '',
        status: []
      };
      
      // Find marked score
      for (const score of gradingScale) {
        if (this.isColumnMarked(row, columnPositions, gradingScale.indexOf(score) + 2)) {
          grade.score = score;
          break;
        }
      }
      
      // Find marked status
      const statusOptions = ['Missing', 'Absent', 'Exempt'];
      const statusStartIndex = 2 + gradingScale.length;
      
      statusOptions.forEach((status, index) => {
        if (this.isColumnMarked(row, columnPositions, statusStartIndex + index)) {
          grade.status.push(status);
        }
      });
      
      grades.push(grade);
    }
    
    return grades;
  }

  private isColumnMarked(row: any, columnPositions: number[], columnIndex: number): boolean {
    if (columnIndex >= columnPositions.length) return false;
    
    const columnX = columnPositions[columnIndex];
    const tolerance = 25;
    
    // Look for marks in this column
    return row.textObjects.some((obj: any) => {
      const centerX = obj.boundingBox.centerX;
      if (Math.abs(centerX - columnX) > tolerance) return false;
      
      const text = obj.text.trim().toUpperCase();
      const markIndicators = ['X', '✓', '●', '■', '▪', '*'];
      
      return markIndicators.some(mark => text.includes(mark)) ||
        (obj.confidence < 0.5 && text.length <= 2); // Low confidence might be a filled bubble
    });
  }

  private parseStatus(statusText: string): string[] {
    const status: string[] = [];
    const upperText = statusText.toUpperCase();
    
    if (upperText.includes('MISSING') || upperText.includes('M')) {
      status.push('Missing');
    }
    if (upperText.includes('ABSENT') || upperText.includes('A')) {
      status.push('Absent');
    }
    if (upperText.includes('EXEMPT') || upperText.includes('E')) {
      status.push('Exempt');
    }
    
    return status;
  }

  private mergeWithStudentData(
    gradeData: ProcessedGrade[],
    students: IStudent[]
  ): ProcessedGrade[] {
    // Ensure we have data for all students
    return students.map((student, index) => {
      const grade = gradeData[index] || {
        studentId: student.studentId,
        studentName: student.getFullName(),
        score: '',
        status: []
      };
      
      // Ensure student info is correct
      grade.studentId = student.studentId;
      grade.studentName = student.getFullName();
      
      return grade;
    });
  }
}

// services/queue.service.ts
import Bull from 'bull';
import { config } from '../config/config';
import { ProcessingJob } from '../models/ProcessingJob';
import { GradeSheet } from '../models/GradeSheet';
import { GradeProcessorService } from './gradeProcessor.service';
import { StorageService } from './storage.service';
import { logger } from '../utils/logger';

export const processingQueue = new Bull('grade-processing', {
  redis: config.redis
});

const gradeProcessor = new GradeProcessorService();
const storageService = new StorageService();

// Process grade sheet images
processingQueue.process('process-grade-sheet', 5, async (job) => {
  const { jobId, imageUrl, gradeSheetId, ocrProvider } = job.data;
  
  try {
    // Update job status
    await ProcessingJob.findByIdAndUpdate(jobId, {
      status: 'processing',
      startedAt: new Date(),
      attempts: { $inc: 1 }
    });
    
    // Download image
    const imageBuffer = await storageService.downloadFile(imageUrl);
    
    // Get grade sheet info
    const gradeSheet = await GradeSheet.findById(gradeSheetId)
      .populate('periodId')
      .populate('assignmentId');
    
    if (!gradeSheet) {
      throw new Error('Grade sheet not found');
    }
    
    // Get students for the period
    const students = await Student.find({
      _id: { $in: gradeSheet.periodId.students }
    }).sort('lastName firstName');
    
    // Process the image
    const results = await gradeProcessor.processGradeSheet(
      imageBuffer,
      students,
      gradeSheet.assignmentId.gradingScale,
      ocrProvider
    );
    
    // Update grade sheet with results
    await GradeSheet.findByIdAndUpdate(gradeSheetId, {
      status: 'completed',
      processedData: results
    });
    
    // Update job
    await ProcessingJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      completedAt: new Date(),
      result: results
    });
    
    logger.info(`Successfully processed grade sheet ${gradeSheetId}`);
    
  } catch (error) {
    logger.error(`Failed to process grade sheet:`, error);
    
    await ProcessingJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error.message
    });
    
    await GradeSheet.findByIdAndUpdate(gradeSheetId, {
      status: 'error'
    });
    
    throw error;
  }
});
