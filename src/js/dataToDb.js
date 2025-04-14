import { CSVProcessor } from './csvReader.js';

export class DataToDb {
  constructor() {
    // Storage for database tables
    this.tables = {
      labels: {},          // Category and Description pairs
      columnValues: {},    // Unique values for each column
      relationships: [],   // Matrix of relationships using IDs
      foreignKeys: {},     // Track foreign key relationships
      warrantyRanges: {    // Store warranty ranges
        parsed: {          // Original parsed data
          columns: {},     // Columns containing warranty ranges
          rangeGroups: {}, // Groups of ranges
          foreignKeys: new Set()
        },
        formatted: []      // Data in the final desired format
      }
    };
    this.labelColumns = ['Category', 'Description'];
    this.csvProcessor = new CSVProcessor();
  }

  /**
   * Processes a CSV file and creates the required data structures
   * @param {File} file - The CSV file to process
   * @returns {Promise} A promise that resolves when processing is complete
   */
  async processCSVFile(file) {
    try {
      const csvProcessor = new CSVProcessor();
      const { headers, rows } = await csvProcessor.readCSV(file);

      // Filter out the "All Future Categories" row
      const filteredRows = rows.filter(row => row['Category'] !== '(All Future Categories)');

      // Initialize column values tables (excluding label columns)
      headers.forEach(header => {
        if (!this.labelColumns.includes(header)) {
          this.tables.columnValues[header] = {
            1: {
              id: 1,
              value: 'N/A'
            }
          };
          // Initialize foreign key tracking
          this.tables.foreignKeys[header] = {
            tableName: header,
            references: new Set()  // Will store category IDs that reference this value
          };
        }
      });

      // First pass: collect all unique values for each column
      const uniqueValues = {};
      headers.forEach(header => {
        if (!this.labelColumns.includes(header)) {
          uniqueValues[header] = new Set(['N/A']);
          filteredRows.forEach(row => {
            if (row[header] && row[header] !== 'N/A') {
              uniqueValues[header].add(row[header]);
            }
          });
        }
      });

      // Create column value tables with sequential IDs
      Object.entries(uniqueValues).forEach(([header, values]) => {
        let nextId = 2;  // Start from 2 since 1 is N/A
        values.forEach(value => {
          if (value !== 'N/A') {
            this.tables.columnValues[header][nextId] = {
              id: nextId,
              value: value
            };
            nextId++;
          }
        });
      });

      // Create reverse lookup for faster processing
      const reverseLookup = {};
      Object.entries(this.tables.columnValues).forEach(([header, values]) => {
        reverseLookup[header] = {};
        Object.values(values).forEach(entry => {
          reverseLookup[header][entry.value] = entry.id;
        });
      });

      // Second pass: create labels and relationships
      let labelId = 1;
      filteredRows.forEach(row => {
        // Create label entry
        this.tables.labels[labelId] = {
          id: labelId,
          category: row['Category'],
          description: row['Description']
        };

        // Create relationship entries and track foreign keys
        const relationship = {
          labelId: labelId
        };

        headers.forEach(header => {
          if (!this.labelColumns.includes(header)) {
            const value = row[header] || 'N/A';
            const valueId = reverseLookup[header][value];
            relationship[header] = valueId;

            // Track foreign key relationship
            this.tables.foreignKeys[header].references.add(labelId);
          }
        });

        this.tables.relationships.push(relationship);
        labelId++;
      });

      // Convert Sets to Arrays for JSON serialization
      Object.values(this.tables.foreignKeys).forEach(fk => {
        fk.references = Array.from(fk.references);
      });

      return {
        success: true,
        tables: this.tables
      };
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw error;
    }
  }

  /**
   * Gets the data in a format suitable for table rendering
   * @returns {Object} Object containing different table views
   */
  getTableData() {
    return {
      labels: this.getLabelTableData(),
      columnValues: this.getColumnValuesTableData(),
      relationships: this.getRelationshipTableData()
    };
  }

  /**
   * Gets label table data
   * @private
   */
  getLabelTableData() {
    const headers = ['ID', 'Category', 'Description'];
    const rows = Object.values(this.tables.labels).map(label => ({
      'ID': label.id,
      'Category': label.category,
      'Description': label.description
    }));

    return { headers, rows };
  }

  /**
   * Gets column values table data with associated categories
   * @private
   */
  getColumnValuesTableData() {
    return Object.entries(this.tables.columnValues).map(([header, values]) => ({
      title: `${header} Values`,
      headers: ['ID', 'Value'],
      rows: Object.values(values).map(entry => ({
        'ID': entry.id,
        'Value': entry.value
      }))
    }));
  }

