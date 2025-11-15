const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Cargar el archivo proto
const PROTO_PATH = path.join(__dirname, '../src/proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Crear cliente gRPC
const client = new productProto.ProductService(
  `localhost:${process.env.GRPC_PORT || 50052}`,
  grpc.credentials.createInsecure()
);

/**
 * Utilidad para esperar entre pruebas
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Prueba 1: Crear un producto
 */
async function testCreateProduct() {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Prueba 1: Crear Producto');
    console.log('─'.repeat(50));

    // Crear una imagen de prueba (imagen pequeña de 1x1 pixel en base64)
    const testImage = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
      'base64'
    );

    const request = {
      name: 'Producto de Prueba gRPC',
      description: 'Este es un producto creado desde el cliente de prueba gRPC para validar el funcionamiento del microservicio.',
      price: 99.99,
      category: 'Test',
      image: testImage,
      imageFileName: 'test-product.jpg',
      adminId: '550e8400-e29b-41d4-a716-446655440000' // UUID de ejemplo
    };

    client.CreateProduct(request, (error, response) => {
      if (error) {
        console.error('❌ Error:', error.message);
        reject(error);
        return;
      }

      if (response.success) {
        console.log('✅ Producto creado exitosamente');
        console.log('📦 Detalles:');
        console.log(`   ID: ${response.product.id}`);
        console.log(`   Nombre: ${response.product.name}`);
        console.log(`   Precio: $${response.product.price}`);
        console.log(`   Categoría: ${response.product.category}`);
        console.log(`   URL Imagen: ${response.product.imageUrl}`);
        resolve(response.product);
      } else {
        console.log('❌ Error:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

/**
 * Prueba 2: Listar todos los productos
 */
async function testGetProducts() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Prueba 2: Listar Productos');
    console.log('─'.repeat(50));

    const request = {};

    client.GetProducts(request, (error, response) => {
      if (error) {
        console.error('❌ Error:', error.message);
        reject(error);
        return;
      }

      if (response.success) {
        console.log(`✅ Se encontraron ${response.total} productos`);
        
        if (response.products.length > 0) {
          console.log('\n📦 Lista de productos:');
          response.products.slice(0, 5).forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Precio: $${product.price}`);
            console.log(`   Categoría: ${product.category}`);
            console.log(`   Activo: ${product.isActive ? 'Sí' : 'No'}`);
          });
          
          if (response.products.length > 5) {
            console.log(`\n   ... y ${response.products.length - 5} productos más`);
          }
        }
        
        resolve(response.products);
      } else {
        console.log('❌ Error:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

/**
 * Prueba 3: Buscar producto por ID
 */
async function testGetProductById(productId) {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 Prueba 3: Buscar Producto por ID');
    console.log('─'.repeat(50));
    console.log(`Buscando producto: ${productId}`);

    const request = { id: productId };

    client.GetProductById(request, (error, response) => {
      if (error) {
        console.error('❌ Error:', error.message);
        reject(error);
        return;
      }

      if (response.success) {
        console.log('✅ Producto encontrado');
        console.log('📦 Detalles completos:');
        console.log(`   ID: ${response.product.id}`);
        console.log(`   Nombre: ${response.product.name}`);
        console.log(`   Descripción: ${response.product.description}`);
        console.log(`   Precio: $${response.product.price}`);
        console.log(`   Categoría: ${response.product.category}`);
        console.log(`   URL Imagen: ${response.product.imageUrl}`);
        console.log(`   Activo: ${response.product.isActive ? 'Sí' : 'No'}`);
        console.log(`   Creado: ${response.product.createdAt}`);
        console.log(`   Actualizado: ${response.product.updatedAt}`);
        resolve(response.product);
      } else {
        console.log('❌ Error:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

/**
 * Prueba 4: Actualizar producto
 */
async function testUpdateProduct(productId) {
  return new Promise((resolve, reject) => {
    console.log('\n✏️ Prueba 4: Actualizar Producto');
    console.log('─'.repeat(50));

    const request = {
      id: productId,
      name: 'Producto Actualizado gRPC',
      description: 'Descripción actualizada desde el cliente de prueba',
      price: 149.99,
      category: 'Test Actualizado',
      adminId: '550e8400-e29b-41d4-a716-446655440000'
    };

    client.UpdateProduct(request, (error, response) => {
      if (error) {
        console.error('❌ Error:', error.message);
        reject(error);
        return;
      }

      if (response.success) {
        console.log('✅ Producto actualizado exitosamente');
        console.log('📦 Nuevos datos:');
        console.log(`   Nombre: ${response.product.name}`);
        console.log(`   Precio: $${response.product.price}`);
        console.log(`   Categoría: ${response.product.category}`);
        resolve(response.product);
      } else {
        console.log('❌ Error:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

/**
 * Prueba 5: Eliminar producto (soft delete)
 */
async function testDeleteProduct(productId) {
  return new Promise((resolve, reject) => {
    console.log('\n🗑️ Prueba 5: Eliminar Producto (Soft Delete)');
    console.log('─'.repeat(50));

    const request = {
      id: productId,
      adminId: '550e8400-e29b-41d4-a716-446655440000'
    };

    client.DeleteProduct(request, (error, response) => {
      if (error) {
        console.error('❌ Error:', error.message);
        reject(error);
        return;
      }

      if (response.success) {
        console.log('✅', response.message);
        resolve();
      } else {
        console.log('❌ Error:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

/**
 * Prueba 6: Filtrar productos por categoría
 */
async function testFilterByCategory(category) {
  return new Promise((resolve, reject) => {
    console.log('\n🔎 Prueba 6: Filtrar Productos por Categoría');
    console.log('─'.repeat(50));
    console.log(`Categoría: ${category}`);

    const request = { category };

    client.GetProducts(request, (error, response) => {
      if (error) {
        console.error('❌ Error:', error.message);
        reject(error);
        return;
      }

      if (response.success) {
        console.log(`✅ Se encontraron ${response.total} productos en la categoría "${category}"`);
        
        if (response.products.length > 0) {
          response.products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - $${product.price}`);
          });
        }
        
        resolve(response.products);
      } else {
        console.log('❌ Error:', response.message);
        reject(new Error(response.message));
      }
    });
  });
}

/**
 * Ejecuta todas las pruebas
 */
async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('🧪 INICIANDO PRUEBAS DEL CLIENTE gRPC');
  console.log('═'.repeat(50));

  try {
    // Prueba 1: Crear producto
    const newProduct = await testCreateProduct();
    await wait(1000);

    // Prueba 2: Listar productos
    const products = await testGetProducts();
    await wait(1000);

    // Prueba 3: Buscar por ID (usar el primer producto de la lista)
    if (products.length > 0) {
      await testGetProductById(products[0].id);
      await wait(1000);
    }

    // Prueba 4: Actualizar el producto creado
    if (newProduct) {
      await testUpdateProduct(newProduct.id);
      await wait(1000);
    }

    // Prueba 6: Filtrar por categoría
    await testFilterByCategory('Electrónica');
    await wait(1000);

    // Prueba 5: Eliminar el producto creado (al final para no afectar otras pruebas)
    if (newProduct) {
      await testDeleteProduct(newProduct.id);
    }

    console.log('\n');
    console.log('═'.repeat(50));
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('═'.repeat(50));
    console.log('\n');

  } catch (error) {
    console.error('\n');
    console.error('═'.repeat(50));
    console.error('❌ ERROR EN LAS PRUEBAS');
    console.error('═'.repeat(50));
    console.error(error);
    console.error('\n');
  } finally {
    process.exit(0);
  }
}

// Ejecutar las pruebas
runAllTests();