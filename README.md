# MongoDB Bookstore Project

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Community Edition
- MongoDB Shell (mongosh)
- Git

## Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd mongodb-data-layer-fundamentals
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure MongoDB**
   - Create a `.env` file in the root directory
   - Add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/plp_bookstore
   ```

## Project Structure

```
├── insert_books.js          # Initial data insertion script
├── queries.js               # Basic CRUD operations
└── .env                     # Environment variables
```

## Running the Project

1. **Start MongoDB Service**
   ```bash
   # Windows (Run as Administrator)
   net start MongoDB
   ```

2. **Initialize Database**
   ```bash
   node insert_books.js
   ```

3. **Run Different Query Operations**

   - Basic CRUD Operations:
   ```bash
   node mongodb_queries.js
   ```

   - Advanced Queries:
   ```bash
   node advanced_queries.js
   ```

   - Aggregation Pipelines:
   ```bash
   node aggregation_queries.js
   ```

   - Create Indexes:
   ```bash
   node indexing.js
   ```

## Available Operations

### Basic Queries
- Find books by genre
- Find books by publication year
- Find books by author
- Update book prices
- Delete books

### Advanced Queries
- Find in-stock books published after 2010
- Query with field projections
- Sort books by price
- Implement pagination

### Aggregation Operations
- Calculate average price by genre
- Find most published authors
- Group books by decade

### Indexing
- Single field index on title
- Compound index on author and published year
- Performance analysis with explain()

## Troubleshooting

1. **MongoDB Connection Issues**
   - Verify MongoDB is running: `mongosh`
   - Check connection string in `.env`
   - Ensure correct MongoDB port (default: 27017)

2. **Data Import Issues**
   - Run `insert_books.js` first
   - Check database name matches connection string
   - Verify MongoDB user permissions

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js MongoDB Driver](https://mongodb.github.io/node-mongodb-native/)
- [MongoDB University](https://university.mongodb.com/)

## License

This project is licensed under the MIT License - see the LICENSE file for details
