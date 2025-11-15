const database = require('../config/database');
const { uploadImage, deleteImage, updateImage } = require('../config/cloudinary');
const Product = require('../models/Product');
const {
  validatePrice,
  validateProductName,
  validateDescription,
  validateCategory,
  validateImage,
  validateAdminId,
  isValidUUID,
  sanitizeText,
  createErrorResponse,
  createSuccessResponse
} = require('../utils/validators');

/**
 * Servicio de gestión de productos
 */
class ProductService {
  constructor() {
    this.collection = null;
  }

  /**
   * Inicializa la colección de productos
   */
  initialize() {
    this.collection = database.getCollection('products');
  }

  /**
   * Crea un nuevo producto
   * @param {Object} call - Objeto de llamada gRPC
   * @param {Function} callback - Callback de respuesta
   */
  async createProduct(call, callback) {
    try {
      const { name, description, price, category, image, imageFileName, adminId } = call.request;

      console.log('📝 Creando producto:', { name, category, price });

      // Validar adminId
      const adminValidation = validateAdminId(adminId);
      if (!adminValidation.isValid) {
        return callback(null, createErrorResponse(adminValidation.message));
      }

      // Validar nombre
      const nameValidation = validateProductName(name);
      if (!nameValidation.isValid) {
        return callback(null, createErrorResponse(nameValidation.message));
      }

      // Validar descripción
      const descValidation = validateDescription(description);
      if (!descValidation.isValid) {
        return callback(null, createErrorResponse(descValidation.message));
      }

      // Validar precio
      const priceValidation = validatePrice(price);
      if (!priceValidation.isValid) {
        return callback(null, createErrorResponse(priceValidation.message));
      }

      // Validar categoría
      const categoryValidation = validateCategory(category);
      if (!categoryValidation.isValid) {
        return callback(null, createErrorResponse(categoryValidation.message));
      }

      // Validar imagen
      const imageValidation = validateImage(Buffer.from(image), imageFileName);
      if (!imageValidation.isValid) {
        return callback(null, createErrorResponse(imageValidation.message));
      }

      // Verificar si ya existe un producto con el mismo nombre
      const existingProduct = await this.collection.findOne({ 
        name: sanitizeText(name),
        isActive: true 
      });

      if (existingProduct) {
        return callback(null, createErrorResponse('Ya existe un producto con ese nombre'));
      }

      // Subir imagen a Cloudinary
      let imageData;
      try {
        imageData = await uploadImage(Buffer.from(image), imageFileName);
      } catch (error) {
        return callback(null, createErrorResponse(`Error al subir imagen: ${error.message}`));
      }

      // Crear el producto
      const product = new Product({
        name: sanitizeText(name),
        description: sanitizeText(description),
        price,
        category: sanitizeText(category),
        imageUrl: imageData.url,
        imagePublicId: imageData.publicId
      });

      // Validar el producto
      const validation = product.validate();
      if (!validation.isValid) {
        // Si la validación falla, eliminar la imagen subida
        await deleteImage(imageData.publicId).catch(err => 
          console.warn('⚠️ No se pudo eliminar imagen tras error de validación:', err)
        );
        return callback(null, createErrorResponse(validation.errors.join(', ')));
      }

      // Guardar en la base de datos
      await this.collection.insertOne(product.toJSON());

      console.log('✅ Producto creado exitosamente:', product.id);

      callback(null, createSuccessResponse(
        'Producto creado exitosamente',
        { product: product.toGRPC() }
      ));

    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      callback(null, createErrorResponse(`Error interno: ${error.message}`));
    }
  }

  /**
   * Obtiene la lista de productos con filtros opcionales
   * @param {Object} call - Objeto de llamada gRPC
   * @param {Function} callback - Callback de respuesta
   */
  async getProducts(call, callback) {
    try {
      const { category, isActive, searchName } = call.request;

      console.log('📋 Consultando productos con filtros:', { category, isActive, searchName });

      // Construir query de búsqueda
      const query = {};

      if (category) {
        query.category = sanitizeText(category);
      }

      if (isActive !== undefined && isActive !== null) {
        query.isActive = isActive;
      }

      if (searchName) {
        query.$or = [
          { name: { $regex: sanitizeText(searchName), $options: 'i' } },
          { description: { $regex: sanitizeText(searchName), $options: 'i' } }
        ];
      }

      // Ejecutar consulta
      const productDocs = await this.collection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      // Convertir a formato gRPC
      const products = productDocs.map(doc => Product.fromDocument(doc).toGRPC());

      console.log(`✅ Se encontraron ${products.length} productos`);

      callback(null, {
        success: true,
        message: 'Productos obtenidos exitosamente',
        products,
        total: products.length
      });

    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      callback(null, {
        success: false,
        message: `Error interno: ${error.message}`,
        products: [],
        total: 0
      });
    }
  }

