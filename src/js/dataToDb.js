import { CSVProcessor } from './csvReader.js';

export class DataToDb {
  constructor() {
    this.labels = {};  // Object to store label data
    this.labelIdCounter = 1;
    this.csvProcessor = new CSVProcessor();
  }

  /**
   * Processes a CSV file and populates the labels object based on specified column names
   * @param {File} file - The CSV file to process
   * @param {Array} labelColumns - Array of column names to use as labels
   * @returns {Promise} A promise that resolves when processing is complete
   */
  async processCSVFile(file, labelColumns) {
    try {
      // Read the CSV file using CSVProcessor
      const { rows } = await this.csvProcessor.readCSV(file);

      // Process the data
      this.processCSVData(rows, labelColumns);

      return {
        success: true,
        message: 'CSV file processed successfully',
        labels: this.labels
      };
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw error;
    }
  }

  /**
   * Processes CSV data and populates the labels object based on specified column names
   * @param {Array} csvData - The CSV data array containing objects with column values
   * @param {Array} labelColumns - Array of column names to use as labels
   */
  processCSVData(csvData, labelColumns) {
    if (!Array.isArray(csvData) || !Array.isArray(labelColumns)) {
      throw new Error('Invalid input: csvData and labelColumns must be arrays');
    }

    // Clear existing labels
    this.labels = {};
    this.labelIdCounter = 1;

    // Process each row in the CSV data
    csvData.forEach(row => {
      const labelData = {};

      // Extract values for specified label columns
      labelColumns.forEach(column => {
        if (row[column] !== undefined) {
          labelData[column] = row[column];
        }
      });

      // Only add label if we have data
      if (Object.keys(labelData).length > 0) {
        const labelId = this.labelIdCounter++;
        this.labels[labelId] = {
          id: labelId,
          ...labelData
        };
      }
    });
  }

  /**
   * Get all labels
   * @returns {Object} The labels object
   */
  getLabels() {
    return this.labels;
  }

  /**
   * Get a specific label by ID
   * @param {number} id - The label ID
   * @returns {Object|null} The label object or null if not found
   */
  getLabelById(id) {
    return this.labels[id] || null;
  }
}

labels: { category: asfkjd, description: ksjahf, cateId: 1 }

table.lables.categoy