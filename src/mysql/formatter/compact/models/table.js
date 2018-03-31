/* eslint max-lines: 0 */
const Column = require('./column');
const FulltextIndex = require('./fulltext-index');
const SpatialIndex = require('./spatial-index');
const PrimaryKey = require('./primary-key');
const ForeignKey = require('./foreign-key');
const UniqueKey = require('./unique-key');
const Index = require('./index');
const TableOptions = require('./table-options');

const utils = require('../../../../shared/utils');

/**
 * Class to represent a table as parsed from SQL.
 */
class Table {

  /**
   * Creates a table from a JSON def.
   *
   * @param {any} json JSON format parsed from SQL.
   * @param {Database} database Database to assign table to.
   * @returns {Table} Created table.
   */
  static fromCommonDef(json, database) {
    if (json.id === 'P_CREATE_TABLE_COMMON') {

      json = json.def;

      const table = new Table();
      table.database = database;
      table.name = json.table;

      if (json.tableOptions) {
        table.options = TableOptions.fromDef(json.tableOptions);
      }

      const P_CREATE_TABLE_CREATE_DEFINITIONS = json.columnsDef.def;

      P_CREATE_TABLE_CREATE_DEFINITIONS.forEach(O_CREATE_TABLE_CREATE_DEFINITION => {

        /**
         * If table create definition is about adding a column.
         */
        if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.column)) {
          const column = Column.fromDef(O_CREATE_TABLE_CREATE_DEFINITION);
          table.addColumn(column);
        }

        /**
         * If table create definition is about adding a fulltext index.
         */
        else if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.fulltextIndex)) {
          table.pushFulltextIndex(
            FulltextIndex.fromDef(O_CREATE_TABLE_CREATE_DEFINITION)
          );
        }

