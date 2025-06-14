"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVParserService = void 0;
const sync_1 = require("csv-parse/sync");
class CSVParserService {
    static analyzeCSV(buffer) {
        // Parse CSV
        const records = (0, sync_1.parse)(buffer, {
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true,
            skip_records_with_error: true
        });
        if (records.length < 2) {
            throw new Error('CSV file must contain headers and at least one data row');
        }
        const headers = records[0].map((h) => h.toString().trim());
        const rows = records.slice(1, Math.min(6, records.length)); // First 5 data rows for preview
        // Analyze headers to suggest column mappings
        const suggestions = this.suggestColumns(headers, rows);
        return {
            headers,
            rows,
            suggestions
        };
    }
    static suggestColumns(headers, rows) {
        const suggestions = {};
        headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            // Check for student ID patterns
            if (lowerHeader.includes('student') && lowerHeader.includes('id') ||
                lowerHeader.includes('studentid') ||
                lowerHeader === 'id' ||
                lowerHeader.includes('sis') ||
                lowerHeader.includes('number')) {
                suggestions.studentId = index;
            }
            // Check for first name
            if (lowerHeader.includes('first') && lowerHeader.includes('name') ||
                lowerHeader === 'firstname' ||
                lowerHeader === 'fname') {
                suggestions.firstName = index;
            }
            // Check for last name
            if (lowerHeader.includes('last') && lowerHeader.includes('name') ||
                lowerHeader === 'lastname' ||
                lowerHeader === 'lname' ||
                lowerHeader === 'surname') {
                suggestions.lastName = index;
            }
            // Check for full name
            if (lowerHeader === 'name' ||
                lowerHeader === 'fullname' ||
                lowerHeader.includes('student') && lowerHeader.includes('name') &&
                    !lowerHeader.includes('first') && !lowerHeader.includes('last')) {
                suggestions.fullName = index;
            }
            // Check for email
            if (lowerHeader.includes('email') ||
                lowerHeader.includes('mail')) {
                suggestions.email = index;
            }
        });
        // If no ID column found, check data patterns
        if (suggestions.studentId === undefined) {
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                // Check if column contains ID-like values (numbers or alphanumeric)
                const isLikelyId = rows.every(row => {
                    const value = row[colIndex]?.toString().trim();
                    return value && /^[A-Z0-9\-]+$/i.test(value) && value.length > 3;
                });
                if (isLikelyId) {
                    suggestions.studentId = colIndex;
                    break;
                }
            }
        }
        return suggestions;
    }
    static parseWithMapping(buffer, mapping) {
        const records = (0, sync_1.parse)(buffer, {
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true
        });
        const students = [];
        for (let i = 1; i < records.length; i++) {
            const row = records[i];
            // Extract student ID (required)
            const studentId = row[mapping.studentId]?.toString().trim();
            if (!studentId)
                continue;
            // Extract name
            let firstName = '';
            let lastName = '';
            if (mapping.fullName !== undefined) {
                // Split full name
                const fullName = row[mapping.fullName]?.toString().trim() || '';
                const nameParts = fullName.split(/\s+/);
                if (nameParts.length >= 2) {
                    firstName = nameParts[0];
                    lastName = nameParts.slice(1).join(' ');
                }
                else {
                    firstName = fullName;
                }
            }
            else {
                firstName = row[mapping.firstName || -1]?.toString().trim() || '';
                lastName = row[mapping.lastName || -1]?.toString().trim() || '';
            }
            // Extract email (optional)
            const email = mapping.email !== undefined ?
                row[mapping.email]?.toString().trim() : undefined;
            if (firstName || lastName) {
                students.push({
                    studentId,
                    firstName,
                    lastName,
                    email
                });
            }
        }
        return students;
    }
}
exports.CSVParserService = CSVParserService;
//# sourceMappingURL=csvParser.js.map