  /**
   * Obtiene un producto por su ID
   * @param {Object} call - Objeto de llamada gRPC
   * @param {Function} callback - Callback de respuesta
   */
  async getProductById(call, callback) {
    try {
      const { id } = call.request;

      console.log('🔍 Buscando producto por ID:', id);

      // Validar UUID
      if (!isValidUUID(id)) {
        return callback(null, createErrorResponse('ID de producto inválido'));
      }

      // Buscar el producto
      const productDoc = await this.collection.findOne({ id });

      if (!productDoc) {
        return callback(null, createErrorResponse('Producto no encontrado'));
      }

      const product = Product.fromDocument(productDoc);

      console.log('✅ Producto encontrado:', product.name);

      callback(null, createSuccessResponse(
        'Producto encontrado',
        { product: product.toGRPC() }
      ));

    } catch (error) {
      console.error('❌ Error al obtener producto:', error);
      callback(null, createErrorResponse(`Error interno: ${error.message}`));
    }
  }

  /**
   * Actualiza un producto existente
   * @param {Object} call - Objeto de llamada gRPC
   * @param {Function} callback - Callback de respuesta
   */
  async updateProduct(call, callback) {
    try {
      const { id, name, description, price, category, image, imageFileName, adminId } = call.request;

      console.log('✏️ Actualizando producto:', id);

      // Validar adminId
      const adminValidation = validateAdminId(adminId);
      if (!adminValidation.isValid) {
        return callback(null, createErrorResponse(adminValidation.message));
      }

      // Validar UUID
      if (!isValidUUID(id)) {
        return callback(null, createErrorResponse('ID de producto inválido'));
      }

      // Buscar el producto
      const productDoc = await this.collection.findOne({ id });

      if (!productDoc) {
        return callback(null, createErrorResponse('Producto no encontrado'));
      }

      const product = Product.fromDocument(productDoc);
      const updates = {};

      // Validar y preparar actualizaciones
      if (name) {
        const nameValidation = validateProductName(name);
        if (!nameValidation.isValid) {
          return callback(null, createErrorResponse(nameValidation.message));
        }

        // Verificar si el nuevo nombre ya existe en otro producto
        if (name !== product.name) {
          const existingProduct = await this.collection.findOne({
            name: sanitizeText(name),
            id: { $ne: id },
            isActive: true
          });

          if (existingProduct) {
            return callback(null, createErrorResponse('Ya existe otro producto con ese nombre'));
          }
        }

        updates.name = sanitizeText(name);
      }

      if (description) {
        const descValidation = validateDescription(description);
        if (!descValidation.isValid) {
          return callback(null, createErrorResponse(descValidation.message));
        }
        updates.description = sanitizeText(description);
      }

      if (price) {
        const priceValidation = validatePrice(price);
        if (!priceValidation.isValid) {
          return callback(null, createErrorResponse(priceValidation.message));
        }
        updates.price = price;
      }

      if (category) {
        const categoryValidation = validateCategory(category);
        if (!categoryValidation.isValid) {
          return callback(null, createErrorResponse(categoryValidation.message));
        }
        updates.category = sanitizeText(category);
      }

      // Actualizar imagen si se proporciona
      if (image && image.length > 0) {
        const imageValidation = validateImage(Buffer.from(image), imageFileName);
        if (!imageValidation.isValid) {
          return callback(null, createErrorResponse(imageValidation.message));
        }

        try {
          const newImageData = await updateImage(
            product.imagePublicId,
            Buffer.from(image),
            imageFileName
          );
          updates.imageUrl = newImageData.url;
          updates.imagePublicId = newImageData.publicId;
        } catch (error) {
          return callback(null, createErrorResponse(`Error al actualizar imagen: ${error.message}`));
        }
      }

      // Aplicar actualizaciones
      product.update(updates);

      // Guardar en la base de datos
      await this.collection.updateOne(
        { id },
        { $set: product.toJSON() }
      );

      console.log('✅ Producto actualizado exitosamente:', product.id);

      callback(null, createSuccessResponse(
        'Producto actualizado exitosamente',
        { product: product.toGRPC() }
      ));

    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      callback(null, createErrorResponse(`Error interno: ${error.message}`));
    }
  }

  /**
   * Elimina un producto (soft delete)
   * @param {Object} call - Objeto de llamada gRPC
   * @param {Function} callback - Callback de respuesta
   */
  async deleteProduct(call, callback) {
    try {
      const { id, adminId } = call.request;

      console.log('🗑️ Eliminando producto:', id);

      // Validar adminId
      const adminValidation = validateAdminId(adminId);
      if (!adminValidation.isValid) {
        return callback(null, {
          success: false,
          message: adminValidation.message
        });
      }

      // Validar UUID
      if (!isValidUUID(id)) {
        return callback(null, {
          success: false,
          message: 'ID de producto inválido'
        });
      }

      // Buscar el producto
      const productDoc = await this.collection.findOne({ id });

      if (!productDoc) {
        return callback(null, {
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar si ya está inactivo
      if (!productDoc.isActive) {
        return callback(null, {
          success: false,
          message: 'El producto ya está inactivo'
        });
      }

      // Realizar soft delete
      const product = Product.fromDocument(productDoc);
      product.softDelete();

      await this.collection.updateOne(
        { id },
        { $set: { isActive: false, updatedAt: product.updatedAt } }
      );

      console.log('✅ Producto eliminado (soft delete) exitosamente:', product.id);

      callback(null, {
        success: true,
        message: 'Producto eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      callback(null, {
        success: false,
        message: `Error interno: ${error.message}`
      });
    }
  }
}

module.exports = new ProductService();