        /**
         * If table create definition is about adding a spatial index.
         */
        else if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.spatialIndex)) {
          table.pushSpatialIndex(
            SpatialIndex.fromDef(O_CREATE_TABLE_CREATE_DEFINITION)
          );
        }

        /**
         * If table create definition is about adding a foreign key.
         */
        else if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.foreignKey)) {
          table.pushForeignKey(
            ForeignKey.fromDef(O_CREATE_TABLE_CREATE_DEFINITION)
          );
        }

        /**
         * If table create definition is about adding an unique key.
         */
        else if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.uniqueKey)) {
          table.pushUniqueKey(
            UniqueKey.fromDef(O_CREATE_TABLE_CREATE_DEFINITION)
          );
        }

        /**
         * If table create definition is about adding a primary key.
         */
        else if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.primaryKey)) {
          table.primaryKey = PrimaryKey.fromDef(O_CREATE_TABLE_CREATE_DEFINITION);
        }

        /**
         * If table create definition is about adding an index.
         */
        else if (utils.isDefined(O_CREATE_TABLE_CREATE_DEFINITION.def.index)) {
          table.pushIndex(
            Index.fromDef(O_CREATE_TABLE_CREATE_DEFINITION)
          );
        }
      });

      return table;
    }
  }

  /**
   * Creates a table from a JSON def.
   *
   * @param {any} json JSON format parsed from SQL.
   * @param {Table[]} tables Already existing tables.
   * @returns {Table} Created table.
   */
  static fromAlikeDef(json, tables) {
    if (json.id === 'P_CREATE_TABLE_LIKE') {
      json = json.def;

      if (!tables) {
        tables = [];
      }

      const alikeTable = tables.find(t => t.name === json.like);

      if (!alikeTable) {
        // throw new Error(`Trying to "CREATE TABLE LIKE" unexisting table ${json.like}.`);
        return;
      }

      const table = alikeTable.clone();
      table.name = json.table;
      return table;
    }

    throw new TypeError(`Unknown json id to build table from: ${json.id}`);
  }

  /**
   * Table constructor.
   */
  constructor() {

    /**
     * @type {Database}
     */
    this.database = undefined;

    /**
     * Table name.
     * @type {string}
     */
    this.name = undefined;

    /**
     * Table columns.
     * @type {Column[]}
     */
    this.columns = [];

    /**
     * Table options.
     * @type {TableOptions}
     */
    this.options = undefined;

    /**
     * Fulltext indexes.
     * @type {FulltextIndex[]}
     */
    this.fulltextIndexes = [];

    /**
     * Spatial indexes.
     * @type {SpatialIndex[]}
     */
    this.spatialIndexes = [];

    /**
     * Foreign keys.
     * @type {ForeignKey[]}
     */
    this.foreignKeys = [];

    /**
     * Unique keys.
     * @type {UniqueKey[]}
     */
    this.uniqueKeys = [];

    /**
     * Indexes.
     * @type {Index[]}
     */
    this.indexes = [];

    /**
     * Primary key.
     * @type {PrimaryKey}
     */
    this.primaryKey = undefined;
  }

  /**
   * JSON casting of this object calls this method.
   *
   * @returns {any} JSON format.
   */
  toJSON() {
    const json = {
      name: this.name,
      columns: this.columns.map(c => c.toJSON())
    };

    if (utils.isDefined(this.primaryKey)) { json.primaryKey      = this.primaryKey.toJSON(); }
    if (this.foreignKeys.length)          { json.foreignKeys     = this.foreignKeys.map(k => k.toJSON()); }
    if (this.uniqueKeys.length)           { json.uniqueKeys      = this.uniqueKeys.map(k => k.toJSON()); }
    if (this.indexes.length)              { json.indexes         = this.indexes.map(i => i.toJSON()); }
    if (this.spatialIndexes.length)       { json.spatialIndexes  = this.spatialIndexes.map(i => i.toJSON()); }
    if (this.fulltextIndexes.length)      { json.fulltextIndexes = this.fulltextIndexes.map(i => i.toJSON()); }
    if (utils.isDefined(this.options))    { json.options         = this.options.toJSON(); }

    return json;
  }

  /**
   * Create a deep clone of this model.
   *
   * @returns {Table} Clone.
   */
  clone() {
    const table = new Table();
    table.database = this.database;
    table.name = this.name;
    table.columns = this.columns.map(c => c.clone());

    if (utils.isDefined(this.options)) {
      table.options = this.options.clone();
    }

    if (utils.isDefined(this.primaryKey)) {
      table.primaryKey = this.primaryKey.clone();
    }

    if (this.uniqueKeys.length) {
      table.uniqueKeys = this.uniqueKeys.map(key => key.clone());
    }

    if (this.foreignKeys.length) {
      table.foreignKeys = this.foreignKeys.map(key => key.clone());
    }

    if (this.fulltextIndexes.length) {
      table.fulltextIndexes = this.fulltextIndexes.map(index => index.clone());
    }

    if (this.spatialIndexes.length) {
      table.spatialIndexes = this.spatialIndexes.map(index => index.clone());
    }

    if (this.indexes.length) {
      table.indexes = this.indexes.map(index => index.clone());
    }

    return table;
  }

  /**
   * Get table with given name.
   *
   * @param {string} name Table name.
   * @returns {Table} Table result.
   */
  getTable(name) {
    return this.database.getTable(name);
  }

  /**
   * Get tables from database.
   *
   * @returns {Table[]} Database tables.
   */
  getTables() {
    return this.database.getTables();
  }


  /**
   * Setter for database.
   *
   * @param {Database} database Database instance.
   * @returns {void}
   */
  setDatabase(database) {
    this.database = database;
  }

  /**
   * Add a column to columns array, in a given position.
   *
   * @param {Column} column Column to be added.
   * @param {any} position Position object.
   * @returns {void}
   */
  addColumn(column, position = null) {
    /**
     * Should not add column with same name.
     */
    if (this.getColumn(column.name)) {
      return;
    }

    // TODO: validate - there should not be two autoincrement columns (?)

    if (position === null) {
      this.columns.push(column);
    }
    else if (position.after === null) {
      this.columns.unshift(column);
    }
    else {
      const refColumn = this.columns.find(c => c.name === position.after);

      if (!refColumn) {
        // throw new Error(`Trying to add a column ${column.name} to table ${this.name} after unexisting column ${position.after}`);
        return;
      }

      const pos = this.columns.indexOf(refColumn);
      const end = this.columns.splice(pos + 1);
      this.columns.push(column);
      this.columns = this.columns.concat(end);
    }

    this.extractColumnFeatures(column);
  }

  /**
   * Extract column features like PrimaryKey, ForeignKey,
   * UniqueKey and add them to this table instance.
   *
   * @param {Column} column Column to be extracted.
   * @returns {void}
   */
  extractColumnFeatures(column) {

    /** @type {PrimaryKey} */
    const primaryKey = column.extractPrimaryKey();

    /** @type {ForeignKey} */
    const foreignKey = column.extractForeignKey();

    /** @type {UniqueKey} */
    const uniqueKey = column.extractUniqueKey();

    if (primaryKey) {
      this.setPrimaryKey(primaryKey);
    }

    if (foreignKey) {
      this.pushForeignKey(foreignKey);
    }

    if (uniqueKey) {
      this.pushUniqueKey(uniqueKey);
    }
  }

  /**
   * Move a column to a given position.
   *
   * @param {Column} column One of this table colu
   * @param {*} position Position object.
   * @returns {void}
   */
  moveColumn(column, position) {
    if (position && position.after) {
      const refColumn = this.columns.find(c => c.name === position.after);
      if (!refColumn) {
        return;
      }
    }

    this.dropColumn(column);
    this.addColumn(column, position);
  }

  /**
   * Get column position object.
   *
   * @param {Column} column Column.
   * @returns {any} Column position object.
   */
  getColumnPosition(column) {
    const index = this.columns.indexOf(column);

    if (index === 0) {
      return { after: null };
    }
    else if (index + 1 === this.columns.length) {
      return null;
    }
    else {
      const refColumn = this.columns[index - 1];
      return { after: refColumn.name };
    }
  }

  /**
   * Drops table's primary key.
   *
   * @returns {void}
   */
  dropPrimaryKey() {

    /**
     * Should not drop primary key if pk column has autoincrement.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/14
     */
    const tableColumns = this.primaryKey.getColumnsFromTable(this);

    if (tableColumns.some(c => c.options && c.options.autoincrement)) {
      return;
    }

    delete this.primaryKey;
  }

  /**
   * Drops a column from table.
   *
   * @param {Column} column Column to be dropped.
   * @returns {void}
   */
  dropColumn(column) {
    // TODO: validate FK reference (https://github.com/duartealexf/sql-ddl-to-json-schema/issues/12)

    /**
     * Should not drop the last column of table.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/13
     */
    if (this.columns.length === 1) {
      return;
    }

    const pos = this.columns.indexOf(column);
    const end = this.columns.splice(pos);
    end.shift();
    this.columns = this.columns.concat(end);

    /**
     * Remove column from indexes. Also remove
     * the index if removed column was last.
     *
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/8
     */

    this.fulltextIndexes.forEach(index => {
      if (index.dropColumn(column.name) && !index.columns.length) {
        this.dropIndex(index);
      }
    });

    this.spatialIndexes.forEach(index => {
      if (index.dropColumn(column.name) && !index.columns.length) {
        this.dropIndex(index);
      }
    });

    this.indexes.forEach(index => {
      if (index.dropColumn(column.name) && !index.columns.length) {
        this.dropIndex(index);
      }
    });

    this.uniqueKeys.forEach(key => {
      if (key.dropColumn(column.name) && !key.columns.length) {
        this.dropIndex(key);
      }
    });

    this.foreignKeys.forEach(key => {
      if (key.dropColumn(column.name) && !key.columns.length) {
        this.dropForeignKey(key);
      }
    });

    if (utils.isDefined(this.primaryKey)) {
      if (this.primaryKey.dropColumn(column.name) && !this.primaryKey.columns.length) {
        delete this.primaryKey;
      }
    }
  }

  /**
   * Drops an index from table.
   *
   * @param {UniqueKey|Index|FulltextIndex|SpatialIndex} index Index to be dropped.
   * @returns {void}
   */
  dropIndex(index) {
    const type = this.getIndexType(index.name);
    const pos = this[type].indexOf(index);
    const end = this[type].splice(pos);
    end.shift();
    this[type] = this[type].concat(end);
  }

  /**
   * Drops a foreign key from table.
   *
   * @param {ForeignKey} foreignKey Foreign key to be dropped.
   * @returns {void}
   */
  dropForeignKey(foreignKey) {
    const pos = this.foreignKeys.indexOf(foreignKey);
    const end = this.foreignKeys.splice(pos);
    end.shift();
    this.foreignKeys = this.foreignKeys.concat(end);
  }

  /**
   * Get index by name.
   *
   * @param {string} name Index name.
   * @returns {UniqueKey|Index|FulltextIndex|SpatialIndex} Found index.
   */
  getIndex(name) {
    const type = this.getIndexType(name);

    if (!type) {
      // throw new Error(`Trying to reference an unexsisting index ${name} on table ${this.name}`);
      return;
    }

    return this[type].find(i => i.name === name);
  }

  /**
   * Get which index array is storing a given index.
   *
   * @param {string} name Index name.
   * @returns {string} Index type.
   */
  getIndexType(name) {
    const type = [
      'uniqueKeys',
      'indexes',
      'fulltextIndexes',
      'spatialIndexes'
    ].find(array => {
      return this[array].some(i => i.name === name);
    });

    return type;
  }

  /**
   * Get column by name.
   *
   * @param {string} name Column name.
   * @returns {Column} Column found.
   */
  getColumn(name) {
    return this.columns.find(c => c.name === name);
  }

  /**
   * Get foreign key by name.
   *
   * @param {string} name Foreign key name.
   * @returns {ForeignKey} Foreign key found.
   */
  getForeignKey(name) {
    return this.foreignKeys.find(k => k.name === name);
  }

  /**
   * Whether there is a foreign key with given name in table.
   *
   * @param {string} name Foreign key name.
   * @returns {boolean} Whether key exists.
   */
  hasForeignKey(name) {
    return this.foreignKeys.some(k => k.name === name);
  }

  /**
   * Setter for table's primary key.
   *
   * @param {PrimaryKey} primaryKey Primary key.
   * @returns {void}
   */
  setPrimaryKey(primaryKey) {

    /**
     * Should not add primary key over another one.
     */
    if (this.primaryKey) {
      return;
    }

    /**
     * Validate columns referenced by primary key.
     */
    if (!primaryKey.hasAllColumnsFromTable(this)) {
      return;
    }

    this.primaryKey = primaryKey;
  }

  /**
   * Push a fulltext index to fulltextIndexes array.
   *
   * @param {FulltextIndex} fulltextIndex Index to be pushed.
   * @returns {void}
   */
  pushFulltextIndex(fulltextIndex) {

    /**
     * Should not add index or key with same name.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/15
     */
    if (fulltextIndex.name && this.getIndex(fulltextIndex.name)) {
      return;
    }

    /**
     * Validate columns referenced by fulltext index.
     */
    if (!fulltextIndex.hasAllColumnsFromTable(this)) {
      return;
    }

    this.fulltextIndexes.push(fulltextIndex);
  }

  /**
   * Push a spatial index to spatialIndexes array.
   *
   * @param {SpatialIndex} spatialIndex Index to be pushed.
   * @returns {void}
   */
  pushSpatialIndex(spatialIndex) {

    /**
     * Should not add index or key with same name.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/15
     */
    if (spatialIndex.name && this.getIndex(spatialIndex.name)) {
      return;
    }

    /**
     * Validate columns referenced by spatial index.
     */
    if (!spatialIndex.hasAllColumnsFromTable(this)) {
      return;
    }

    this.spatialIndexes.push(spatialIndex);
  }

  /**
   * Push an unique key to uniqueKeys array.
   *
   * @param {UniqueKey} uniqueKey UniqueKey to be pushed.
   * @returns {void}
   */
  pushUniqueKey(uniqueKey) {

    /**
     * Should not add index or key with same name.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/15
     */
    if (uniqueKey.name && this.getIndex(uniqueKey.name)) {
      return;
    }

    /**
     * Validate columns referenced by unique key.
     */
    if (!uniqueKey.hasAllColumnsFromTable(this)) {
      return;
    }

    this.uniqueKeys.push(uniqueKey);
  }

  /**
   * Push a foreign key to foreignKeys array.
   *
   * @param {ForeignKey} foreignKey ForeignKey to be pushed.
   * @returns {void}
   */
  pushForeignKey(foreignKey) {

    /**
     * Should not add index or key with same name.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/15
     */
    if (foreignKey.name && this.getIndex(foreignKey.name)) {
      return;
    }

    /**
     * Validate if referenced table exists.
     */
    const referencedTable = foreignKey.getReferencedTable(this.getTables());
    if (!referencedTable) { return; }

    /**
     * Validate columns.
     */
    const hasAllColumnsFromThisTable = foreignKey.hasAllColumnsFromTable(this);
    const hasAllColumnsFromReference = foreignKey.hasAllColumnsFromRefTable(referencedTable);

    if (!hasAllColumnsFromThisTable || !hasAllColumnsFromReference) { return; }

    // TODO: Validate circular reference?

    this.foreignKeys.push(foreignKey);
  }

  /**
   * Push an index to indexes array.
   *
   * @param {Index} index Index to be pushed.
   * @returns {void}
   */
  pushIndex(index) {

    /**
     * Should not add index or key with same name.
     * https://github.com/duartealexf/sql-ddl-to-json-schema/issues/15
     */
    if (index.name && this.getIndex(index.name)) {
      return;
    }

    /**
     * Validate columns referenced by index.
     */
    if (!index.hasAllColumnsFromTable(this)) {
      return;
    }

    this.indexes.push(index);
  }
}

module.exports = Table;