  /**
   * Gets relationship table data
   * @private
   */
  getRelationshipTableData() {
    const headers = ['Label ID', ...Object.keys(this.tables.columnValues)];
    const rows = this.tables.relationships.map(rel => {
      const row = { 'Label ID': rel.labelId };
      headers.slice(1).forEach(header => {
        row[header] = rel[header];
      });
      return row;
    });

    return { headers, rows };
  }

  /**
   * Save tables to localStorage for later use
   */
  saveTables() {
    localStorage.setItem('warrantyTables', JSON.stringify(this.tables));
  }

  /**
   * Load tables from localStorage
   * @returns {boolean} Whether tables were successfully loaded
   */
  loadTables() {
    const saved = localStorage.getItem('warrantyTables');
    if (saved) {
      this.tables = JSON.parse(saved);
      return true;
    }
    return false;
  }

  /**
   * Prints the processed data to the console
   */
  printResults() {
    console.log('Labels Table:');
    console.log(JSON.stringify(this.tables.labels, null, 2));

    console.log('\nColumn Value Tables:');
    Object.entries(this.tables.columnValues).forEach(([header, values]) => {
      console.log(`\n${header} Values:`);
      console.log(JSON.stringify(values, null, 2));
    });

    console.log('\nForeign Key Relationships:');
    console.log(JSON.stringify(this.tables.foreignKeys, null, 2));

    console.log('\nRelationships Table (with Value IDs):');
    console.log(JSON.stringify(this.tables.relationships, null, 2));
  }

  /**
   * SQL-like query methods
   */

  /**
   * Performs a SELECT-like query on the data
   * @param {Object} options Query options
   * @param {string[]} options.select Columns to select
   * @param {Object} options.where Conditions for filtering
   * @param {string[]} options.groupBy Columns to group by
   * @param {Object} options.having Conditions for groups
   * @param {string} options.orderBy Column to sort by
   * @param {boolean} options.desc Sort in descending order
   * @returns {Array} Query results
   */
  query(options = {}) {
    const {
      select = ['*'],
      where = {},
      groupBy = [],
      having = {},
      orderBy,
      desc = false
    } = options;

    // Start with relationships as base data
    let results = [...this.tables.relationships];

    // Apply WHERE conditions
    if (Object.keys(where).length > 0) {
      results = this._applyWhere(results, where);
    }

    // Handle SELECT
    if (select[0] !== '*') {
      results = this._applySelect(results, select);
    }

    // Apply GROUP BY
    if (groupBy.length > 0) {
      results = this._applyGroupBy(results, groupBy, having);
    }

    // Apply ORDER BY
    if (orderBy) {
      results = this._applyOrderBy(results, orderBy, desc);
    }

    return results;
  }

  /**
   * Find categories by column value
   * @param {string} column Column name
   * @param {string|number} value Value to search for
   * @returns {Array} Matching categories
   */
  findCategoriesByValue(column, value) {
    const valueId = this._getValueIdByValue(column, value);
    if (!valueId) return [];

    // Get all relationships where this column has this value
    const matchingRelationships = this.tables.relationships.filter(
      rel => rel[column] === valueId
    );

    // Map to category objects
    return matchingRelationships.map(rel => this.tables.labels[rel.labelId]);
  }

  /**
   * Find values by category
   * @param {string} categoryName Category to search for
   * @param {string} column Column to search in
   * @returns {Array} Matching values
   */
  findValuesByCategory(categoryName, column) {
    // Find category IDs matching the name
    const categoryIds = Object.values(this.tables.labels)
      .filter(label => label.category === categoryName)
      .map(label => label.id);

    // Get relationships for these categories
    const valueIds = new Set(
      this.tables.relationships
        .filter(rel => categoryIds.includes(rel.labelId))
        .map(rel => rel[column])
    );

    // Map to value objects
    return Array.from(valueIds).map(id => this.tables.columnValues[column][id]);
  }

  /**
   * Group values by category
   * @param {string} column Column to group
   * @returns {Object} Values grouped by category
   */
  groupValuesByCategory(column) {
    const groups = {};

    Object.values(this.tables.labels).forEach(label => {
      groups[label.category] = this.findValuesByCategory(label.category, column);
    });

    return groups;
  }

