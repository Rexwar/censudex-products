const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const database = require('./config/database');
const { testConnection } = require('./config/cloudinary');
const productService = require('./services/productService');

/**
 * Configuración de carga del archivo proto
 */
const PROTO_PATH = path.join(__dirname, 'proto', 'product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

/**
 * Inicia el servidor gRPC
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor gRPC de Products Service...');

    // Conectar a MongoDB
    await database.connect();

    // Verificar conexión con Cloudinary
    const cloudinaryConnected = await testConnection();
    if (!cloudinaryConnected) {
      console.warn('⚠️ No se pudo conectar con Cloudinary. Las operaciones con imágenes fallarán.');
    }

    // Inicializar el servicio de productos
    productService.initialize();

    // Crear servidor gRPC
    const server = new grpc.Server();

    // Agregar el servicio
    server.addService(productProto.ProductService.service, {
      createProduct: productService.createProduct.bind(productService),
      getProducts: productService.getProducts.bind(productService),
      getProductById: productService.getProductById.bind(productService),
      updateProduct: productService.updateProduct.bind(productService),
      deleteProduct: productService.deleteProduct.bind(productService)
    });

    // Configurar puerto
    const PORT = process.env.GRPC_PORT || 50052;
    const HOST = '0.0.0.0';

    // Iniciar servidor
    server.bindAsync(
      `${HOST}:${PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error('❌ Error al iniciar servidor gRPC:', error);
          process.exit(1);
        }

        console.log('✅ Servidor gRPC iniciado correctamente');
        console.log(`📡 Escuchando en ${HOST}:${port}`);
        console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log('📦 Servicios disponibles:');
        console.log('   - CreateProduct');
        console.log('   - GetProducts');
        console.log('   - GetProductById');
        console.log('   - UpdateProduct');
        console.log('   - DeleteProduct');
      }
    );

    // Manejo de señales para cierre graceful
    process.on('SIGINT', async () => {
      console.log('\n⚠️ Recibida señal SIGINT. Cerrando servidor...');
      server.tryShutdown(async () => {
        await database.disconnect();
        console.log('👋 Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('\n⚠️ Recibida señal SIGTERM. Cerrando servidor...');
      server.tryShutdown(async () => {
        await database.disconnect();
        console.log('👋 Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();