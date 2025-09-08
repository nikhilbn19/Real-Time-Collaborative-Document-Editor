exports.up = function (knex) {
  return knex.schema.createTable("documents", (table) => {
    table.increments("id").primary();
    table.string("title").notNullable();
    table.text("content").defaultTo("");
    table.timestamp("last_edited").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("documents");
};