  /**
   * Apply WHERE conditions to results
   * @private
   */
  _applyWhere(results, conditions) {
    return results.filter(row => {
      return Object.entries(conditions).every(([column, condition]) => {
        if (typeof condition === 'object') {
          const { operator, value } = condition;
          switch (operator) {
            case 'eq': return row[column] === value;
            case 'neq': return row[column] !== value;
            case 'gt': return row[column] > value;
            case 'lt': return row[column] < value;
            case 'gte': return row[column] >= value;
            case 'lte': return row[column] <= value;
            case 'in': return value.includes(row[column]);
            case 'like':
              const pattern = new RegExp(value.replace('%', '.*'));
              return pattern.test(this._getValueFromId(column, row[column]));
            default: return true;
          }
        }
        return row[column] === condition;
      });
    });
  }

  /**
   * Apply SELECT to results
   * @private
   */
  _applySelect(results, columns) {
    return results.map(row => {
      const selected = {};
      columns.forEach(col => {
        if (col.includes(' as ')) {
          const [original, alias] = col.split(' as ');
          selected[alias.trim()] = row[original.trim()];
        } else {
          selected[col] = row[col];
        }
      });
      return selected;
    });
  }

  /**
   * Apply GROUP BY to results
   * @private
   */
  _applyGroupBy(results, groupColumns, having) {
    const groups = {};

    results.forEach(row => {
      const groupKey = groupColumns.map(col => row[col]).join('_');
      if (!groups[groupKey]) {
        groups[groupKey] = {
          group: groupColumns.reduce((acc, col) => ({
            ...acc,
            [col]: row[col]
          }), {}),
          rows: []
        };
      }
      groups[groupKey].rows.push(row);
    });

    let groupedResults = Object.values(groups).map(({ group, rows }) => ({
      ...group,
      count: rows.length,
      // Add any aggregate functions here
      sum: this._calculateAggregates(rows, 'sum'),
      avg: this._calculateAggregates(rows, 'avg'),
      min: this._calculateAggregates(rows, 'min'),
      max: this._calculateAggregates(rows, 'max')
    }));

    // Apply HAVING conditions
    if (Object.keys(having).length > 0) {
      groupedResults = this._applyHaving(groupedResults, having);
    }

    return groupedResults;
  }

