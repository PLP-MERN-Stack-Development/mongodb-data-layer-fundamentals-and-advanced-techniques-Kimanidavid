
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plp_bookstore';
const dbName = process.env.MONGODB_DB || 'plp_bookstore';
const collectionName = 'books';

async function withClient(fn) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    return await fn(db);
  } finally {
    await client.close();
  }
}

/*
 task 2: 
Calculate average price of books by genre
*/
async function findByGenre(genre) {
  return withClient(async (db) => {
    const docs = await db.collection(collectionName).find({ genre }).toArray();
    console.log(`Found ${docs.length} book(s) in genre \"${genre}\":`);
    docs.forEach((d, i) => console.log(`${i + 1}. ${d.title} — ${d.author} (${d.published_year})`));
    return docs;
  });
}

// find books published after a specific year
async function findPublishedAfter(year) {
  return withClient(async (db) => {
    const docs = await db.collection(collectionName).find({ published_year: { $gt: Number(year) } }).toArray();
    console.log(`Found ${docs.length} book(s) published after ${year}:`);
    docs.forEach((d, i) => console.log(`${i + 1}. ${d.title} — ${d.author} (${d.published_year})`));
    return docs;
  });
}

// find books by author
async function findByAuthor(author) {
  return withClient(async (db) => {
    const docs = await db.collection(collectionName).find({ author }).toArray();
    console.log(`Found ${docs.length} book(s) by ${author}:`);
    docs.forEach((d, i) => console.log(`${i + 1}. ${d.title} — ${d.genre} (${d.published_year})`));
    return docs;
  });
}

// update book price by title
async function updatePriceByTitle(title, newPrice) {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).updateOne({ title }, { $set: { price: Number(newPrice) } });
    if (result.matchedCount === 0) {
      console.log(`No book found with title \"${title}\"`);
    } else {
      console.log(`Updated price for \"${title}\". Modified count: ${result.modifiedCount}`);
    }
    return result;
  });
}

// delete book by title
async function deleteByTitle(title) {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).deleteOne({ title });
    if (result.deletedCount === 0) {
      console.log(`No book deleted. No matching title \"${title}\"`);
    } else {
      console.log(`Deleted book with title \"${title}\"`);
    }
    return result;
  });
}

/*
 task 3: Advanced Queries
 */

// Find books that are both in stock and published after 2010
async function findInStockAndRecent() {
  return withClient(async (db) => {
    const docs = await db.collection(collectionName)
      .find({ 
        in_stock: true, 
        published_year: { $gt: 2010 } 
      })
      .project({ title: 1, author: 1, price: 1, published_year: 1 })
      .toArray();
    
    console.log(`Found ${docs.length} books in stock and published after 2010:`);
    docs.forEach((d, i) => console.log(
      `${i + 1}. ${d.title} by ${d.author} (${d.published_year}) - $${d.price}`
    ));
    return docs;
  });
}

//Query with projection (only title, author, and price)
async function findWithProjection(query = {}) {
  return withClient(async (db) => {
    const docs = await db.collection(collectionName)
      .find(query)
      .project({ title: 1, author: 1, price: 1, _id: 0 })
      .toArray();
    
    console.log(`Found ${docs.length} books (showing title, author, and price only):`);
    docs.forEach((d, i) => console.log(
      `${i + 1}. "${d.title}" by ${d.author} - $${d.price}`
    ));
    return docs;
  });
}

//Sort books by price
async function sortByPrice(order = 'asc') {
  return withClient(async (db) => {
    const sortOrder = order === 'desc' ? -1 : 1;
    const docs = await db.collection(collectionName)
      .find({})
      .project({ title: 1, author: 1, price: 1 })
      .sort({ price: sortOrder })
      .toArray();
    
    console.log(`Books sorted by price (${order === 'desc' ? 'highest' : 'lowest'} first):`);
    docs.forEach((d, i) => console.log(
      `${i + 1}. "${d.title}" by ${d.author} - $${d.price}`
    ));
    return docs;
  });
}

// Implementing pagination
async function paginateBooks(page = 1, perPage = 5) {
  return withClient(async (db) => {
    // Get total count for page info
    const total = await db.collection(collectionName).countDocuments();
    const totalPages = Math.ceil(total / perPage);
    
    // Validate page number
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    const docs = await db.collection(collectionName)
      .find({})
      .project({ title: 1, author: 1, price: 1 })
      .sort({ title: 1 }) // Sort by title for consistent pagination
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray();
    
    console.log(`\nShowing page ${page} of ${totalPages} (${total} total books):`);
    docs.forEach((d, i) => console.log(
      `${(page - 1) * perPage + i + 1}. "${d.title}" by ${d.author} - $${d.price}`
    ));
    
    if (page < totalPages) {
      console.log(`\nUse: node advanced_queries.js paginate ${page + 1} to see next page`);
    }
    return { docs, page, totalPages, total };
  });
}


/* 
task 4: Aggregation pipeline Queries
*/
// Calculate average price of books by genre
async function averagePriceByGenre() {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: "$genre",
          averagePrice: { $avg: "$price" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    console.log('\nAverage book prices by genre:');
    result.forEach(genre => {
      console.log(`${genre._id}: $${genre.averagePrice.toFixed(2)} (${genre.count} books)`);
    });
    return result;
  });
}

