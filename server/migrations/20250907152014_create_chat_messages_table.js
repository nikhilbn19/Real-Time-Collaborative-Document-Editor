exports.up = function (knex) {
  return knex.schema.createTable("chat_messages", (table) => {
    table.increments("id").primary();
    table
      .integer("document_id")
      .unsigned()
      .references("id")
      .inTable("documents")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("message").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("chat_messages");
};
