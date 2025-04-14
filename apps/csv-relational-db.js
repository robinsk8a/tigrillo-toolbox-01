class CSVRelationalDB {
    constructor() {
        this.tables = new Map();
        this.relationships = new Map();
        this.valueMappings = new Map();
    }

    /**
     * Loads a CSV file and creates normalized tables from it
     * @param {string} name - Name of the table
     * @param {string} csvContent - Raw CSV content
     * @returns {Promise<void>}
     */
    async loadTable(name, csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const table = {
            headers,
            rows: lines.slice(1).map(line => {
                const values = this.parseCSVLine(line);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index]?.trim() || '';
                });
                return row;
            })
        };
        
        // Create normalized tables for all columns
        await this.createNormalizedTables(name, table);
        
        this.tables.set(name, table);
    }

    /**
     * Creates normalized tables for all columns
     * @param {string} mainTableName - Name of the main table
     * @param {Object} mainTable - The main table object
     */
    async createNormalizedTables(mainTableName, mainTable) {
        // Create a mapping for each column
        const columnMappings = new Map();
        
        // Create a unified values table
        const unifiedValuesTable = {
            headers: ['id', 'table_name', 'column_name', 'value'],
            rows: []
        };

        let valueId = 1;

        // Process each column
        mainTable.headers.forEach(header => {
            if (header === 'Category' || header === 'Description') {
                // Skip these as they're handled separately
                return;
            }

            const valueMap = new Map();

            // Process each row for this column
            mainTable.rows.forEach((row, rowIndex) => {
                const value = row[header];
                
                // Skip empty values but keep NaN
                if (value === '' || value === null || value === undefined) {
                    return;
                }

                const key = value;

                // Regular value
                if (!valueMap.has(key)) {
                    valueMap.set(key, valueId);
                    unifiedValuesTable.rows.push({
                        id: valueId.toString(),
                        table_name: mainTableName,
                        column_name: header,
                        value: value
                    });
                    valueId++;
                }

                // Replace the value with its ID in the main table
                const columnId = `${header.toLowerCase()}_id`;
                mainTable.rows[rowIndex][columnId] = valueMap.get(key).toString();
                delete mainTable.rows[rowIndex][header];
            });

            // Update main table headers
            const columnId = `${header.toLowerCase()}_id`;
            if (!mainTable.headers.includes(columnId)) {
                mainTable.headers.push(columnId);
            }
            mainTable.headers = mainTable.headers.filter(h => h !== header);

            // Store the relationship
            this.relationships.set(`${mainTableName}.${header}`, {
                type: 'one-to-many',
                foreignTable: 'unified_values',
                foreignKey: columnId,
                primaryKey: 'id',
                originalColumn: header
            });

            columnMappings.set(header, {
                valueMap
            });
        });

        // Store the unified tables
        this.tables.set('unified_values', unifiedValuesTable);

        this.valueMappings.set(mainTableName, columnMappings);
    }

    parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let inParentheses = false;
        let parenthesesCount = 0;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '(') {
                inParentheses = true;
                parenthesesCount++;
                currentValue += char;
            } else if (char === ')') {
                parenthesesCount--;
                if (parenthesesCount === 0) {
                    inParentheses = false;
                }
                currentValue += char;
            } else if (char === ',' && !inParentheses) {
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Add the last value
        if (currentValue !== '') {
            values.push(currentValue);
        }

        return values;
    }

    getOriginalValue(mainTableName, column, id) {
        const valuesTable = this.tables.get(`${mainTableName}_${column.toLowerCase()}_values`);
        if (!valuesTable) return '';

        const valueRow = valuesTable.rows.find(row => row.id === id);
        return valueRow ? valueRow.value : '';
    }

    getAllRowsWithOriginalValues(mainTableName) {
        const mainTable = this.tables.get(mainTableName);
        if (!mainTable) return [];

        return mainTable.rows.map(row => {
            const result = { ...row };
            
            // Get all relationships for this table
            for (const [key, relationship] of this.relationships.entries()) {
                if (key.startsWith(`${mainTableName}.`)) {
                    const column = relationship.originalColumn;
                    const id = row[`${column.toLowerCase()}_id`];
                    if (id) {
                        result[column] = this.getOriginalValue(mainTableName, column, id);
                    }
                }
            }

            return result;
        });
    }

    getRowsByValue(mainTableName, column, value) {
        const mainTable = this.tables.get(mainTableName);
        const valuesTable = this.tables.get(`${mainTableName}_${column.toLowerCase()}_values`);
        if (!mainTable || !valuesTable) return [];

        // Find the ID for the value
        const valueRow = valuesTable.rows.find(row => row.value === value);
        if (!valueRow) return [];

        // Filter main table rows by the ID
        const filteredRows = mainTable.rows.filter(row => 
            row[`${column.toLowerCase()}_id`] === valueRow.id
        );

        // Return rows with original values
        return this.getAllRowsWithOriginalValues(mainTableName).filter(row => 
            filteredRows.some(filteredRow => 
                Object.keys(filteredRow).every(key => 
                    filteredRow[key] === row[`${key.toLowerCase()}_id`]
                )
            )
        );
    }

    /**
     * Creates a separate categories table and establishes relationship with main table
     * @param {string} mainTableName - Name of the main table
     * @param {Object} mainTable - The main table object
     */
    async createCategoriesTable(mainTableName, mainTable) {
        // Create categories table
        const categoriesTable = {
            headers: ['id', 'Category', 'Description'],
            rows: []
        };

        // Create a map to track unique category-description pairs
        const categoryMap = new Map();
        let id = 1;

        // Process each row in the main table
        mainTable.rows.forEach((row, index) => {
            const category = row['Category'];
            const description = row['Description'];
            const key = `${category}-${description}`;

            if (!categoryMap.has(key)) {
                categoryMap.set(key, id);
                categoriesTable.rows.push({
                    id: id.toString(),
                    Category: category,
                    Description: description
                });
                id++;
            }

            // Replace Category and Description with category_id
            mainTable.rows[index]['category_id'] = categoryMap.get(key).toString();
            delete mainTable.rows[index]['Category'];
            delete mainTable.rows[index]['Description'];
        });

        // Update main table headers
        mainTable.headers = mainTable.headers.filter(h => h !== 'Category' && h !== 'Description');
        if (!mainTable.headers.includes('category_id')) {
            mainTable.headers.push('category_id');
        }

        // Store the categories table
        this.tables.set(`${mainTableName}_categories`, categoriesTable);

        // Store the relationship
        this.relationships.set(mainTableName, {
            type: 'one-to-many',
            foreignTable: `${mainTableName}_categories`,
            foreignKey: 'category_id',
            primaryKey: 'id'
        });
    }

    /**
     * Gets related categories for a main table
     * @param {string} mainTableName - Name of the main table
     * @returns {Array} Array of categories with their IDs
     */
    getCategories(mainTableName) {
        const categoriesTableName = `${mainTableName}_categories`;
        const categoriesTable = this.tables.get(categoriesTableName);
        if (!categoriesTable) return [];

        return categoriesTable.rows;
    }

    /**
     * Gets rows from main table filtered by category
     * @param {string} mainTableName - Name of the main table
     * @param {string} categoryId - ID of the category to filter by
     * @returns {Array} Filtered rows
     */
    getRowsByCategory(mainTableName, categoryId) {
        const mainTable = this.tables.get(mainTableName);
        const categoriesTable = this.tables.get(`${mainTableName}_categories`);
        if (!mainTable || !categoriesTable) return [];

        const filteredRows = mainTable.rows.filter(row => row.category_id === categoryId);
        
        // Join with categories table to get Category and Description
        return filteredRows.map(row => {
            const category = categoriesTable.rows.find(cat => cat.id === row.category_id);
            return {
                ...row,
                Category: category?.Category || '',
                Description: category?.Description || ''
            };
        });
    }

    /**
     * Gets all rows from main table with joined category information
     * @param {string} mainTableName - Name of the main table
     * @returns {Array} All rows with category information
     */
    getAllRowsWithCategories(mainTableName) {
        const mainTable = this.tables.get(mainTableName);
        const categoriesTable = this.tables.get(`${mainTableName}_categories`);
        if (!mainTable || !categoriesTable) return [];

        return mainTable.rows.map(row => {
            const category = categoriesTable.rows.find(cat => cat.id === row.category_id);
            return {
                ...row,
                Category: category?.Category || '',
                Description: category?.Description || ''
            };
        });
    }

    /**
     * Performs a SELECT query on a table
     * @param {string} tableName - Name of the table to query
     * @param {string[]} columns - Array of column names to select
     * @param {function} where - Optional filter function
     * @returns {Array} Array of matching rows
     */
    select(tableName, columns = ['*'], where = null) {
        const table = this.tables.get(tableName);
        if (!table) throw new Error(`Table ${tableName} not found`);

        let results = table.rows;
        
        if (where) {
            results = results.filter(where);
        }

        if (columns[0] !== '*') {
            results = results.map(row => {
                const selectedRow = {};
                columns.forEach(col => {
                    if (table.headers.includes(col)) {
                        selectedRow[col] = row[col];
                    }
                });
                return selectedRow;
            });
        }

        return results;
    }

    /**
     * Performs a JOIN operation between two tables
     * @param {string} table1 - Name of the first table
     * @param {string} table2 - Name of the second table
     * @param {string} joinColumn - Column to join on
     * @param {string} joinType - Type of join ('INNER', 'LEFT', 'RIGHT')
     * @returns {Array} Array of joined rows
     */
    join(table1, table2, joinColumn, joinType = 'INNER') {
        const t1 = this.tables.get(table1);
        const t2 = this.tables.get(table2);
        if (!t1 || !t2) throw new Error('One or both tables not found');

        const result = [];
        
        t1.rows.forEach(row1 => {
            const matches = t2.rows.filter(row2 => row1[joinColumn] === row2[joinColumn]);
            
            if (matches.length > 0) {
                matches.forEach(match => {
                    result.push({ ...row1, ...match });
                });
            } else if (joinType === 'LEFT') {
                result.push({ ...row1 });
            }
        });

        if (joinType === 'RIGHT') {
            t2.rows.forEach(row2 => {
                const hasMatch = t1.rows.some(row1 => row1[joinColumn] === row2[joinColumn]);
                if (!hasMatch) {
                    result.push({ ...row2 });
                }
            });
        }

        return result;
    }

    /**
     * Groups rows by a specific column and applies an aggregate function
     * @param {string} tableName - Name of the table
     * @param {string} groupBy - Column to group by
     * @param {string} aggregateColumn - Column to aggregate
     * @param {string} operation - Operation to perform ('SUM', 'COUNT', 'AVG', 'MAX', 'MIN')
     * @returns {Object} Grouped results
     */
    groupBy(tableName, groupBy, aggregateColumn, operation = 'COUNT') {
        const table = this.tables.get(tableName);
        if (!table) throw new Error(`Table ${tableName} not found`);

        const groups = {};
        
        table.rows.forEach(row => {
            const groupKey = row[groupBy];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(row[aggregateColumn]);
        });

        const result = {};
        Object.entries(groups).forEach(([key, values]) => {
            switch (operation.toUpperCase()) {
                case 'SUM':
                    result[key] = values.reduce((a, b) => a + Number(b), 0);
                    break;
                case 'COUNT':
                    result[key] = values.length;
                    break;
                case 'AVG':
                    result[key] = values.reduce((a, b) => a + Number(b), 0) / values.length;
                    break;
                case 'MAX':
                    result[key] = Math.max(...values.map(v => Number(v)));
                    break;
                case 'MIN':
                    result[key] = Math.min(...values.map(v => Number(v)));
                    break;
            }
        });

        return result;
    }
}

// Export the class for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVRelationalDB;
} 