  /**
   * Apply ORDER BY to results
   * @private
   */
  _applyOrderBy(results, column, desc = false) {
    return [...results].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (desc) {
        return valueB - valueA;
      }
      return valueA - valueB;
    });
  }

  /**
   * Calculate aggregates for grouped results
   * @private
   */
  _calculateAggregates(rows, type) {
    const numerics = rows.filter(row =>
      Object.values(row).some(val => typeof val === 'number')
    );

    if (numerics.length === 0) return null;

    const values = numerics.map(row =>
      Object.values(row).find(val => typeof val === 'number')
    );

    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return null;
    }
  }

  /**
   * Apply HAVING conditions to grouped results
   * @private
   */
  _applyHaving(results, conditions) {
    return results.filter(group => {
      return Object.entries(conditions).every(([key, condition]) => {
        if (typeof condition === 'object') {
          const { operator, value } = condition;
          switch (operator) {
            case 'eq': return group[key] === value;
            case 'gt': return group[key] > value;
            case 'lt': return group[key] < value;
            case 'gte': return group[key] >= value;
            case 'lte': return group[key] <= value;
            default: return true;
          }
        }
        return group[key] === condition;
      });
    });
  }

  /**
   * Get actual value from ID for a given column
   * @private
   */
  _getValueFromId(column, id) {
    return this.tables.columnValues[column]?.[id]?.value ?? id;
  }

  /**
   * Helper to get value ID by actual value
   * @private
   */
  _getValueIdByValue(column, value) {
    const entry = Object.values(this.tables.columnValues[column])
      .find(v => v.value === value);
    return entry ? entry.id : null;
  }

  /**
   * Extracts warranty ranges from WARRANTY columns
   * @returns {Object} Processed warranty ranges
   */
  extractWarrantyRanges() {
    let nextColumnId = 1;
    let nextGroupId = 1;
    let nextRangeId = 1;

    const warrantyColumns = Object.keys(this.tables.columnValues)
      .filter(header => header.toUpperCase().includes('WARRANTY'));

    console.log('Found WARRANTY columns:', warrantyColumns);

    // Reset warranty ranges
    this.tables.warrantyRanges.parsed = {
      columns: {},
      rangeGroups: {},
      foreignKeys: new Set()
    };

    warrantyColumns.forEach(column => {
      console.log(`\nProcessing column: ${column}`);

      // Create column entry
      const columnId = nextColumnId++;
      this.tables.warrantyRanges.parsed.columns[columnId] = {
        id: columnId,
        name: column,
        groups: new Set()
      };

      // Get all values from this warranty column
      Object.values(this.tables.columnValues[column]).forEach(valueEntry => {
        if (valueEntry.value === 'N/A') return;

        console.log(`\n  Processing value: ${valueEntry.value}`);

        // Parse the formula in groups of 3
        const rangeGroups = this.csvProcessor.parseFormulaInGroups(valueEntry.value, 3);
        if (rangeGroups.length === 0) {
          console.log('  No valid ranges found in value');
          return;
        }

        // Create a new group for this set of ranges
        const groupId = nextGroupId++;
        const group = {
          id: groupId,
          columnId: columnId,
          foreignKeyId: valueEntry.id,
          ranges: {}
        };

        // Process each group of three values
        rangeGroups.forEach(rangeSet => {
          const rangeId = nextRangeId++;
          group.ranges[rangeId] = {
            id: rangeId,
            low: rangeSet[0].value,
            high: rangeSet[1].value,
            price: rangeSet[2].value,
            originalParts: rangeSet.map(r => r.original)
          };

          console.log(`  Created Range ${rangeId}:`, {
            low: `$${rangeSet[0].value.toLocaleString()}`,
            high: `$${rangeSet[1].value.toLocaleString()}`,
            price: `$${rangeSet[2].value.toLocaleString()}`
          });
        });

        // Add group if it has ranges
        if (Object.keys(group.ranges).length > 0) {
          this.tables.warrantyRanges.parsed.rangeGroups[groupId] = group;
          this.tables.warrantyRanges.parsed.columns[columnId].groups.add(groupId);
          this.tables.warrantyRanges.parsed.foreignKeys.add(valueEntry.id);
        }
      });

      // Convert groups Set to Array
      this.tables.warrantyRanges.parsed.columns[columnId].groups =
        Array.from(this.tables.warrantyRanges.parsed.columns[columnId].groups);
    });

    // Convert Sets to Arrays for consistency
    this.tables.warrantyRanges.parsed.foreignKeys =
      Array.from(this.tables.warrantyRanges.parsed.foreignKeys);

    // Transform to the desired format
    this.transformWarrantyRanges();

    // Log both structures
    console.log('\nParsed Warranty Ranges:');
    console.log(JSON.stringify(this.tables.warrantyRanges.parsed, null, 2));

    console.log('\nFormatted Warranty Ranges:');
    console.log(JSON.stringify(this.tables.warrantyRanges.formatted, null, 2));

    return this.tables.warrantyRanges;
  }

  /**
   * Transforms parsed warranty ranges into the desired format
   * @private
   */
  transformWarrantyRanges() {
    this.tables.warrantyRanges.formatted = [];

    // Transform each group into the new format
    Object.values(this.tables.warrantyRanges.parsed.rangeGroups).forEach(group => {
      const columnName = this.tables.warrantyRanges.parsed.columns[group.columnId].name;

      const formattedRange = {
        id: group.id, // Add unique group ID
        source: {
          'warranty-id': columnName,
          'value-id': group.foreignKeyId
        },
        ranges: {}
      };

      // Transform ranges, starting from 1 for each group
      Object.values(group.ranges).forEach((range, index) => {
        const rangeNumber = index + 1;
        formattedRange.ranges[`range-${rangeNumber}`] = {
          id: rangeNumber,
          low: range.low,
          high: range.high,
          price: range.price
        };
      });

      this.tables.warrantyRanges.formatted.push(formattedRange);
    });
  }

  /**
   * Gets warranty ranges table data for display
   * @returns {Object} Formatted table data
   */
  getWarrantyRangesTableData() {
    const headers = ['Group ID', 'Warranty ID', 'Value ID', 'Range ID', 'Low', 'High', 'Price'];
    const rows = [];

    this.tables.warrantyRanges.formatted.forEach(warrantyRange => {
      Object.entries(warrantyRange.ranges).forEach(([rangeKey, range]) => {
        rows.push({
          'Group ID': warrantyRange.id,
          'Warranty ID': warrantyRange.source['warranty-id'],
          'Value ID': warrantyRange.source['value-id'],
          'Range ID': range.id,
          'Low': `$${range.low.toLocaleString()}`,
          'High': `$${range.high.toLocaleString()}`,
          'Price': `$${range.price.toLocaleString()}`
        });
      });
    });

    return { headers, rows };
  }
}