// Find author with the most books in collection
async function findMostPublishedAuthor() {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: "$author",
          bookCount: { $sum: 1 },
          titles: { $push: "$title" }
        }
      },
      {
        $sort: { bookCount: -1, _id: 1 }
      },
      {
        $limit: 1
      }
    ]).toArray();

    if (result.length > 0) {
      const author = result[0];
      console.log(`\nAuthor with most books: ${author._id} (${author.bookCount} books)`);
      console.log('Titles:', author.titles.join(', '));
    }
    return result[0];
  });
}

// Group books by publication decade and count them
async function booksByDecade() {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: {
            $concat: [
              { $substr: [{ $subtract: ["$published_year", { $mod: ["$published_year", 10] }] }, 0, 4] },
              "s"
            ]
          },
          count: { $sum: 1 },
          books: {
            $push: {
              title: "$title",
              year: "$published_year",
              author: "$author"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    console.log('\nBooks grouped by decade:');
    result.forEach(decade => {
      console.log(`\n${decade._id}:`);
      decade.books
        .sort((a, b) => a.year - b.year)
        .forEach(book => {
          console.log(`  ${book.year}: "${book.title}" by ${book.author}`);
        });
    });
    return result;
  });
}

// Find author with the most books in collection
async function findMostPublishedAuthor() {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: "$author",
          bookCount: { $sum: 1 },
          titles: { $push: "$title" }
        }
      },
      {
        $sort: { bookCount: -1, _id: 1 }
      },
      {
        $limit: 1
      }
    ]).toArray();

    if (result.length > 0) {
      const author = result[0];
      console.log(`\nAuthor with most books: ${author._id} (${author.bookCount} books)`);
      console.log('Titles:', author.titles.join(', '));
    }
    return result[0];
  });
}

// Group books by publication decade and count them
async function booksByDecade() {
  return withClient(async (db) => {
    const result = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: {
            $concat: [
              { $substr: [{ $subtract: ["$published_year", { $mod: ["$published_year", 10] }] }, 0, 4] },
              "s"
            ]
          },
          count: { $sum: 1 },
          books: {
            $push: {
              title: "$title",
              year: "$published_year",
              author: "$author"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    console.log('\nBooks grouped by decade:');
    result.forEach(decade => {
      console.log(`\n${decade._id}:`);
      decade.books
        .sort((a, b) => a.year - b.year)
        .forEach(book => {
          console.log(`  ${book.year}: "${book.title}" by ${book.author}`);
        });
    });
    return result;
  });
}

/*
task 5: Indexing and Performance
*/
//Create indexes for the books collection
async function createIndexes() {
  return withClient(async (db) => {
    console.log('Creating indexes...');
    
    // Create index on title field
    const titleIndex = await db.collection(collectionName).createIndex(
      { title: 1 },
      { name: 'idx_title' }
    );
    console.log('Created index on title field:', titleIndex);

    // Create compound index on author and published_year
    const authorYearIndex = await db.collection(collectionName).createIndex(
      { author: 1, published_year: -1 },
      { name: 'idx_author_year' }
    );
    console.log('Created compound index on author and published_year:', authorYearIndex);

    // List all indexes to verify
    const indexes = await db.collection(collectionName).listIndexes().toArray();
    console.log('\nCurrent indexes in collection:');
    indexes.forEach(idx => {
      console.log('- Index:', idx.name, 'Key:', JSON.stringify(idx.key));
    });
  });
}

// Demonstrate query performance with explain()

async function demonstrateIndexPerformance() {
  return withClient(async (db) => {
    const collection = db.collection(collectionName);

    console.log('\n1. Query by title (using title index):');
    const titleQuery = await collection.find({ title: "1984" })
      .explain('executionStats');
    console.log('- Execution stats:');
    console.log('  Documents examined:', titleQuery.executionStats.totalDocsExamined);
    console.log('  Using index:', titleQuery.queryPlanner.winningPlan.inputStage.indexName);
    console.log('  Execution time:', titleQuery.executionStats.executionTimeMillis, 'ms');

    console.log('\n2. Query by author and year (using compound index):');
    const authorYearQuery = await collection.find({
      author: "George Orwell",
      published_year: { $lt: 1950 }
    }).explain('executionStats');
    console.log('- Execution stats:');
    console.log('  Documents examined:', authorYearQuery.executionStats.totalDocsExamined);
    console.log('  Using index:', authorYearQuery.queryPlanner.winningPlan.inputStage.indexName);
    console.log('  Execution time:', authorYearQuery.executionStats.executionTimeMillis, 'ms');

    console.log('\n3. Query without index (for comparison):');
    const noIndexQuery = await collection.find({
      price: { $gt: 10 }
    }).explain('executionStats');
    console.log('- Execution stats:');
    console.log('  Documents examined:', noIndexQuery.executionStats.totalDocsExamined);
    console.log('  Using index:', noIndexQuery.queryPlanner.winningPlan.stage === 'COLLSCAN' ? 'No (collection scan)' : 'Yes');
    console.log('  Execution time:', noIndexQuery.executionStats.executionTimeMillis, 'ms');
  });
}

// Drop all indexes (useful for testing)
async function dropIndexes() {
  return withClient(async (db) => {
    await db.collection(collectionName).dropIndexes();
    console.log('Dropped all indexes');
  });
}

// Export functions for programmatic use
module.exports = {
  findByGenre,
  findPublishedAfter,
  findByAuthor,
  updatePriceByTitle,
  deleteByTitle,
  findInStockAndRecent,
  findWithProjection,
  sortByPrice,
  paginateBooks,
  averagePriceByGenre,
  findMostPublishedAuthor,
  booksByDecade,
  createIndexes,
  demonstrateIndexPerformance,
  dropIndexes
};