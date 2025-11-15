const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Clase para gestionar la conexión a MongoDB
 */
class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  /**
   * Conecta a la base de datos MongoDB
   * @returns {Promise<boolean>} - Retorna true si la conexión es exitosa
   */
  async connect() {
    try {
      // Validar que exista la URI de conexión
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }

      // Crear cliente de MongoDB
      this.client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // Conectar al servidor
      await this.client.connect();

      // Seleccionar la base de datos
      this.db = this.client.db(process.env.MONGODB_DB_NAME || 'censudex_products');

      // Verificar la conexión
      await this.client.db().admin().ping();

      console.log('✅ Conectado exitosamente a MongoDB');
      console.log(`📊 Base de datos: ${this.db.databaseName}`);

      // Crear índices necesarios
      await this.createIndexes();

      return true;
    } catch (error) {
      console.error('❌ Error al conectar a MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Crea índices necesarios en las colecciones
   */
  async createIndexes() {
    try {
      const productsCollection = this.db.collection('products');

      // Índice único para el nombre del producto
      await productsCollection.createIndex(
        { name: 1 },
        { unique: true, name: 'unique_product_name' }
      );

      // Índice para búsquedas por categoría
      await productsCollection.createIndex(
        { category: 1 },
        { name: 'category_index' }
      );

      // Índice para filtrar por estado activo/inactivo
      await productsCollection.createIndex(
        { isActive: 1 },
        { name: 'active_status_index' }
      );

      // Índice de texto para búsquedas por nombre
      await productsCollection.createIndex(
        { name: 'text', description: 'text' },
        { name: 'text_search_index' }
      );

      console.log('✅ Índices creados correctamente');
    } catch (error) {
      console.error('⚠️ Error al crear índices:', error.message);
    }
  }

  /**
   * Obtiene la instancia de la base de datos
   * @returns {Db} - Instancia de la base de datos MongoDB
   */
  getDb() {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  /**
   * Obtiene una colección específica
   * @param {string} collectionName - Nombre de la colección
   * @returns {Collection} - Colección de MongoDB
   */
  getCollection(collectionName) {
    return this.getDb().collection(collectionName);
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('✅ Desconectado de MongoDB');
      }
    } catch (error) {
      console.error('❌ Error al desconectar de MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Verifica si la conexión está activa
   * @returns {boolean}
   */
  isConnected() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }
}

// Exportar una instancia única (Singleton)
const database = new Database();

module.exports = database;