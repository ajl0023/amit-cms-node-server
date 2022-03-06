module.exports = {
  types: ["boolean", "string", "date", "integer", "decimal", "media"],
  dataTypes: (type) => {
    switch (type) {
      case "boolean":
        return "boolean";
      case "array":
        return "array";
      case "varchar":
      case "longtext":
      case "tinytext":
      case "text":
      case "mediumtext":
      case "char":
        return "string";
      case "date":
        return "date";
      case "datetime":
        return "date-time";
      case "bigint":
      case "int":
      case "tinyint":
      case "smallint":
      case "timestamp":
        return "integer";
      case "decimal":
      case "double":
      case "float":
        return "number";
      default:
        return "any";
    }
  },
};
