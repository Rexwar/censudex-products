const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const database = require('../src/config/database');
const Product = require('../src/models/Product');

/**
 * Productos de ejemplo para poblar la base de datos
 */
const seedProducts = [
  {
    name: 'Laptop HP Pavilion 15',
    description: 'Laptop de alto rendimiento con procesador Intel Core i7, 16GB RAM, 512GB SSD. Ideal para trabajo y entretenimiento.',
    price: 899.99,
    category: 'Electrónica',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_laptop'
  },
  {
    name: 'Samsung Galaxy S23',
    description: 'Smartphone de última generación con pantalla AMOLED de 6.1 pulgadas, cámara de 50MP y batería de larga duración.',
    price: 799.99,
    category: 'Electrónica',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_phone'
  },
  {
    name: 'Nike Air Max 270',
    description: 'Zapatillas deportivas con tecnología Air Max. Diseño moderno y cómodo para uso diario o running.',
    price: 149.99,
    category: 'Calzado',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_shoes'
  },
  {
    name: 'Cafetera Nespresso Vertuo',
    description: 'Máquina de café de cápsulas con tecnología Centrifusion. Prepara café y espresso de calidad barista.',
    price: 179.99,
    category: 'Hogar',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_coffee'
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Audífonos inalámbricos con cancelación de ruido líder en la industria. Sonido excepcional y batería de 30 horas.',
    price: 399.99,
    category: 'Electrónica',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_headphones'
  },
  {
    name: 'Libro "Cien Años de Soledad"',
    description: 'Obra maestra de Gabriel García Márquez. Edición especial con tapa dura y páginas ilustradas.',
    price: 24.99,
    category: 'Libros',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_book'
  },
  {
    name: 'Bicicleta de Montaña Trek',
    description: 'Bicicleta todo terreno con suspensión delantera, 21 velocidades y cuadro de aluminio ligero.',
    price: 549.99,
    category: 'Deportes',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_bike'
  },
  {
    name: 'Licuadora Oster Pro',
    description: 'Licuadora de alto rendimiento con motor de 1200W. Ideal para smoothies, sopas y más.',
    price: 89.99,
    category: 'Hogar',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_blender'
  },
  {
    name: 'Reloj Casio G-Shock',
    description: 'Reloj deportivo resistente al agua y golpes. Múltiples funciones y estilo urbano.',
    price: 129.99,
    category: 'Accesorios',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_watch'
  },
  {
    name: 'Mochila North Face Borealis',
    description: 'Mochila resistente con compartimento acolchado para laptop, múltiples bolsillos y diseño ergonómico.',
    price: 99.99,
    category: 'Accesorios',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_backpack'
  }
];

/**
 * Función principal del seeder
 */
async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seeder de productos...');

    // Conectar a la base de datos
    await database.connect();

    const collection = database.getCollection('products');

    // Limpiar colección existente (opcional)
    console.log('🗑️ Limpiando productos existentes...');
    await collection.deleteMany({});

    // Insertar productos de prueba
    console.log('📦 Insertando productos de prueba...');

    const productsToInsert = seedProducts.map(productData => {
      const product = new Product(productData);
      return product.toJSON();
    });

    const result = await collection.insertMany(productsToInsert);

    console.log(`✅ Se insertaron ${result.insertedCount} productos exitosamente`);
    console.log('\n📋 Productos insertados:');
    
    productsToInsert.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (${product.category})`);
    });

    // Mostrar algunos productos de ejemplo
    console.log('\n🔍 Verificando productos en la base de datos:');
    const savedProducts = await collection.find({}).limit(3).toArray();
    
    savedProducts.forEach(product => {
      console.log(`   - ID: ${product.id}`);
      console.log(`     Nombre: ${product.name}`);
      console.log(`     Precio: $${product.price}`);
      console.log(`     Activo: ${product.isActive ? 'Sí' : 'No'}`);
      console.log('');
    });

    console.log('✅ Seeder completado exitosamente');

  } catch (error) {
    console.error('❌ Error al ejecutar el seeder:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Ejecutar el seeder
seedDatabase();